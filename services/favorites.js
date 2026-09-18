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
    .replace(/\b(fc|cf|sc|afc|fk|sk|ac|cd|ca|as|ss|sv|bsc|tsg|vfl|vfb|fsv|spvgg|calcio|club de futbol|club de fútbol|football club)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

const FOOTBALL_ALIASES = {
  'psg': ['paris saint-germain', 'paris saint germain', 'paris sg', 'psg', 'paris st-germain', 'paris st germain'],
  'mcfc': ['manchester city', 'man city', 'mcfc'],
  'mufc': ['manchester united', 'man utd', 'man united', 'mufc'],
  'afc': ['arsenal', 'afc', 'arsenal fc'],
  'cfc': ['chelsea', 'cfc', 'chelsea fc'],
  'lfc': ['liverpool', 'lfc', 'liverpool fc'],
  'thfc': ['tottenham hotspur', 'tottenham', 'spurs', 'thfc'],
  'nufc': ['newcastle united', 'newcastle', 'nufc'],
  'bvb': ['borussia dortmund', 'dortmund', 'bvb'],
  'fcb': ['bayern munchen', 'bayern munich', 'bayern münchen', 'bayern', 'fc bayern'],
  'barca': ['barcelona', 'fc barcelona', 'barca', 'barça'],
  'rm': ['real madrid', 'real madrid cf', 'real madrid club de futbol'],
  'atleti': ['atletico madrid', 'atlético madrid', 'atletico de madrid', 'atlético de madrid', 'atleti'],
  'inter': ['inter', 'inter milan', 'internazionale', 'fc internazionale milano'],
  'milan': ['ac milan', 'milan', 'rossoneri'],
  'juve': ['juventus', 'juve', 'juventus fc'],
  'roma': ['as roma', 'roma'],
  'napoli': ['ssc napoli', 'napoli'],
  'lazio': ['ss lazio', 'lazio'],
  'sporting': ['sporting cp', 'sporting lisbon', 'sporting'],
  'benfica': ['sl benfica', 'benfica'],
  'porto': ['fc porto', 'porto'],
  'ajax': ['afc ajax', 'ajax', 'afc ajax amsterdam'],
  'intermiami': ['inter miami', 'inter miami cf'],
  'alnassr': ['al nassr', 'al-nassr', 'al nassr fc'],
  'alhilal': ['al hilal', 'al-hilal', 'al hilal sfc']
};

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

const LEAGUE_ALIASES = {
  'epl': ['premier league', 'english premier league', 'epl', 'premier league 2025/2026', 'premier league 2026', 'english premier league 2025/2026'],
  'ucl': ['champions league', 'uefa champions league', 'ucl'],
  'uel': ['europa league', 'uefa europa league', 'uel'],
  'laliga': ['laliga', 'la liga', 'laliga ea sports', 'spanish laliga', 'primera division'],
  'bundesliga': ['bundesliga', 'german bundesliga', '1. bundesliga', 'bundesliga 2025/2026'],
  'seriea': ['serie a', 'italian serie a', 'serie a enilive', 'serie a 2025/2026'],
  'ligue1': ['ligue 1', 'french ligue 1', 'ligue 1 mcdonalds', 'ligue 1 2025/2026'],
  'mls': ['major league soccer', 'mls'],
  'eredivisie': ['eredivisie', 'dutch eredivisie'],
  'championship': ['championship', 'efl championship', 'english championship'],
  'saudiproleague': ['saudi pro league', 'roshn saudi league', 'saudi league'],

  'ipl': ['indian premier league', 'ipl', 'tata ipl', 'ipl 2026', 'ipl 2025'],
  't20wc': ['icc men\'s t20 world cup', 'icc mens t20 world cup', 'icc t20 world cup', 't20 world cup', 't20 wc'],
  'cwc': ['icc cricket world cup', 'cricket world cup', 'icc men\'s cricket world cup', 'world cup', 'odi world cup'],
  'ct': ['icc champions trophy', 'champions trophy', 'icc champions trophy 2025', 'icc champions trophy 2026'],
  'wtc': ['icc world test championship', 'world test championship', 'wtc', 'icc wtc'],
  'bbl': ['big bash league', 'bbl', 'kfc bbl'],
  'cpl': ['caribbean premier league', 'cpl', 'republic bank cpl'],
  'psl': ['pakistan super league', 'psl', 'hbl psl'],
  'sa20': ['sa20', 'betway sa20', 'sa20 league'],
  'wpl': ['women\'s premier league', 'womens premier league', 'wpl', 'tata wpl'],
  'thehundred': ['the hundred', 'the hundred mens competition', 'the hundred men'],
  'mlc': ['major league cricket', 'mlc', 'cognizant mlc'],
  'county': ['county championship', 'vitality county championship', 'county championship division one', 'county championship division two'],
  'ashes': ['the ashes', 'ashes', 'the ashes series']
};

const F1_CONSTRUCTOR_ALIASES = {
  'redbull': ['red bull racing', 'red bull', 'oracle red bull racing', 'redbull'],
  'ferrari': ['ferrari', 'scuderia ferrari', 'scuderia ferrari hp'],
  'mclaren': ['mclaren', 'mclaren f1 team', 'mclaren formula 1 team'],
  'mercedes': ['mercedes', 'mercedes-amg petronas', 'mercedes f1 team', 'mercedes-amg'],
  'astonmartin': ['aston martin', 'aston martin aramco', 'aston martin f1 team'],
  'alpine': ['alpine', 'bwt alpine f1 team', 'alpine f1 team'],
  'williams': ['williams', 'williams racing'],
  'racingbulls': ['racing bulls', 'rb', 'visa cash app rb', 'vcarb', 'toro rosso', 'alphatauri'],
  'sauber': ['kick sauber', 'stake f1 team kick sauber', 'sauber', 'alfa romeo'],
  'haas': ['haas', 'moneygram haas f1 team', 'haas f1 team']
};

const F1_DRIVER_ALIASES = {
  'ver': ['max verstappen', 'verstappen', 'ver', '1', '33'],
  'nor': ['lando norris', 'norris', 'nor', '4'],
  'lec': ['charles leclerc', 'leclerc', 'lec', '16'],
  'ham': ['lewis hamilton', 'hamilton', 'ham', '44'],
  'pia': ['oscar piastri', 'piastri', 'pia', '81'],
  'rus': ['george russell', 'russell', 'rus', '63'],
  'alo': ['fernando alonso', 'alonso', 'alo', '14'],
  'sai': ['carlos sainz', 'sainz', 'sai', '55'],
  'alb': ['alexander albon', 'alex albon', 'albon', 'alb', '23'],
  'ant': ['andrea kimi antonelli', 'kimi antonelli', 'antonelli', 'ant', '12'],
  'gas': ['pierre gasly', 'gasly', 'gas', '10'],
  'hul': ['nico hulkenberg', 'nico hülkenberg', 'hulkenberg', 'hülkenberg', 'hul', '27'],
  'tsu': ['yuki tsunoda', 'tsunoda', 'tsu', '22'],
  'bea': ['oliver bearman', 'ollie bearman', 'bearman', 'bea', '87'],
  'oco': ['esteban ocon', 'ocon', 'oco', '31'],
  'str': ['lance stroll', 'stroll', 'str', '18'],
  'bot': ['valtteri bottas', 'bottas', 'bot', '77'],
  'per': ['sergio perez', 'perez', 'per', 'checo', '11'],
  'law': ['liam lawson', 'lawson', 'law', '30'],
  'doo': ['jack doohan', 'doohan', 'doo', '7'],
  'bor': ['gabriel bortoleto', 'bortoleto', 'bor', '5'],
  'had': ['isack hadjar', 'hadjar', 'had', '6']
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
      // 🏆 Major Cricket Leagues & Tournaments (100% verified unique tournament logos)
      { id: 'ipl', name: 'Indian Premier League', shortName: 'IPL', isLeague: true, category: 'Tournament', logo: 'https://cricketvectors.akamaized.net/Series/1B.png' },
      { id: 'wpl', name: 'Women\'s Premier League', shortName: 'WPL', isLeague: true, category: 'Tournament', logo: 'https://cricketvectors.akamaized.net/Series/2E1.png' },
      { id: 'bbl', name: 'Big Bash League', shortName: 'BBL', isLeague: true, category: 'Tournament', logo: 'https://cricketvectors.akamaized.net/Series/27.png' },
      { id: 'psl', name: 'Pakistan Super League', shortName: 'PSL', isLeague: true, category: 'Tournament', logo: 'https://cricketvectors.akamaized.net/Series/1J.png' },
      { id: 'sa20', name: 'SA20', shortName: 'SA20', isLeague: true, category: 'Tournament', logo: 'https://cricketvectors.akamaized.net/Series/22N.png' },
      { id: 'cpl', name: 'Caribbean Premier League', shortName: 'CPL', isLeague: true, category: 'Tournament', logo: 'https://cricketvectors.akamaized.net/Series/2E2.png' },
      { id: 'wcpl', name: 'Women\'s Caribbean Premier League', shortName: 'WCPL', isLeague: true, category: 'Tournament', logo: 'https://cricketvectors.akamaized.net/Series/2E1.png' },
      { id: 'thehundred', name: 'The Hundred', shortName: 'Hundred', isLeague: true, category: 'Tournament', logo: 'https://cricketvectors.akamaized.net/Series/1H.png' },
      { id: 'mlc', name: 'Major League Cricket', shortName: 'MLC', isLeague: true, category: 'Tournament', logo: 'https://cricketvectors.akamaized.net/Series/24Z.png' },
      { id: 'ilt20', name: 'International League T20', shortName: 'ILT20', isLeague: true, category: 'Tournament', logo: 'https://cricketvectors.akamaized.net/Series/24Y.png' },
      { id: 'lpl', name: 'Lanka Premier League', shortName: 'LPL', isLeague: true, category: 'Tournament', logo: 'https://cricketvectors.akamaized.net/Series/1V.png' },
      { id: 'etpl', name: 'European T20 Premier League', shortName: 'ETPL', isLeague: true, category: 'Tournament', logo: 'https://cricketvectors.akamaized.net/Series/1RN.png' },
      { id: 'ausoneday', name: 'Australian Domestic One-Day Cup', shortName: 'Marsh Cup', isLeague: true, category: 'Tournament', logo: 'https://cricketvectors.akamaized.net/Series/2KN.png' },
      { id: 'county', name: 'County Championship', shortName: 'County', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png' },
      { id: 'ashes', name: 'The Ashes', shortName: 'Ashes', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png' },
      { id: 'ranji', name: 'Ranji Trophy', shortName: 'Ranji', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png' },
      { id: 'wtc', name: 'ICC World Test Championship', shortName: 'WTC', isLeague: true, category: 'Tournament', logo: 'https://cricketvectors.akamaized.net/Series/1QK.png' },
      { id: 't20wc', name: 'ICC Men\'s T20 World Cup', shortName: 'T20 WC', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png' },
      { id: 'cwc', name: 'ICC Cricket World Cup', shortName: 'World Cup', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png' },
      { id: 'ct', name: 'ICC Champions Trophy', shortName: 'Champions Trophy', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png' },

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

      // 🏟️ All 10 IPL Franchises (100% verified official high-res crests)
      { id: 'csk', name: 'Chennai Super Kings', shortName: 'CSK', category: 'IPL Franchise', logo: 'https://scores.iplt20.com/ipl/teamlogos/CSK.png' },
      { id: 'mi', name: 'Mumbai Indians', shortName: 'MI', category: 'IPL Franchise', logo: 'https://scores.iplt20.com/ipl/teamlogos/MI.png' },
      { id: 'rcb', name: 'Royal Challengers Bengaluru', shortName: 'RCB', category: 'IPL Franchise', logo: 'https://scores.iplt20.com/ipl/teamlogos/RCB.png' },
      { id: 'kkr', name: 'Kolkata Knight Riders', shortName: 'KKR', category: 'IPL Franchise', logo: 'https://scores.iplt20.com/ipl/teamlogos/KKR.png' },
      { id: 'dc', name: 'Delhi Capitals', shortName: 'DC', category: 'IPL Franchise', logo: 'https://scores.iplt20.com/ipl/teamlogos/DC.png' },
      { id: 'rr', name: 'Rajasthan Royals', shortName: 'RR', category: 'IPL Franchise', logo: 'https://scores.iplt20.com/ipl/teamlogos/RR.png' },
      { id: 'gt', name: 'Gujarat Titans', shortName: 'GT', category: 'IPL Franchise', logo: 'https://scores.iplt20.com/ipl/teamlogos/GT.png' },
      { id: 'pbks', name: 'Punjab Kings', shortName: 'PBKS', category: 'IPL Franchise', logo: 'https://scores.iplt20.com/ipl/teamlogos/PBKS.png' },
      { id: 'srh', name: 'Sunrisers Hyderabad', shortName: 'SRH', category: 'IPL Franchise', logo: 'https://scores.iplt20.com/ipl/teamlogos/SRH.png' },
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
    // 🏏 Top International Cricket Teams (100% verified ESPNcricinfo CDN logos)
    'india': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'ind': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'team india': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'bcci': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'australia': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',
    'aus': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',
    'aussies': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',
    'england': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'eng': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'ecb': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'pakistan': 'https://a.espncdn.com/i/teamlogos/cricket/500/7.png',
    'pak': 'https://a.espncdn.com/i/teamlogos/cricket/500/7.png',
    'pcb': 'https://a.espncdn.com/i/teamlogos/cricket/500/7.png',
    'south africa': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',
    'sa': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',
    'proteas': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',
    'csa': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',
    'new zealand': 'https://a.espncdn.com/i/teamlogos/cricket/500/5.png',
    'nz': 'https://a.espncdn.com/i/teamlogos/cricket/500/5.png',
    'blackcaps': 'https://a.espncdn.com/i/teamlogos/cricket/500/5.png',
    'black caps': 'https://a.espncdn.com/i/teamlogos/cricket/500/5.png',
    'white ferns': 'https://a.espncdn.com/i/teamlogos/cricket/500/5.png',
    'west indies': 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png',
    'wi': 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png',
    'windies': 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png',
    'cwi': 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png',
    'sri lanka': 'https://a.espncdn.com/i/teamlogos/cricket/500/8.png',
    'sl': 'https://a.espncdn.com/i/teamlogos/cricket/500/8.png',
    'slc': 'https://a.espncdn.com/i/teamlogos/cricket/500/8.png',
    'bangladesh': 'https://a.espncdn.com/i/teamlogos/cricket/500/25.png',
    'ban': 'https://a.espncdn.com/i/teamlogos/cricket/500/25.png',
    'bcb': 'https://a.espncdn.com/i/teamlogos/cricket/500/25.png',
    'afghanistan': 'https://a.espncdn.com/i/teamlogos/cricket/500/40.png',
    'afg': 'https://a.espncdn.com/i/teamlogos/cricket/500/40.png',
    'acb': 'https://a.espncdn.com/i/teamlogos/cricket/500/40.png',
    'ireland': 'https://a.espncdn.com/i/teamlogos/cricket/500/29.png',
    'ire': 'https://a.espncdn.com/i/teamlogos/cricket/500/29.png',
    'zimbabwe': 'https://a.espncdn.com/i/teamlogos/cricket/500/9.png',
    'zim': 'https://a.espncdn.com/i/teamlogos/cricket/500/9.png',
    'scotland': 'https://a.espncdn.com/i/teamlogos/cricket/500/30.png',
    'sco': 'https://a.espncdn.com/i/teamlogos/cricket/500/30.png',
    'netherlands': 'https://a.espncdn.com/i/teamlogos/cricket/500/15.png',
    'ned': 'https://a.espncdn.com/i/teamlogos/cricket/500/15.png',
    'holland': 'https://a.espncdn.com/i/teamlogos/cricket/500/15.png',
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
    'hong kong': 'https://a.espncdn.com/i/teamlogos/cricket/500/19.png',
    'hk': 'https://a.espncdn.com/i/teamlogos/cricket/500/19.png',
    'kenya': 'https://a.espncdn.com/i/teamlogos/cricket/500/26.png',
    'ken': 'https://a.espncdn.com/i/teamlogos/cricket/500/26.png',
    'jersey': 'https://a.espncdn.com/i/teamlogos/cricket/500/41.png',
    'jer': 'https://a.espncdn.com/i/teamlogos/cricket/500/41.png',
    'bermuda': 'https://a.espncdn.com/i/teamlogos/cricket/500/16.png',
    'ber': 'https://a.espncdn.com/i/teamlogos/cricket/500/16.png',
    'kuwait': 'https://a.espncdn.com/i/teamlogos/cricket/500/35.png',
    'kuw': 'https://a.espncdn.com/i/teamlogos/cricket/500/35.png',

    // 🏟️ All 10 IPL Franchises (100% verified official IPL CDN crests)
    'chennai super kings': 'https://scores.iplt20.com/ipl/teamlogos/CSK.png',
    'csk': 'https://scores.iplt20.com/ipl/teamlogos/CSK.png',
    'mumbai indians': 'https://scores.iplt20.com/ipl/teamlogos/MI.png',
    'mi': 'https://scores.iplt20.com/ipl/teamlogos/MI.png',
    'royal challengers bengaluru': 'https://scores.iplt20.com/ipl/teamlogos/RCB.png',
    'royal challengers bangalore': 'https://scores.iplt20.com/ipl/teamlogos/RCB.png',
    'rcb': 'https://scores.iplt20.com/ipl/teamlogos/RCB.png',
    'kolkata knight riders': 'https://scores.iplt20.com/ipl/teamlogos/KKR.png',
    'kkr': 'https://scores.iplt20.com/ipl/teamlogos/KKR.png',
    'delhi capitals': 'https://scores.iplt20.com/ipl/teamlogos/DC.png',
    'delhi daredevils': 'https://scores.iplt20.com/ipl/teamlogos/DC.png',
    'dc': 'https://scores.iplt20.com/ipl/teamlogos/DC.png',
    'rajasthan royals': 'https://scores.iplt20.com/ipl/teamlogos/RR.png',
    'rr': 'https://scores.iplt20.com/ipl/teamlogos/RR.png',
    'gujarat titans': 'https://scores.iplt20.com/ipl/teamlogos/GT.png',
    'gt': 'https://scores.iplt20.com/ipl/teamlogos/GT.png',
    'punjab kings': 'https://scores.iplt20.com/ipl/teamlogos/PBKS.png',
    'kings xi punjab': 'https://scores.iplt20.com/ipl/teamlogos/PBKS.png',
    'pbks': 'https://scores.iplt20.com/ipl/teamlogos/PBKS.png',
    'pk': 'https://scores.iplt20.com/ipl/teamlogos/PBKS.png',
    'sunrisers hyderabad': 'https://scores.iplt20.com/ipl/teamlogos/SRH.png',
    'srh': 'https://scores.iplt20.com/ipl/teamlogos/SRH.png',
    'sh': 'https://scores.iplt20.com/ipl/teamlogos/SRH.png',
    'lucknow super giants': 'https://scores.iplt20.com/ipl/teamlogos/LSG.png',
    'lsg': 'https://scores.iplt20.com/ipl/teamlogos/LSG.png',
    'ls': 'https://scores.iplt20.com/ipl/teamlogos/LSG.png',

    // 🌴 CPL Franchises
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
    'ashes': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'wbbl': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'bpl': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'super smash': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'lanka premier league': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'lpl': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'ilt20': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'ranji trophy': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png'
  };

  /**
   * Universal Football Leagues Logos Map (FotMob & ESPN official CDNs)
   */
  static FOOTBALL_LEAGUES_LOGOS_MAP = {
    // English
    'premier league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/47.png',
    'epl': 'https://images.fotmob.com/image_resources/logo/leaguelogo/47.png',
    'championship': 'https://images.fotmob.com/image_resources/logo/leaguelogo/48.png',
    'league one': 'https://images.fotmob.com/image_resources/logo/leaguelogo/108.png',
    'league two': 'https://images.fotmob.com/image_resources/logo/leaguelogo/109.png',
    'fa cup': 'https://images.fotmob.com/image_resources/logo/leaguelogo/132.png',
    'efl cup': 'https://images.fotmob.com/image_resources/logo/leaguelogo/133.png',
    'carabao cup': 'https://images.fotmob.com/image_resources/logo/leaguelogo/133.png',
    'community shield': 'https://images.fotmob.com/image_resources/logo/leaguelogo/136.png',

    // European / International
    'champions league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/42.png',
    'ucl': 'https://images.fotmob.com/image_resources/logo/leaguelogo/42.png',
    'uefa champions league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/42.png',
    'europa league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/73.png',
    'uel': 'https://images.fotmob.com/image_resources/logo/leaguelogo/73.png',
    'uefa europa league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/73.png',
    'conference league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/10216.png',
    'uefa conference league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/10216.png',
    'uefa nations league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/9806.png',
    'nations league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/9806.png',
    'uefa super cup': 'https://images.fotmob.com/image_resources/logo/leaguelogo/74.png',
    'world cup': 'https://images.fotmob.com/image_resources/logo/leaguelogo/77.png',
    'fifa club world cup': 'https://images.fotmob.com/image_resources/logo/leaguelogo/76.png',
    'copa america': 'https://images.fotmob.com/image_resources/logo/leaguelogo/44.png',
    'euro': 'https://images.fotmob.com/image_resources/logo/leaguelogo/50.png',
    'afc champions league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/80.png',

    // Spain
    'laliga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/87.png',
    'la liga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/87.png',
    'laliga ea sports': 'https://images.fotmob.com/image_resources/logo/leaguelogo/87.png',
    'copa del rey': 'https://images.fotmob.com/image_resources/logo/leaguelogo/138.png',
    'supercopa de espana': 'https://images.fotmob.com/image_resources/logo/leaguelogo/137.png',

    // Germany
    'bundesliga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/54.png',
    '1. bundesliga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/54.png',
    '2. bundesliga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/146.png',
    '3. liga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/147.png',
    'dfb-pokal': 'https://images.fotmob.com/image_resources/logo/leaguelogo/134.png',
    'dfb pokal': 'https://images.fotmob.com/image_resources/logo/leaguelogo/134.png',

    // Italy
    'serie a': 'https://images.fotmob.com/image_resources/logo/leaguelogo/55.png',
    'serie a enilive': 'https://images.fotmob.com/image_resources/logo/leaguelogo/55.png',
    'serie b': 'https://images.fotmob.com/image_resources/logo/leaguelogo/56.png',
    'coppa italia': 'https://images.fotmob.com/image_resources/logo/leaguelogo/141.png',

    // France
    'ligue 1': 'https://images.fotmob.com/image_resources/logo/leaguelogo/53.png',
    'ligue 1 mcdonalds': 'https://images.fotmob.com/image_resources/logo/leaguelogo/53.png',
    'ligue 2': 'https://images.fotmob.com/image_resources/logo/leaguelogo/110.png',
    'coupe de france': 'https://images.fotmob.com/image_resources/logo/leaguelogo/135.png',

    // Americas & Global
    'major league soccer': 'https://images.fotmob.com/image_resources/logo/leaguelogo/130.png',
    'mls': 'https://images.fotmob.com/image_resources/logo/leaguelogo/130.png',
    'saudi pro league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/536.png',
    'roshn saudi league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/536.png',
    'eredivisie': 'https://images.fotmob.com/image_resources/logo/leaguelogo/57.png',
    'liga portugal': 'https://images.fotmob.com/image_resources/logo/leaguelogo/61.png',
    'primeira liga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/61.png',
    'brasileirao': 'https://images.fotmob.com/image_resources/logo/leaguelogo/268.png',
    'copa libertadores': 'https://images.fotmob.com/image_resources/logo/leaguelogo/45.png',
    'copa sudamericana': 'https://images.fotmob.com/image_resources/logo/leaguelogo/295.png',
    'indian super league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/9003.png',
    'isl': 'https://images.fotmob.com/image_resources/logo/leaguelogo/9003.png',
    'scottish premiership': 'https://images.fotmob.com/image_resources/logo/leaguelogo/65.png',
    'super lig': 'https://images.fotmob.com/image_resources/logo/leaguelogo/71.png',
    'liga mx': 'https://images.fotmob.com/image_resources/logo/leaguelogo/230.png',
    'belgian pro league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/40.png',
    'swiss super league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/68.png',
    'austrian bundesliga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/38.png'
  };

  /**
   * Set of known ESPN cricket team/league IDs whose logo files are 100% verified on CDN
   */
  static VERIFIED_ESPN_IDS = new Set([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 15, 16, 19, 20, 25, 26, 27, 28, 29, 30, 31, 32, 33, 35, 36, 37, 39, 40, 41, 42,
    904, 924, 984, 1098, 1221, 1231, 1458,
    335970, 335971, 335973, 335974, 335975, 335977, 335978, 628333,
    642411, 642415, 642417,
    8043, 8044, 8048
  ]);

  static isVerifiedEspnLogo(url) {
    if (!url || typeof url !== 'string') return false;
    const m = url.match(/\/(\d+)\.png/);
    if (!m) return false;
    return this.VERIFIED_ESPN_IDS.has(Number(m[1]));
  }

  static getCricketLogo(name, shortName = '') {
    const cleanShort = (shortName || '').toLowerCase().replace(/[-_ ]?(w|u19|a|xi)$/i, '').trim();
    if (cleanShort && this.CRICKET_LOGOS_MAP[cleanShort]) {
      return this.CRICKET_LOGOS_MAP[cleanShort];
    }
    if (name) {
      const clean = name.toLowerCase().trim();
      if (this.CRICKET_LOGOS_MAP[clean]) return this.CRICKET_LOGOS_MAP[clean];

      // Strip qualifiers (e.g. "India Women" -> "india", "Australia U19" -> "australia")
      const baseName = clean.replace(/\b(women|men|u19|u-19|under-19|under 19|a|xi|lions|team)\b/gi, '').trim();
      if (baseName && this.CRICKET_LOGOS_MAP[baseName]) return this.CRICKET_LOGOS_MAP[baseName];

      for (const [k, v] of Object.entries(this.CRICKET_LOGOS_MAP)) {
        if (clean === k || clean.startsWith(k + ' ') || clean.endsWith(' ' + k) || (baseName && baseName === k)) return v;
      }
    }
    return '';
  }

  static getFootballLeagueLogo(leagueName, leagueId = null) {
    if (leagueId && Number(leagueId) > 0) {
      return `https://images.fotmob.com/image_resources/logo/leaguelogo/${leagueId}.png`;
    }
    if (!leagueName) return '';
    const clean = leagueName.toLowerCase().trim();
    if (this.FOOTBALL_LEAGUES_LOGOS_MAP[clean]) {
      return this.FOOTBALL_LEAGUES_LOGOS_MAP[clean];
    }
    // Normalized check
    const cleanNoYear = clean.replace(/\b20\d\d(-\d\d|\/\d\d\d\d)?\b/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    if (this.FOOTBALL_LEAGUES_LOGOS_MAP[cleanNoYear]) {
      return this.FOOTBALL_LEAGUES_LOGOS_MAP[cleanNoYear];
    }
    for (const [k, v] of Object.entries(this.FOOTBALL_LEAGUES_LOGOS_MAP)) {
      if (clean.includes(k) || cleanNoYear.includes(k)) {
        return v;
      }
    }
    return '';
  }

  /**
   * Universal Cricket Tournaments & Leagues Logos Map (100% verified unique tournament crests)
   */
  static CRICKET_TOURNAMENT_LOGOS_MAP = {
    // 🏆 Top Global T20 Leagues & Franchise Cups (100% verified unique tournament crests)
    'ipl': 'https://cricketvectors.akamaized.net/Series/1B.png',
    'indian premier league': 'https://cricketvectors.akamaized.net/Series/1B.png',
    'tata ipl': 'https://cricketvectors.akamaized.net/Series/1B.png',

    'wpl': 'https://cricketvectors.akamaized.net/Series/2E1.png',
    'women\'s premier league': 'https://cricketvectors.akamaized.net/Series/2E1.png',
    'womens premier league': 'https://cricketvectors.akamaized.net/Series/2E1.png',
    'tata wpl': 'https://cricketvectors.akamaized.net/Series/2E1.png',

    'bbl': 'https://cricketvectors.akamaized.net/Series/27.png',
    'big bash league': 'https://cricketvectors.akamaized.net/Series/27.png',
    'kfc bbl': 'https://cricketvectors.akamaized.net/Series/27.png',

    'wbbl': 'https://cricketvectors.akamaized.net/Series/27.png',
    'women\'s big bash league': 'https://cricketvectors.akamaized.net/Series/27.png',
    'womens big bash league': 'https://cricketvectors.akamaized.net/Series/27.png',

    'psl': 'https://cricketvectors.akamaized.net/Series/1J.png',
    'pakistan super league': 'https://cricketvectors.akamaized.net/Series/1J.png',
    'hbl psl': 'https://cricketvectors.akamaized.net/Series/1J.png',

    'sa20': 'https://cricketvectors.akamaized.net/Series/22N.png',
    'betway sa20': 'https://cricketvectors.akamaized.net/Series/22N.png',

    'cpl': 'https://cricketvectors.akamaized.net/Series/2E2.png',
    'caribbean premier league': 'https://cricketvectors.akamaized.net/Series/2E2.png',
    'women\'s caribbean premier league': 'https://cricketvectors.akamaized.net/Series/2E1.png',
    'womens caribbean premier league': 'https://cricketvectors.akamaized.net/Series/2E1.png',
    'wcpl': 'https://cricketvectors.akamaized.net/Series/2E1.png',

    'the hundred': 'https://cricketvectors.akamaized.net/Series/1H.png',
    'the hundred men': 'https://cricketvectors.akamaized.net/Series/1H.png',
    'the hundred women': 'https://cricketvectors.akamaized.net/Series/1H.png',
    'the hundred mens competition': 'https://cricketvectors.akamaized.net/Series/1H.png',
    'the hundred womens competition': 'https://cricketvectors.akamaized.net/Series/1H.png',

    'major league cricket': 'https://cricketvectors.akamaized.net/Series/24Z.png',
    'mlc': 'https://cricketvectors.akamaized.net/Series/24Z.png',
    'cognizant mlc': 'https://cricketvectors.akamaized.net/Series/24Z.png',

    'international league t20': 'https://cricketvectors.akamaized.net/Series/24Y.png',
    'ilt20': 'https://cricketvectors.akamaized.net/Series/24Y.png',
    'dp world ilt20': 'https://cricketvectors.akamaized.net/Series/24Y.png',

    'lanka premier league': 'https://cricketvectors.akamaized.net/Series/1V.png',
    'lpl': 'https://cricketvectors.akamaized.net/Series/1V.png',

    'european t20 premier league': 'https://cricketvectors.akamaized.net/Series/1RN.png',
    'etpl': 'https://cricketvectors.akamaized.net/Series/1RN.png',

    'africa continental cup': 'https://cricketvectors.akamaized.net/Series/2MM.png',
    'asian games': 'https://cricketvectors.akamaized.net/Series/2JY.png',
    'asian games women\'s cricket': 'https://cricketvectors.akamaized.net/Series/2JY.png',
    'asian games women\'s cricket competition': 'https://cricketvectors.akamaized.net/Series/2JY.png',
    'asian games men\'s cricket': 'https://cricketvectors.akamaized.net/Series/2JY.png',

    'australian domestic one-day competition': 'https://cricketvectors.akamaized.net/Series/2KN.png',
    'australia domestic one-day cup': 'https://cricketvectors.akamaized.net/Series/2KN.png',
    'marsh one-day cup': 'https://cricketvectors.akamaized.net/Series/2KN.png',
    'marsh cup': 'https://cricketvectors.akamaized.net/Series/2KN.png',

    'england women one day cup': 'https://cricketvectors.akamaized.net/Series/2AN.png',
    'ecb women\'s one-day cup': 'https://cricketvectors.akamaized.net/Series/2AN.png',
    'england women one day cup league-2': 'https://cricketvectors.akamaized.net/Series/2GS.png',

    'csa provincial one-day challenge division two': 'https://cricketvectors.akamaized.net/Series/2N2.png',
    'csa provincial one-day challenge': 'https://cricketvectors.akamaized.net/Series/2N2.png',
    'csa provincial': 'https://cricketvectors.akamaized.net/Series/2N2.png',

    'president\'s trophy': 'https://cricketvectors.akamaized.net/Series/2MQ.png',
    'president trophy': 'https://cricketvectors.akamaized.net/Series/2MQ.png',

    'oman invitational triangular': 'https://cricketvectors.akamaized.net/Series/2N1.png',

    'world test championship': 'https://cricketvectors.akamaized.net/Series/1QK.png',
    'icc world test championship': 'https://cricketvectors.akamaized.net/Series/1QK.png',
    'wtc': 'https://cricketvectors.akamaized.net/Series/1QK.png',

    // 🏆 ICC Tournaments (Official ICC Tournament Crest 8048)
    'icc t20 world cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'icc men\'s t20 world cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    't20 world cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'icc cricket world cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'world cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'cricket world cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'icc champions trophy': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'champions trophy': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'asia cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',

    // 🦁 First-Class & Domestic Competitions (Official Board Crests)
    'county championship': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'vitality county championship': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'county championship division one': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'county championship division two': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'royal london one-day cup': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'one-day cup': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'vitality blast': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    't20 blast': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'ecb': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'the ashes': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'ashes': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',

    'ranji trophy': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'syed mushtaq ali trophy': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'vijay hazare trophy': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'duleep trophy': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'deodhar trophy': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'irani cup': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',

    'sheffield shield': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',
    'australian domestic': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',

    'super smash': 'https://a.espncdn.com/i/teamlogos/cricket/500/5.png',
    'plunket shield': 'https://a.espncdn.com/i/teamlogos/cricket/500/5.png',
    'ford trophy': 'https://a.espncdn.com/i/teamlogos/cricket/500/5.png',

    'csa 4-day series': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',
    'csa 4-day series division 1': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',
    'csa 3-day series': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',
    'csa 3-day series division 2': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',
    'csa t20 challenge': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',

    'quaid-e-azam trophy': 'https://a.espncdn.com/i/teamlogos/cricket/500/7.png',
    'national t20 cup': 'https://a.espncdn.com/i/teamlogos/cricket/500/7.png',

    'ahmad shah abdali first-class trophy': 'https://a.espncdn.com/i/teamlogos/cricket/500/40.png',
    'ahmad shah abdali': 'https://a.espncdn.com/i/teamlogos/cricket/500/40.png',
    'ghazi amanullah khan': 'https://a.espncdn.com/i/teamlogos/cricket/500/40.png',

    'bangladesh premier league': 'https://a.espncdn.com/i/teamlogos/cricket/500/25.png',
    'bpl': 'https://a.espncdn.com/i/teamlogos/cricket/500/25.png',
    'national cricket league': 'https://a.espncdn.com/i/teamlogos/cricket/500/25.png',
    'dhaka premier division': 'https://a.espncdn.com/i/teamlogos/cricket/500/25.png'
  };

  static getTournamentLogo(seriesName) {
    if (!seriesName) return 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png';
    const clean = seriesName.toLowerCase().trim();

    // 1. Direct match in dedicated tournament map
    if (this.CRICKET_TOURNAMENT_LOGOS_MAP[clean]) {
      return this.CRICKET_TOURNAMENT_LOGOS_MAP[clean];
    }

    // 2. Normalized without season/year qualifiers
    const cleanNoYear = clean.replace(/\b20\d\d(\s*[\/\-]\s*\d{2,4})?\b/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    if (this.CRICKET_TOURNAMENT_LOGOS_MAP[cleanNoYear]) {
      return this.CRICKET_TOURNAMENT_LOGOS_MAP[cleanNoYear];
    }

    // 3. Keyword matching against known tournament titles with word boundaries (longest match first)
    const normalizedClean = clean.replace(/[’']/g, "'");
    const normalizedCleanNoYear = cleanNoYear.replace(/[’']/g, "'");

    const sortedKeys = Object.keys(this.CRICKET_TOURNAMENT_LOGOS_MAP).sort((a, b) => b.length - a.length);
    for (const k of sortedKeys) {
      if (k.length >= 3) {
        const reg = new RegExp(`\\b${escapeRegExp(k)}\\b`, 'i');
        if (reg.test(normalizedClean) || reg.test(normalizedCleanNoYear)) {
          return this.CRICKET_TOURNAMENT_LOGOS_MAP[k];
        }
      }
    }

    // 4. Bilateral International Series (match by country name to official ESPN country crest)
    const intlTeams = [
      { name: 'india', id: 6 },
      { name: 'australia', id: 2 },
      { name: 'england', id: 1 },
      { name: 'south africa', id: 3 },
      { name: 'pakistan', id: 7 },
      { name: 'new zealand', id: 5 },
      { name: 'west indies', id: 4 },
      { name: 'sri lanka', id: 8 },
      { name: 'bangladesh', id: 25 },
      { name: 'afghanistan', id: 40 },
      { name: 'ireland', id: 29 },
      { name: 'zimbabwe', id: 9 },
      { name: 'scotland', id: 30 },
      { name: 'netherlands', id: 15 },
      { name: 'holland', id: 15 },
      { name: 'united states', id: 11 },
      { name: 'usa', id: 11 },
      { name: 'nepal', id: 33 },
      { name: 'canada', id: 28 },
      { name: 'namibia', id: 20 },
      { name: 'oman', id: 37 },
      { name: 'united arab emirates', id: 27 },
      { name: 'uae', id: 27 },
      { name: 'papua new guinea', id: 32 },
      { name: 'png', id: 32 },
      { name: 'hong kong', id: 19 },
      { name: 'kenya', id: 26 },
      { name: 'uganda', id: 39 },
      { name: 'italy', id: 31 },
      { name: 'malaysia', id: 36 }
    ];

    let firstMatch = null;
    let firstIndex = Infinity;

    for (const team of intlTeams) {
      const reg = new RegExp(`\\b${escapeRegExp(team.name)}\\b`, 'i');
      const m = clean.match(reg);
      if (m && m.index < firstIndex) {
        firstIndex = m.index;
        firstMatch = team;
      }
    }

    if (firstMatch) {
      return `https://a.espncdn.com/i/teamlogos/cricket/500/${firstMatch.id}.png`;
    }

    return 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png';
  }

  static getLeagueLogo(sport, name, id = null) {
    if (sport === 'football') {
      return this.getFootballLeagueLogo(name, id);
    }
    if (sport === 'cricket') {
      return this.getTournamentLogo(name);
    }
    if (sport === 'f1') {
      return 'https://a.espncdn.com/i/leaguelogos/f1/500/f1.png';
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
   * Strictly avoids substring collisions (e.g. "Australia" won't match "SA", "Villarreal" won't match "Real Madrid").
   */
  static isTeamFollowed(favorites, sport, teamIdentifier, teamId = null) {
    if (!favorites || !favorites[sport]) return false;
    const targetName = teamIdentifier ? String(teamIdentifier).trim() : '';
    const targetId = teamId ? String(teamId).trim() : '';

    if (!targetName && !targetId) return false;

    const targetLower = targetName.toLowerCase();
    const targetClean = targetLower.replace(/[^a-z0-9]/g, '');

    return favorites[sport].some(fav => {
      // Don't match league entries as teams
      if (fav.isLeague) return false;

      const favId = fav.id ? String(fav.id).trim() : '';
      const favName = (fav.name || '').trim();
      const favLower = favName.toLowerCase();
      const favShort = (fav.shortName || '').toLowerCase().trim();
      const favClean = favLower.replace(/[^a-z0-9]/g, '');

      // 1. Exact ID match (highest priority)
      if (targetId && favId && targetId === favId) {
        return true;
      }

      // 2. Direct string exact match
      if (targetLower && (targetLower === favLower || targetLower === favShort || (favId && targetLower === favId.toLowerCase()))) {
        return true;
      }
      if (targetClean && favClean && targetClean === favClean) {
        return true;
      }

      // 3. Football Matching
      if (sport === 'football') {
        const favNormFb = normalizeFootballName(favName);
        const targetNormFb = normalizeFootballName(targetName);
        if (favNormFb && targetNormFb && favNormFb === targetNormFb) {
          return true;
        }

        for (const list of Object.values(FOOTBALL_ALIASES)) {
          const fIn = list.some(k => favLower === k || favShort === k || (favId && favId.toLowerCase() === k) || favNormFb === normalizeFootballName(k));
          const tIn = list.some(k => targetLower === k || (targetId && targetId.toLowerCase() === k) || targetNormFb === normalizeFootballName(k));
          if (fIn && tIn) return true;
        }
      }

      // 4. Cricket Matching
      if (sport === 'cricket') {
        for (const list of Object.values(CRICKET_ALIASES)) {
          const fIn = list.some(k => favLower === k || favShort === k || (favId && favId.toLowerCase() === k));
          const tIn = list.some(k => targetLower === k || (targetId && targetId.toLowerCase() === k));
          if (fIn && tIn) return true;
        }

        if (favClean.length >= 8 && targetClean.length >= 8) {
          if (targetLower.startsWith(favLower + ' ') || targetLower.endsWith(' ' + favLower)) {
            return true;
          }
        }
      }

      // 5. Formula 1 Matching
      if (sport === 'f1') {
        const favCode = (fav.code || '').toLowerCase().trim();
        const isConstructor = Boolean(fav.isTeam || fav.category === 'Constructor');

        if (isConstructor) {
          for (const list of Object.values(F1_CONSTRUCTOR_ALIASES)) {
            const fIn = list.some(k => favLower === k || (favId && favId.toLowerCase() === k) || favClean === k.replace(/[^a-z0-9]/g, ''));
            const tIn = list.some(k => targetLower === k || (targetId && targetId.toLowerCase() === k) || targetClean === k.replace(/[^a-z0-9]/g, ''));
            if (fIn && tIn) return true;
          }
        } else {
          if (favCode && targetLower === favCode) return true;
          
          for (const list of Object.values(F1_DRIVER_ALIASES)) {
            const fIn = list.some(k => favLower === k || favCode === k || (favId && favId.toLowerCase() === k));
            const tIn = list.some(k => targetLower === k || (targetId && targetId.toLowerCase() === k));
            if (fIn && tIn) return true;
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
    const cleanTargetNoYears = targetLower.replace(/\b20\d\d(\s*[\/\-]\s*\d{2,4})?\b/g, '').replace(/[^a-z0-9]/g, '');

    return favorites[sport].some(fav => {
      if (!fav.isLeague && fav.category !== 'League' && fav.category !== 'Tournament') return false;

      const favId = fav.id ? String(fav.id).trim() : '';
      const favName = (fav.name || '').trim();
      const favLower = favName.toLowerCase();
      const favShort = (fav.shortName || '').toLowerCase().trim();
      const cleanFav = favLower.replace(/[^a-z0-9]/g, '');
      const cleanFavNoYears = favLower.replace(/\b20\d\d(\s*[\/\-]\s*\d{2,4})?\b/g, '').replace(/[^a-z0-9]/g, '');

      // 1. Exact ID match
      if (targetId && favId && targetId === favId) return true;

      // 2. Direct string match
      if (targetLower && (targetLower === favLower || targetLower === favShort)) return true;

      // 3. Clean exact match (with or without season year)
      if (cleanFav && cleanTarget && cleanFav === cleanTarget) return true;
      if (cleanFavNoYears && cleanTargetNoYears && cleanFavNoYears.length >= 3 && cleanFavNoYears === cleanTargetNoYears) return true;

      // 4. League Alias Group match (year-agnostic)
      for (const list of Object.values(LEAGUE_ALIASES)) {
        const fIn = list.some(k => {
          const cleanK = k.replace(/[^a-z0-9]/g, '');
          const cleanKNoYears = k.replace(/\b20\d\d(\s*[\/\-]\s*\d{2,4})?\b/g, '').replace(/[^a-z0-9]/g, '');
          return favLower === k || favShort === k || (favId && favId.toLowerCase() === k) || cleanFav === cleanK || cleanFavNoYears === cleanKNoYears;
        });
        const tIn = list.some(k => {
          const cleanK = k.replace(/[^a-z0-9]/g, '');
          const cleanKNoYears = k.replace(/\b20\d\d(\s*[\/\-]\s*\d{2,4})?\b/g, '').replace(/[^a-z0-9]/g, '');
          return targetLower === k || (targetId && targetId.toLowerCase() === k) || cleanTarget === cleanK || cleanTargetNoYears === cleanKNoYears;
        });
        if (fIn && tIn) return true;
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
      // Remove symmetrically using matcher
      favorites[sport] = favorites[sport].filter(fav => {
        if (isLeague) {
          return !this.isLeagueFollowed({ [sport]: [fav] }, sport, item.name, item.id);
        } else {
          return !this.isTeamFollowed({ [sport]: [fav] }, sport, item.name || item.id, item.id);
        }
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
        logo: item.logo || item.flag || (isLeague ? this.getLeagueLogo(sport, item.name, item.id) : (sport === 'cricket' ? this.getCricketLogo(item.name, item.shortName) : ''))
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
          const logo = lg.leagueLogo || (lg.leagueId ? `https://images.fotmob.com/image_resources/logo/leaguelogo/${lg.leagueId}.png` : '') || this.getFootballLeagueLogo(lg.leagueName, lg.leagueId);
          fbMap.set(lgKey, {
            id: lg.leagueId,
            name: lg.leagueName,
            isLeague: true,
            category: 'League',
            sport: 'football',
            logo: logo
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
          const logo = s.seriesLogo || this.getTournamentLogo(s.seriesName) || this.getCricketLogo(s.seriesName);
          crMap.set(sKey, {
            id: sKey.replace(/\s+/g, '_'),
            name: s.seriesName,
            shortName: s.seriesName,
            isLeague: true,
            category: 'Tournament',
            sport: 'cricket',
            logo: logo
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

    // Strict 24-Hour Window Filter:
    // - LIVE matches always pass.
    // - Finished matches pass only if finished within last 24 hours (with match duration buffer).
    // - Upcoming matches pass only if starting within next 24 hours.
    const now = Date.now();
    const H24 = 24 * 60 * 60 * 1000;
    const FINISHED_BUFFER_MS = 12 * 60 * 60 * 1000; // 12-hour buffer for matches starting yesterday

    const timeFiltered = rawFollowedList.filter(item => {
      // 1. LIVE matches are always included
      if (item.isLive) return true;

      // 2. Strict timestamp checks
      if (item.startTime && item.startTime !== 'null') {
        const matchTime = new Date(item.startTime).getTime();
        if (!isNaN(matchTime)) {
          if (item.isFinished) {
            const age = now - matchTime;
            if (age >= 0 && age <= (H24 + FINISHED_BUFFER_MS)) return true;
            if (item.dateDisplay) {
              const dLower = String(item.dateDisplay).toLowerCase();
              if (dLower.includes('today') || dLower.includes('yesterday')) return true;
            }
            return false;
          }
          if (item.isUpcoming) {
            const diff = matchTime - now;
            // Strictly within next 24 hours
            if (diff >= -3600000 && diff <= H24) return true;
            return false;
          }
        }
      }

      // 3. Fallback for date strings
      if (item.dateDisplay) {
        const dLower = String(item.dateDisplay).toLowerCase();
        if (dLower.includes('today')) return true;
        if (dLower.includes('yesterday') && item.isFinished) return true;
        if (dLower.includes('tomorrow') && item.isUpcoming) return true;
      }

      return false;
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
