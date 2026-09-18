/**
 * ScoreQuick - Followed Teams & Favorites Manager
 * Handles user's followed teams and drivers across Football, Cricket, and Formula 1.
 * Provides normalized fuzzy matching, dynamic discovery catalog, and verified crests.
 */

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeFootballName(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(fc|cf|sc|afc|club|team|united|city)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

const CRICKET_ALIASES = {
  'csk': ['chennai super kings', 'chennai', 'csk'],
  'mi': ['mumbai indians', 'mumbai', 'mi'],
  'rcb': ['royal challengers bengaluru', 'royal challengers bangalore', 'bengaluru', 'bangalore', 'rcb'],
  'kkr': ['kolkata knight riders', 'kolkata', 'kkr'],
  'dc': ['delhi capitals', 'delhi daredevils', 'delhi', 'dc'],
  'rr': ['rajasthan royals', 'rajasthan', 'rr'],
  'gt': ['gujarat titans', 'gujarat', 'gt'],
  'pbks': ['punjab kings', 'kings xi punjab', 'punjab', 'pbks', 'pk'],
  'srh': ['sunrisers hyderabad', 'hyderabad', 'srh', 'sh'],
  'lsg': ['lucknow super giants', 'lucknow', 'lsg', 'ls'],
  'ind': ['india', 'team india', 'ind'],
  'aus': ['australia', 'aussies', 'aus'],
  'eng': ['england', 'eng'],
  'pak': ['pakistan', 'pak'],
  'sa': ['south africa', 'proteas', 'sa'],
  'nz': ['new zealand', 'blackcaps', 'black caps', 'nz'],
  'wi': ['west indies', 'windies', 'wi'],
  'sl': ['sri lanka', 'sl'],
  'ban': ['bangladesh', 'ban'],
  'afg': ['afghanistan', 'afg'],
  'ire': ['ireland', 'ire'],
  'zim': ['zimbabwe', 'zim'],
  'ned': ['netherlands', 'ned', 'holland'],
  'sco': ['scotland', 'sco'],
  'usa': ['united states', 'usa', 'united states of america'],
  'nep': ['nepal', 'nep'],
  'can': ['canada', 'can'],
  'nam': ['namibia', 'nam'],
  'oma': ['oman', 'oma'],
  'uae': ['united arab emirates', 'uae'],
  'png': ['papua new guinea', 'png'],
  'uga': ['uganda', 'uga'],
  'ita': ['italy', 'ita']
};

export class FavoritesService {
  static STORAGE_KEY = 'scorequick_favorites';

  // 100% clean by default: ONLY user-chosen teams are followed
  static DEFAULT_FAVORITES = {
    football: [],
    cricket: [],
    f1: []
  };

  /**
   * Rich discoverable catalog of popular clubs, leagues, cricket teams, tournaments, and F1
   */
  static DISCOVER_CATALOG = {
    football: [
      // 🏆 Major Football Leagues
      { id: 47, name: 'Premier League', shortName: 'EPL', isLeague: true, category: 'League', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/47.png' },
      { id: 42, name: 'Champions League', shortName: 'UCL', isLeague: true, category: 'League', country: 'INT', logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/42.png' },
      { id: 87, name: 'LaLiga', shortName: 'La Liga', isLeague: true, category: 'League', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/87.png' },
      { id: 54, name: 'Bundesliga', shortName: 'BL', isLeague: true, category: 'League', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/54.png' },
      { id: 55, name: 'Serie A', shortName: 'Serie A', isLeague: true, category: 'League', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/55.png' },
      { id: 53, name: 'Ligue 1', shortName: 'L1', isLeague: true, category: 'League', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/53.png' },
      { id: 73, name: 'Europa League', shortName: 'UEL', isLeague: true, category: 'League', country: 'INT', logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/73.png' },
      { id: 48, name: 'Championship', shortName: 'Champ', isLeague: true, category: 'League', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/48.png' },
      { id: 130, name: 'Major League Soccer', shortName: 'MLS', isLeague: true, category: 'League', country: 'USA', logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/130.png' },
      { id: 57, name: 'Eredivisie', shortName: 'ERE', isLeague: true, category: 'League', country: 'NED', logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/57.png' },

      // ⚽ Top European & Global Clubs
      { id: 9825, name: 'Arsenal', league: 'Premier League', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9825.png' },
      { id: 8633, name: 'Real Madrid', league: 'La Liga', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png' },
      { id: 8634, name: 'Barcelona', league: 'La Liga', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8634.png' },
      { id: 8456, name: 'Manchester City', league: 'Premier League', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png' },
      { id: 8650, name: 'Liverpool', league: 'Premier League', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8650.png' },
      { id: 10260, name: 'Manchester United', league: 'Premier League', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10260.png' },
      { id: 8455, name: 'Chelsea', league: 'Premier League', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8455.png' },
      { id: 9823, name: 'Bayern München', league: 'Bundesliga', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png' },
      { id: 9847, name: 'Paris Saint-Germain', league: 'Ligue 1', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png' },
      { id: 8636, name: 'Inter', league: 'Serie A', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8636.png' },
      { id: 9885, name: 'Juventus', league: 'Serie A', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9885.png' },
      { id: 9799, name: 'AC Milan', league: 'Serie A', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9799.png' },
      { id: 9931, name: 'Bayer Leverkusen', league: 'Bundesliga', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9931.png' },
      { id: 9789, name: 'Borussia Dortmund', league: 'Bundesliga', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9789.png' },
      { id: 9906, name: 'Atlético Madrid', league: 'La Liga', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9906.png' },
      { id: 8586, name: 'Tottenham Hotspur', league: 'Premier League', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8586.png' },
      { id: 10261, name: 'Newcastle United', league: 'Premier League', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10261.png' },
      { id: 10252, name: 'Aston Villa', league: 'Premier League', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10252.png' },
      { id: 10204, name: 'Brighton', league: 'Premier League', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10204.png' },
      { id: 8654, name: 'West Ham United', league: 'Premier League', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8654.png' },
      { id: 9875, name: 'Napoli', league: 'Serie A', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9875.png' },
      { id: 8686, name: 'Roma', league: 'Serie A', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8686.png' },
      { id: 8543, name: 'Lazio', league: 'Serie A', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8543.png' },
      { id: 8524, name: 'Atalanta', league: 'Serie A', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8524.png' },
      { id: 8315, name: 'Athletic Club', league: 'La Liga', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8315.png' },
      { id: 8560, name: 'Real Sociedad', league: 'La Liga', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8560.png' },
      { id: 9812, name: 'Girona', league: 'La Liga', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9812.png' },
      { id: 8302, name: 'Sevilla', league: 'La Liga', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8302.png' },
      { id: 178475, name: 'RB Leipzig', league: 'Bundesliga', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/178475.png' },
      { id: 9829, name: 'Monaco', league: 'Ligue 1', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9829.png' },
      { id: 8592, name: 'Marseille', league: 'Ligue 1', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8592.png' },
      { id: 9768, name: 'Sporting CP', league: 'Liga Portugal', country: 'POR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9768.png' },
      { id: 9772, name: 'Benfica', league: 'Liga Portugal', country: 'POR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9772.png' },
      { id: 9773, name: 'Porto', league: 'Liga Portugal', country: 'POR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9773.png' },
      { id: 8593, name: 'Ajax', league: 'Eredivisie', country: 'NED', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8593.png' },
      { id: 8640, name: 'PSV', league: 'Eredivisie', country: 'NED', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8640.png' },
      { id: 102061, name: 'Al Nassr', league: 'Saudi Pro League', country: 'KSA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/102061.png' },
      { id: 102062, name: 'Al Hilal', league: 'Saudi Pro League', country: 'KSA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/102062.png' },
      { id: 1150495, name: 'Inter Miami', league: 'MLS', country: 'USA', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/20232.png' }
    ],
    cricket: [
      // 🏆 Major Cricket Leagues & Tournaments
      { id: 'ipl', name: 'Indian Premier League', shortName: 'IPL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png' },
      { id: 't20wc', name: 'ICC Men\'s T20 World Cup', shortName: 'T20 WC', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png' },
      { id: 'cwc', name: 'ICC Cricket World Cup', shortName: 'World Cup', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png' },
      { id: 'ct', name: 'ICC Champions Trophy', shortName: 'Champions Trophy', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png' },
      { id: 'wtc', name: 'ICC World Test Championship', shortName: 'WTC', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png' },
      { id: 'bbl', name: 'Big Bash League', shortName: 'BBL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png' },
      { id: 'cpl', name: 'Caribbean Premier League', shortName: 'CPL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png' },
      { id: 'psl', name: 'Pakistan Super League', shortName: 'PSL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png' },
      { id: 'sa20', name: 'SA20', shortName: 'SA20', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png' },
      { id: 'wpl', name: 'Women\'s Premier League', shortName: 'WPL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png' },
      { id: 'thehundred', name: 'The Hundred', shortName: 'Hundred', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png' },
      { id: 'mlc', name: 'Major League Cricket', shortName: 'MLC', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png' },
      { id: 'county', name: 'County Championship', shortName: 'County', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png' },
      { id: 'ashes', name: 'The Ashes', shortName: 'Ashes', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png' },

      // 🏏 Top International Cricket Teams (100% verified ESPNcricinfo CDN logos)
      { id: 'ind', name: 'India', shortName: 'IND', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png' },
      { id: 'aus', name: 'Australia', shortName: 'AUS', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png' },
      { id: 'eng', name: 'England', shortName: 'ENG', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png' },
      { id: 'pak', name: 'Pakistan', shortName: 'PAK', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/7.png' },
      { id: 'sa', name: 'South Africa', shortName: 'SA', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png' },
      { id: 'nz', name: 'New Zealand', shortName: 'NZ', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/5.png' },
      { id: 'wi', name: 'West Indies', shortName: 'WI', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png' },
      { id: 'sl', name: 'Sri Lanka', shortName: 'SL', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/8.png' },
      { id: 'ban', name: 'Bangladesh', shortName: 'BAN', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/25.png' },
      { id: 'afg', name: 'Afghanistan', shortName: 'AFG', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/40.png' },
      { id: 'ire', name: 'Ireland', shortName: 'IRE', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/29.png' },
      { id: 'zim', name: 'Zimbabwe', shortName: 'ZIM', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/9.png' },
      { id: 'sco', name: 'Scotland', shortName: 'SCO', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/30.png' },
      { id: 'ned', name: 'Netherlands', shortName: 'NED', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/15.png' },
      { id: 'usa', name: 'USA', shortName: 'USA', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/11.png' },
      { id: 'nep', name: 'Nepal', shortName: 'NEP', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/33.png' },
      { id: 'can', name: 'Canada', shortName: 'CAN', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/28.png' },
      { id: 'nam', name: 'Namibia', shortName: 'NAM', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/20.png' },
      { id: 'oma', name: 'Oman', shortName: 'OMA', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/37.png' },
      { id: 'uae', name: 'UAE', shortName: 'UAE', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/27.png' },
      { id: 'png', name: 'Papua New Guinea', shortName: 'PNG', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/32.png' },
      { id: 'uga', name: 'Uganda', shortName: 'UGA', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/39.png' },
      { id: 'ita', name: 'Italy', shortName: 'ITA', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/31.png' },

      // 🏟️ All 10 IPL Franchises (100% verified high-res crests)
      { id: 'csk', name: 'Chennai Super Kings', shortName: 'CSK', category: 'IPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/335971.png' },
      { id: 'mi', name: 'Mumbai Indians', shortName: 'MI', category: 'IPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/335978.png' },
      { id: 'rcb', name: 'Royal Challengers Bengaluru', shortName: 'RCB', category: 'IPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/335977.png' },
      { id: 'kkr', name: 'Kolkata Knight Riders', shortName: 'KKR', category: 'IPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/335975.png' },
      { id: 'dc', name: 'Delhi Capitals', shortName: 'DC', category: 'IPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/335973.png' },
      { id: 'rr', name: 'Rajasthan Royals', shortName: 'RR', category: 'IPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/335974.png' },
      { id: 'gt', name: 'Gujarat Titans', shortName: 'GT', category: 'IPL Franchise', logo: 'https://scores.iplt20.com/ipl/teamlogos/GT.png' },
      { id: 'pbks', name: 'Punjab Kings', shortName: 'PBKS', category: 'IPL Franchise', logo: 'https://scores.iplt20.com/ipl/teamlogos/PBKS.png' },
      { id: 'srh', name: 'Sunrisers Hyderabad', shortName: 'SRH', category: 'IPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/628333.png' },
      { id: 'lsg', name: 'Lucknow Super Giants', shortName: 'LSG', category: 'IPL Franchise', logo: 'https://scores.iplt20.com/ipl/teamlogos/LSG.png' },

      // 🌴 CPL Franchises
      { id: 'gaw', name: 'Guyana Amazon Warriors', shortName: 'GAW', category: 'CPL Franchise', logo: 'https://cricketvectors.akamaized.net/Teams/2Y.png' },
      { id: 'tkr', name: 'Trinbago Knight Riders', shortName: 'TKR', category: 'CPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/642417.png' },
      { id: 'br', name: 'Barbados Royals', shortName: 'BR', category: 'CPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/642411.png' },
      { id: 'slk', name: 'St Lucia Kings', shortName: 'SLK', category: 'CPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/642415.png' },
      { id: 'abf', name: 'Antigua & Barbuda Falcons', shortName: 'ABF', category: 'CPL Franchise', logo: 'https://cricketvectors.akamaized.net/Teams/UY.png' },
      { id: 'jkm', name: 'Jamaica Kingsmen', shortName: 'JKM', category: 'CPL Franchise', logo: 'https://cricketvectors.akamaized.net/Teams/1GK.png' },

      // 🦁 Top English Counties
      { id: 'lan', name: 'Lancashire', shortName: 'LAN', category: 'English County', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1098.png' },
      { id: 'not', name: 'Nottinghamshire', shortName: 'NOT', category: 'English County', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1231.png' },
      { id: 'dur', name: 'Durham', shortName: 'DUR', category: 'English County', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/924.png' },
      { id: 'wor', name: 'Worcestershire', shortName: 'WOR', category: 'English County', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1458.png' },
      { id: 'der', name: 'Derbyshire', shortName: 'DER', category: 'English County', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/904.png' },
      { id: 'nor', name: 'Northamptonshire', shortName: 'NOR', category: 'English County', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1221.png' },
      { id: 'glo', name: 'Gloucestershire', shortName: 'GLO', category: 'English County', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/984.png' }
    ],
    f1: [
      // Constructors / Teams
      { id: 'mclaren', name: 'McLaren', isTeam: true, team: 'McLaren', color: '#FF8000', category: 'Constructor' },
      { id: 'ferrari', name: 'Ferrari', isTeam: true, team: 'Ferrari', color: '#E8002D', category: 'Constructor' },
      { id: 'redbull', name: 'Red Bull Racing', isTeam: true, team: 'Red Bull Racing', color: '#3671C6', category: 'Constructor' },
      { id: 'mercedes', name: 'Mercedes', isTeam: true, team: 'Mercedes', color: '#27F4D2', category: 'Constructor' },
      { id: 'astonmartin', name: 'Aston Martin', isTeam: true, team: 'Aston Martin', color: '#229971', category: 'Constructor' },
      { id: 'williams', name: 'Williams', isTeam: true, team: 'Williams', color: '#64C4FF', category: 'Constructor' },
      { id: 'alpine', name: 'Alpine', isTeam: true, team: 'Alpine', color: '#0093CC', category: 'Constructor' },
      { id: 'racingbulls', name: 'Racing Bulls', isTeam: true, team: 'Racing Bulls', color: '#6692FF', category: 'Constructor' },
      { id: 'sauber', name: 'Kick Sauber', isTeam: true, team: 'Kick Sauber', color: '#52E252', category: 'Constructor' },
      { id: 'haas', name: 'Haas', isTeam: true, team: 'Haas', color: '#B6BABD', category: 'Constructor' },
      // Top Drivers
      { id: 'nor', name: 'Lando Norris', team: 'McLaren', number: '4', code: 'NOR', color: '#FF8000', category: 'Driver' },
      { id: 'ver', name: 'Max Verstappen', team: 'Red Bull Racing', number: '1', code: 'VER', color: '#3671C6', category: 'Driver' },
      { id: 'lec', name: 'Charles Leclerc', team: 'Ferrari', number: '16', code: 'LEC', color: '#E8002D', category: 'Driver' },
      { id: 'ham', name: 'Lewis Hamilton', team: 'Ferrari', number: '44', code: 'HAM', color: '#E8002D', category: 'Driver' },
      { id: 'rus', name: 'George Russell', team: 'Mercedes', number: '63', code: 'RUS', color: '#27F4D2', category: 'Driver' },
      { id: 'pia', name: 'Oscar Piastri', team: 'McLaren', number: '81', code: 'PIA', color: '#FF8000', category: 'Driver' },
      { id: 'ant', name: 'Kimi Antonelli', team: 'Mercedes', number: '12', code: 'ANT', color: '#27F4D2', category: 'Driver' },
      { id: 'alo', name: 'Fernando Alonso', team: 'Aston Martin', number: '14', code: 'ALO', color: '#229971', category: 'Driver' },
      { id: 'sai', name: 'Carlos Sainz', team: 'Williams', number: '55', code: 'SAI', color: '#64C4FF', category: 'Driver' },
      { id: 'alb', name: 'Alexander Albon', team: 'Williams', number: '23', code: 'ALB', color: '#64C4FF', category: 'Driver' },
      { id: 'gas', name: 'Pierre Gasly', team: 'Alpine', number: '10', code: 'GAS', color: '#0093CC', category: 'Driver' },
      { id: 'hul', name: 'Nico Hülkenberg', team: 'Kick Sauber', number: '27', code: 'HUL', color: '#52E252', category: 'Driver' },
      { id: 'tsu', name: 'Yuki Tsunoda', team: 'Racing Bulls', number: '22', code: 'TSU', color: '#6692FF', category: 'Driver' },
      { id: 'bea', name: 'Oliver Bearman', team: 'Haas', number: '87', code: 'BEA', color: '#B6BABD', category: 'Driver' },
      { id: 'oco', name: 'Esteban Ocon', team: 'Haas', number: '31', code: 'OCO', color: '#B6BABD', category: 'Driver' }
    ]
  };

  /**
   * Universal Cricket Logos Map & Lookup (100% verified URLs)
   */
  static CRICKET_LOGOS_MAP = {
    // 🏏 Top International Cricket Teams
    'india': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'ind': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'australia': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',
    'aus': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',
    'england': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'eng': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'pakistan': 'https://a.espncdn.com/i/teamlogos/cricket/500/7.png',
    'pak': 'https://a.espncdn.com/i/teamlogos/cricket/500/7.png',
    'south africa': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',
    'sa': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',
    'new zealand': 'https://a.espncdn.com/i/teamlogos/cricket/500/5.png',
    'nz': 'https://a.espncdn.com/i/teamlogos/cricket/500/5.png',
    'west indies': 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png',
    'wi': 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png',
    'sri lanka': 'https://a.espncdn.com/i/teamlogos/cricket/500/8.png',
    'sl': 'https://a.espncdn.com/i/teamlogos/cricket/500/8.png',
    'bangladesh': 'https://a.espncdn.com/i/teamlogos/cricket/500/25.png',
    'ban': 'https://a.espncdn.com/i/teamlogos/cricket/500/25.png',
    'afghanistan': 'https://a.espncdn.com/i/teamlogos/cricket/500/40.png',
    'afg': 'https://a.espncdn.com/i/teamlogos/cricket/500/40.png',
    'ireland': 'https://a.espncdn.com/i/teamlogos/cricket/500/29.png',
    'ire': 'https://a.espncdn.com/i/teamlogos/cricket/500/29.png',
    'zimbabwe': 'https://a.espncdn.com/i/teamlogos/cricket/500/9.png',
    'zim': 'https://a.espncdn.com/i/teamlogos/cricket/500/9.png',
    'scotland': 'https://a.espncdn.com/i/teamlogos/cricket/500/30.png',
    'sco': 'https://a.espncdn.com/i/teamlogos/cricket/500/30.png',
    'netherlands': 'https://a.espncdn.com/i/teamlogos/cricket/500/15.png',
    'ned': 'https://a.espncdn.com/i/teamlogos/cricket/500/15.png',
    'usa': 'https://a.espncdn.com/i/teamlogos/cricket/500/11.png',
    'united states': 'https://a.espncdn.com/i/teamlogos/cricket/500/11.png',
    'nepal': 'https://a.espncdn.com/i/teamlogos/cricket/500/33.png',
    'nep': 'https://a.espncdn.com/i/teamlogos/cricket/500/33.png',
    'canada': 'https://a.espncdn.com/i/teamlogos/cricket/500/28.png',
    'can': 'https://a.espncdn.com/i/teamlogos/cricket/500/28.png',
    'namibia': 'https://a.espncdn.com/i/teamlogos/cricket/500/20.png',
    'nam': 'https://a.espncdn.com/i/teamlogos/cricket/500/20.png',
    'oman': 'https://a.espncdn.com/i/teamlogos/cricket/500/37.png',
    'oma': 'https://a.espncdn.com/i/teamlogos/cricket/500/37.png',
    'uae': 'https://a.espncdn.com/i/teamlogos/cricket/500/27.png',
    'united arab emirates': 'https://a.espncdn.com/i/teamlogos/cricket/500/27.png',
    'papua new guinea': 'https://a.espncdn.com/i/teamlogos/cricket/500/32.png',
    'png': 'https://a.espncdn.com/i/teamlogos/cricket/500/32.png',
    'uganda': 'https://a.espncdn.com/i/teamlogos/cricket/500/39.png',
    'uga': 'https://a.espncdn.com/i/teamlogos/cricket/500/39.png',
    'italy': 'https://a.espncdn.com/i/teamlogos/cricket/500/31.png',
    'ita': 'https://a.espncdn.com/i/teamlogos/cricket/500/31.png',

    // 🏟️ All 10 IPL Franchises (100% verified high-res crests)
    'chennai super kings': 'https://a.espncdn.com/i/teamlogos/cricket/500/335971.png',
    'csk': 'https://a.espncdn.com/i/teamlogos/cricket/500/335971.png',
    'mumbai indians': 'https://a.espncdn.com/i/teamlogos/cricket/500/335978.png',
    'mi': 'https://a.espncdn.com/i/teamlogos/cricket/500/335978.png',
    'royal challengers bengaluru': 'https://a.espncdn.com/i/teamlogos/cricket/500/335977.png',
    'royal challengers bangalore': 'https://a.espncdn.com/i/teamlogos/cricket/500/335977.png',
    'rcb': 'https://a.espncdn.com/i/teamlogos/cricket/500/335977.png',
    'kolkata knight riders': 'https://a.espncdn.com/i/teamlogos/cricket/500/335975.png',
    'kkr': 'https://a.espncdn.com/i/teamlogos/cricket/500/335975.png',
    'delhi capitals': 'https://a.espncdn.com/i/teamlogos/cricket/500/335973.png',
    'delhi daredevils': 'https://a.espncdn.com/i/teamlogos/cricket/500/335973.png',
    'dc': 'https://a.espncdn.com/i/teamlogos/cricket/500/335973.png',
    'rajasthan royals': 'https://a.espncdn.com/i/teamlogos/cricket/500/335974.png',
    'rr': 'https://a.espncdn.com/i/teamlogos/cricket/500/335974.png',
    'gujarat titans': 'https://scores.iplt20.com/ipl/teamlogos/GT.png',
    'gt': 'https://scores.iplt20.com/ipl/teamlogos/GT.png',
    'punjab kings': 'https://scores.iplt20.com/ipl/teamlogos/PBKS.png',
    'kings xi punjab': 'https://scores.iplt20.com/ipl/teamlogos/PBKS.png',
    'pbks': 'https://scores.iplt20.com/ipl/teamlogos/PBKS.png',
    'pk': 'https://scores.iplt20.com/ipl/teamlogos/PBKS.png',
    'sunrisers hyderabad': 'https://a.espncdn.com/i/teamlogos/cricket/500/628333.png',
    'srh': 'https://a.espncdn.com/i/teamlogos/cricket/500/628333.png',
    'sh': 'https://a.espncdn.com/i/teamlogos/cricket/500/628333.png',
    'lucknow super giants': 'https://scores.iplt20.com/ipl/teamlogos/LSG.png',
    'lsg': 'https://scores.iplt20.com/ipl/teamlogos/LSG.png',
    'ls': 'https://scores.iplt20.com/ipl/teamlogos/LSG.png',

    // 🌴 All 6 CPL Franchises
    'guyana amazon warriors': 'https://cricketvectors.akamaized.net/Teams/2Y.png',
    'gaw': 'https://cricketvectors.akamaized.net/Teams/2Y.png',
    'antigua & barbuda falcons': 'https://cricketvectors.akamaized.net/Teams/UY.png',
    'antigua and barbuda falcons': 'https://cricketvectors.akamaized.net/Teams/UY.png',
    'abf': 'https://cricketvectors.akamaized.net/Teams/UY.png',
    'jamaica kingsmen': 'https://cricketvectors.akamaized.net/Teams/1GK.png',
    'jkm': 'https://cricketvectors.akamaized.net/Teams/1GK.png',
    'jak': 'https://cricketvectors.akamaized.net/Teams/1GK.png',
    'trinbago knight riders': 'https://a.espncdn.com/i/teamlogos/cricket/500/642417.png',
    'tkr': 'https://a.espncdn.com/i/teamlogos/cricket/500/642417.png',
    'barbados royals': 'https://a.espncdn.com/i/teamlogos/cricket/500/642411.png',
    'barbados tridents': 'https://a.espncdn.com/i/teamlogos/cricket/500/642411.png',
    'br': 'https://a.espncdn.com/i/teamlogos/cricket/500/642411.png',
    'st lucia kings': 'https://a.espncdn.com/i/teamlogos/cricket/500/642415.png',
    'saint lucia kings': 'https://a.espncdn.com/i/teamlogos/cricket/500/642415.png',
    'slk': 'https://a.espncdn.com/i/teamlogos/cricket/500/642415.png',
    'st kitts & nevis patriots': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'sknp': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',

    // 🦁 English County Championship Clubs
    'durham': 'https://a.espncdn.com/i/teamlogos/cricket/500/924.png',
    'dur': 'https://a.espncdn.com/i/teamlogos/cricket/500/924.png',
    'worcestershire': 'https://a.espncdn.com/i/teamlogos/cricket/500/1458.png',
    'wor': 'https://a.espncdn.com/i/teamlogos/cricket/500/1458.png',
    'derbyshire': 'https://a.espncdn.com/i/teamlogos/cricket/500/904.png',
    'der': 'https://a.espncdn.com/i/teamlogos/cricket/500/904.png',
    'northamptonshire': 'https://a.espncdn.com/i/teamlogos/cricket/500/1221.png',
    'nor': 'https://a.espncdn.com/i/teamlogos/cricket/500/1221.png',
    'lancashire': 'https://a.espncdn.com/i/teamlogos/cricket/500/1098.png',
    'lan': 'https://a.espncdn.com/i/teamlogos/cricket/500/1098.png',
    'nottinghamshire': 'https://a.espncdn.com/i/teamlogos/cricket/500/1231.png',
    'not': 'https://a.espncdn.com/i/teamlogos/cricket/500/1231.png',
    'gloucestershire': 'https://a.espncdn.com/i/teamlogos/cricket/500/984.png',
    'glo': 'https://a.espncdn.com/i/teamlogos/cricket/500/984.png',
    'gloucs': 'https://a.espncdn.com/i/teamlogos/cricket/500/984.png',
    'glos': 'https://a.espncdn.com/i/teamlogos/cricket/500/984.png',

    // 🏆 Major Leagues & Tournaments
    'indian premier league': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'ipl': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'icc t20 world cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'icc men\'s t20 world cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'icc cricket world cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'world cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'icc champions trophy': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'champions trophy': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'world test championship': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'wtc': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'big bash league': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'bbl': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'caribbean premier league': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'cpl': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'pakistan super league': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'psl': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'sa20': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'wpl': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'women\'s premier league': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'the hundred': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'major league cricket': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'mlc': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'county championship': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'the ashes': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'ashes': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png'
  };

  /**
   * Set of known ESPN cricket team/league IDs whose logo files are 100% verified on CDN
   */
  static VERIFIED_ESPN_IDS = new Set([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 15, 20, 25, 27, 28, 29, 30, 31, 32, 33, 37, 39, 40,
    904, 924, 984, 1098, 1221, 1231, 1458,
    335971, 335973, 335974, 335975, 335977, 335978, 628333,
    642411, 642415, 642417,
    8043, 8044, 8048
  ]);

  static isVerifiedEspnLogo(url) {
    if (!url || typeof url !== 'string') return false;
    const m = url.match(/\/(\d+)\.png/);
    if (!m) return false;
    return this.VERIFIED_ESPN_IDS.has(Number(m[1]));
  }

  static getCricketLogo(name, shortName = '', seriesName = '') {
    const cleanShort = (shortName || '').toLowerCase().trim();
    if (cleanShort && this.CRICKET_LOGOS_MAP[cleanShort]) {
      return this.CRICKET_LOGOS_MAP[cleanShort];
    }
    if (name) {
      const clean = name.toLowerCase().trim();
      if (this.CRICKET_LOGOS_MAP[clean]) return this.CRICKET_LOGOS_MAP[clean];
      for (const [k, v] of Object.entries(this.CRICKET_LOGOS_MAP)) {
        if (clean === k || clean.startsWith(k + ' ') || clean.endsWith(' ' + k)) return v;
      }
    }
    if (seriesName) {
      const cleanSeries = seriesName.toLowerCase().trim();
      if (this.CRICKET_LOGOS_MAP[cleanSeries]) return this.CRICKET_LOGOS_MAP[cleanSeries];
      for (const [k, v] of Object.entries(this.CRICKET_LOGOS_MAP)) {
        if (cleanSeries === k || cleanSeries.startsWith(k + ' ') || cleanSeries.endsWith(' ' + k)) return v;
      }
    }
    return '';
  }

  /**
   * Retrieve followed teams from chrome.storage
   */
  static async getFavorites() {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise(resolve => {
        chrome.storage.local.get([this.STORAGE_KEY], result => {
          if (result && result[this.STORAGE_KEY]) {
            const favs = result[this.STORAGE_KEY];
            if (!favs.f1) favs.f1 = [];
            if (!favs.football) favs.football = [];
            if (!favs.cricket) favs.cricket = [];
            resolve(favs);
          } else {
            chrome.storage.local.set({ [this.STORAGE_KEY]: this.DEFAULT_FAVORITES });
            resolve(this.DEFAULT_FAVORITES);
          }
        });
      });
    } else {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(this.STORAGE_KEY) : null;
      return stored ? JSON.parse(stored) : this.DEFAULT_FAVORITES;
    }
  }

  /**
   * Save followed teams
   */
  static async saveFavorites(favorites) {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise(resolve => {
        chrome.storage.local.set({ [this.STORAGE_KEY]: favorites }, () => resolve(true));
      });
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
      return true;
    }
  }

  /**
   * Clear all followed teams completely
   */
  static async clearAllFavorites() {
    const empty = { football: [], cricket: [], f1: [] };
    await this.saveFavorites(empty);
    return empty;
  }

  /**
   * Robust Check: Is team, club, or driver followed?
   */
  static isTeamFollowed(favorites, sport, teamIdentifier, teamId = null) {
    if (!favorites || !favorites[sport]) return false;
    const targetName = teamIdentifier ? String(teamIdentifier).trim() : '';
    const targetId = teamId ? String(teamId).trim() : '';

    if (!targetName && !targetId) return false;

    const targetLower = targetName.toLowerCase();
    const targetNormFb = normalizeFootballName(targetName);

    return favorites[sport].some(fav => {
      // Don't match league entries as teams
      if (fav.isLeague) return false;

      const favId = fav.id ? String(fav.id).trim() : '';
      const favName = (fav.name || '').trim();
      const favLower = favName.toLowerCase();
      const favShort = (fav.shortName || '').toLowerCase().trim();

      // 1. Exact ID match (highest priority)
      if (targetId && favId && targetId === favId) {
        return true;
      }

      // 2. Direct string match
      if (targetLower && (targetLower === favLower || targetLower === favShort || (favId && targetLower === favId.toLowerCase()))) {
        return true;
      }

      // 3. Football Normalization Matching (e.g. "Arsenal FC" <-> "Arsenal", "Real Madrid CF" <-> "Real Madrid")
      if (sport === 'football') {
        const favNormFb = normalizeFootballName(favName);
        if (favNormFb && targetNormFb) {
          if (favNormFb === targetNormFb) return true;
          if (favNormFb.length >= 4 && targetNormFb.length >= 4) {
            if (favNormFb.includes(targetNormFb) || targetNormFb.includes(favNormFb)) return true;
          }
        }
      }

      // 4. Cricket Aliases & Acronym Matching (e.g. "CSK" <-> "Chennai Super Kings", "RCB" <-> "Royal Challengers Bangalore")
      if (sport === 'cricket') {
        for (const list of Object.values(CRICKET_ALIASES)) {
          const fIn = list.some(k => favLower === k || favLower.includes(k) || favShort === k);
          const tIn = list.some(k => targetLower === k || targetLower.includes(k));
          if (fIn && tIn) return true;
        }
        const cleanFav = favLower.replace(/[^a-z0-9]/g, '');
        const cleanTarget = targetLower.replace(/[^a-z0-9]/g, '');
        if (cleanFav && cleanTarget) {
          if (cleanFav === cleanTarget) return true;
          if (cleanFav.length >= 4 && (cleanTarget.includes(cleanFav) || cleanFav.includes(cleanTarget))) return true;
        }
      }

      // 5. Formula 1 Drivers & Constructors Matching
      if (sport === 'f1') {
        // Match driver code (e.g. "VER", "HAM", "NOR")
        const favCode = (fav.code || '').toLowerCase();
        if (favCode && (targetLower === favCode || targetLower.includes(favCode))) return true;

        // Clean constructor names
        const cleanFav = favLower.replace(/\b(scuderia|racing|f1 team|team|f1|f1team)\b/gi, '').trim();
        const cleanTarget = targetLower.replace(/\b(scuderia|racing|f1 team|team|f1|f1team)\b/gi, '').trim();
        if (cleanFav && cleanTarget) {
          if (cleanFav === cleanTarget) return true;
          if (cleanFav.length >= 4 && cleanTarget.length >= 4 && (cleanFav.includes(cleanTarget) || cleanFav.includes(cleanTarget))) {
            return true;
          }
        }
      }

      return false;
    });
  }

  /**
   * Check if a football league or cricket series/tournament is followed
   */
  static isLeagueFollowed(favorites, sport, leagueName, leagueId = null) {
    if (!favorites || !favorites[sport]) return false;
    const targetName = leagueName ? String(leagueName).trim() : '';
    const targetId = leagueId ? String(leagueId).trim() : '';

    if (!targetName && !targetId) return false;

    const targetLower = targetName.toLowerCase();
    const cleanTarget = targetLower.replace(/[^a-z0-9]/g, '');

    return favorites[sport].some(fav => {
      if (!fav.isLeague && fav.category !== 'League' && fav.category !== 'Tournament') return false;

      const favId = fav.id ? String(fav.id).trim() : '';
      const favName = (fav.name || '').trim();
      const favLower = favName.toLowerCase();
      const favShort = (fav.shortName || '').toLowerCase().trim();

      // 1. Exact ID match
      if (targetId && favId && targetId === favId) return true;

      // 2. Direct string match
      if (targetLower && (targetLower === favLower || targetLower === favShort)) return true;

      // 3. Normalized string containment
      const cleanFav = favLower.replace(/[^a-z0-9]/g, '');
      if (cleanFav && cleanTarget) {
        if (cleanFav === cleanTarget) return true;
        if (cleanFav.length >= 4 && cleanTarget.length >= 4 && (cleanTarget.includes(cleanFav) || cleanFav.includes(cleanTarget))) {
          return true;
        }
      }

      return false;
    });
  }

  /**
   * Toggle follow status of a team, league, driver, or constructor
   */
  static async toggleFollow(sport, item) {
    const favorites = await this.getFavorites();
    if (!favorites[sport]) favorites[sport] = [];

    const isLeague = Boolean(item.isLeague || item.category === 'League' || item.category === 'Tournament');
    const isFollowed = isLeague
      ? this.isLeagueFollowed(favorites, sport, item.name, item.id)
      : this.isTeamFollowed(favorites, sport, item.name || item.id, item.id);

    if (isFollowed) {
      // Remove
      favorites[sport] = favorites[sport].filter(fav => {
        const cleanName = (fav.name || '').toLowerCase().trim();
        const targetName = (item.name || '').toLowerCase().trim();
        const cleanId = String(fav.id || '');
        const targetId = String(item.id || '');
        return cleanName !== targetName && cleanId !== targetId;
      });
    } else {
      // Add
      favorites[sport].push({
        id: item.id || (item.name ? item.name.toLowerCase().replace(/\s+/g, '_') : 'fav'),
        name: item.name,
        shortName: item.shortName || '',
        team: item.team || '',
        isLeague: isLeague,
        isTeam: Boolean(item.isTeam || item.category === 'Constructor'),
        category: item.category || (isLeague ? 'League' : (item.isTeam ? 'Constructor' : '')),
        color: item.color || '',
        sport: sport,
        logo: item.logo || item.flag || (sport === 'cricket' ? this.getCricketLogo(item.name, item.shortName) : '')
      });
    }

    await this.saveFavorites(favorites);
    return !isFollowed;
  }

  /**
   * Returns list of all discoverable items by combining static catalog
   * with LIVE active teams, leagues, and drivers from data feeds dynamically.
   * NO arbitrary array slicing so ANY future entity is automatically registered!
   */
  static getDiscoverableItems(sport = 'all', footballMatches = [], cricketMatches = [], f1Data = null, footballLeagues = [], cricketSeries = []) {
    let items = [];

    if (sport === 'all' || sport === 'football' || sport === 'leagues') {
      const fbMap = new Map();
      this.DISCOVER_CATALOG.football.forEach(t => {
        if (sport === 'leagues' && !t.isLeague) return;
        fbMap.set(String(t.id), { ...t, sport: 'football' });
      });

      // Dynamically add all active leagues from current matches
      for (const lg of footballLeagues) {
        const lgKey = `lg_${lg.leagueId}`;
        if (!fbMap.has(lgKey) && !fbMap.has(String(lg.leagueId))) {
          fbMap.set(lgKey, {
            id: lg.leagueId,
            name: lg.leagueName,
            isLeague: true,
            category: 'League',
            sport: 'football',
            logo: lg.leagueId ? `https://images.fotmob.com/image_resources/logo/leaguelogo/${lg.leagueId}.png` : ''
          });
        }
      }

      // Dynamically add all clubs from current matches (home & away)
      if (sport !== 'leagues') {
        for (const m of footballMatches) {
          if (m.home?.id && !fbMap.has(String(m.home.id))) {
            fbMap.set(String(m.home.id), { id: m.home.id, name: m.home.name, league: m.leagueName, sport: 'football', logo: m.home.logo });
          }
          if (m.away?.id && !fbMap.has(String(m.away.id))) {
            fbMap.set(String(m.away.id), { id: m.away.id, name: m.away.name, league: m.leagueName, sport: 'football', logo: m.away.logo });
          }
        }
      }
      items.push(...Array.from(fbMap.values()));
    }

    if (sport === 'all' || sport === 'cricket' || sport === 'leagues') {
      const crMap = new Map();
      this.DISCOVER_CATALOG.cricket.forEach(t => {
        if (sport === 'leagues' && !t.isLeague) return;
        crMap.set(t.name.toLowerCase(), { ...t, sport: 'cricket' });
      });

      // Dynamically add all active cricket series/tournaments
      for (const s of cricketSeries) {
        const sKey = (s.seriesName || '').toLowerCase().trim();
        if (sKey && !crMap.has(sKey)) {
          crMap.set(sKey, {
            id: sKey.replace(/\s+/g, '_'),
            name: s.seriesName,
            shortName: s.seriesName,
            isLeague: true,
            category: 'Tournament',
            sport: 'cricket',
            logo: this.getCricketLogo(s.seriesName) || ''
          });
        }
      }

      // Dynamically add all cricket teams from current matches
      if (sport !== 'leagues') {
        for (const m of cricketMatches) {
          if (m.team1?.name && !crMap.has(m.team1.name.toLowerCase())) {
            const logo = m.team1.flag || this.getCricketLogo(m.team1.name, m.team1.shortName);
            crMap.set(m.team1.name.toLowerCase(), { id: m.team1.shortName || m.team1.name, name: m.team1.name, shortName: m.team1.shortName, category: m.seriesName || 'Cricket Team', sport: 'cricket', logo });
          }
          if (m.team2?.name && !crMap.has(m.team2.name.toLowerCase())) {
            const logo = m.team2.flag || this.getCricketLogo(m.team2.name, m.team2.shortName);
            crMap.set(m.team2.name.toLowerCase(), { id: m.team2.shortName || m.team2.name, name: m.team2.name, shortName: m.team2.shortName, category: m.seriesName || 'Cricket Team', sport: 'cricket', logo });
          }
        }
      }
      items.push(...Array.from(crMap.values()));
    }

    if (sport === 'all' || sport === 'f1') {
      const f1Map = new Map();
      this.DISCOVER_CATALOG.f1.forEach(t => f1Map.set(t.name.toLowerCase(), { ...t, sport: 'f1' }));

      // Dynamically add all drivers from live session data
      if (f1Data && f1Data.leaderboard) {
        for (const d of f1Data.leaderboard) {
          if (!f1Map.has(d.name.toLowerCase())) {
            f1Map.set(d.name.toLowerCase(), { 
              id: d.code, 
              name: d.name, 
              team: d.team, 
              number: d.number, 
              code: d.code, 
              color: d.teamColor, 
              category: 'Driver',
              sport: 'f1' 
            });
          }
        }
      }
      items.push(...Array.from(f1Map.values()));
    }

    return items;
  }

  /**
   * Filter matches & F1 sessions.
   * Following tab is STRICTLY for followed teams, leagues, and drivers across ALL sports!
   * Rules:
   * - LIVE matches: Always shown.
   * - FINISHED matches: Only if within the last 24 hours (and keep latest per entity).
   * - UPCOMING matches: Only if starting within next 48 hours.
   */
  static filterFollowedMatches(footballMatches = [], cricketMatches = [], f1Data = null, favorites = {}) {
    const fbFavs = favorites.football || [];
    const crFavs = favorites.cricket || [];
    const f1Favs = favorites.f1 || [];
    const totalFavsCount = fbFavs.length + crFavs.length + f1Favs.length;

    if (totalFavsCount === 0) {
      return [];
    }

    const rawFollowedList = [];

    // 1. Check Football (matches against followed clubs OR followed leagues)
    for (const match of footballMatches) {
      const homeFollowed = this.isTeamFollowed(favorites, 'football', match.home?.name, match.home?.id);
      const awayFollowed = this.isTeamFollowed(favorites, 'football', match.away?.name, match.away?.id);
      const leagueFollowed = this.isLeagueFollowed(favorites, 'football', match.leagueName, match.leagueId);

      if (homeFollowed || awayFollowed || leagueFollowed) {
        rawFollowedList.push({
          ...match,
          isFollowedHome: homeFollowed,
          isFollowedAway: awayFollowed,
          isFollowedLeague: leagueFollowed
        });
      }
    }

    // 2. Check Cricket (matches against followed teams OR followed tournaments)
    for (const match of cricketMatches) {
      const t1Followed = this.isTeamFollowed(favorites, 'cricket', match.team1?.name) || this.isTeamFollowed(favorites, 'cricket', match.team1?.shortName);
      const t2Followed = this.isTeamFollowed(favorites, 'cricket', match.team2?.name) || this.isTeamFollowed(favorites, 'cricket', match.team2?.shortName);
      const seriesFollowed = this.isLeagueFollowed(favorites, 'cricket', match.seriesName);

      if (t1Followed || t2Followed || seriesFollowed) {
        rawFollowedList.push({
          ...match,
          isFollowedT1: t1Followed,
          isFollowedT2: t2Followed,
          isFollowedSeries: seriesFollowed
        });
      }
    }

    // 3. Check Formula 1
    if (f1Data && f1Data.leaderboard) {
      const followedDrivers = [];
      for (const driver of f1Data.leaderboard) {
        const isFollowed = this.isTeamFollowed(favorites, 'f1', driver.name) || 
                           this.isTeamFollowed(favorites, 'f1', driver.team) || 
                           this.isTeamFollowed(favorites, 'f1', driver.code);
        if (isFollowed) {
          followedDrivers.push(driver);
        }
      }

      if (followedDrivers.length > 0) {
        rawFollowedList.push({
          id: `f1_session_${f1Data.meetingKey || 'current'}`,
          sport: 'f1',
          grandPrix: f1Data.meetingName,
          officialName: f1Data.officialName,
          sessionName: f1Data.sessionName,
          statusText: f1Data.statusText,
          isLive: f1Data.isLive,
          isFinished: f1Data.isFinished,
          isUpcoming: f1Data.isUpcoming,
          startTime: f1Data.startTime,
          followedDrivers: followedDrivers
        });
      }
    }

    // Time-window filter:
    // - LIVE matches always pass.
    // - Finished matches pass only if finished within last 24 hours.
    // - Upcoming matches pass only if starts within next 48 hours.
    const now = Date.now();
    const H24 = 24 * 60 * 60 * 1000;
    const H48 = 48 * 60 * 60 * 1000;

    const timeFiltered = rawFollowedList.filter(item => {
      if (item.isLive) return true;

      if (item.startTime) {
        const matchTime = new Date(item.startTime).getTime();
        if (!isNaN(matchTime)) {
          if (item.isFinished) {
            const age = now - matchTime;
            return age >= 0 && age <= H24;
          }
          if (item.isUpcoming) {
            const diff = matchTime - now;
            return diff <= H48 && diff >= -3600000;
          }
        }
      }
      return true;
    });

    // For finished matches: keep only the latest finished match per team / series
    const seenFinishedEntities = new Set();
    const finalFiltered = [];

    for (const item of timeFiltered) {
      if (item.isLive || item.isUpcoming) {
        finalFiltered.push(item);
      } else if (item.isFinished) {
        const entityKey = item.sport === 'football'
          ? `${item.home?.name || ''}_vs_${item.away?.name || ''}`
          : `${item.team1?.name || ''}_vs_${item.team2?.name || ''}`;
        if (!seenFinishedEntities.has(entityKey)) {
          seenFinishedEntities.add(entityKey);
          finalFiltered.push(item);
        }
      } else {
        finalFiltered.push(item);
      }
    }

    // Sort: LIVE items first, then upcoming (soonest first), then finished (most recent first)
    return finalFiltered.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;

      if (a.isUpcoming && b.isUpcoming && a.startTime && b.startTime) {
        return new Date(a.startTime) - new Date(b.startTime);
      }
      if (a.isFinished && b.isFinished && a.startTime && b.startTime) {
        return new Date(b.startTime) - new Date(a.startTime);
      }

      if (a.isUpcoming && b.isFinished) return -1;
      if (a.isFinished && b.isUpcoming) return 1;
      return 0;
    });
  }
}
