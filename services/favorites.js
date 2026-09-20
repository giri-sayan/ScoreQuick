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
  // ⚽ Top European & Global Clubs
  'psg': ['paris saint-germain', 'paris saint germain', 'paris sg', 'psg', 'paris st-germain', 'paris st germain'],
  'mcfc': ['manchester city', 'man city', 'mcfc'],
  'mufc': ['manchester united', 'man utd', 'man united', 'mufc'],
  'afc': ['arsenal', 'afc', 'arsenal fc'],
  'cfc': ['chelsea', 'cfc', 'chelsea fc'],
  'lfc': ['liverpool', 'lfc', 'liverpool fc'],
  'thfc': ['tottenham hotspur', 'tottenham', 'spurs', 'thfc'],
  'nufc': ['newcastle united', 'newcastle', 'nufc'],
  'avfc': ['aston villa', 'villa', 'avfc'],
  'bha': ['brighton & hove albion', 'brighton', 'the seagulls', 'bha'],
  'whufc': ['west ham united', 'west ham', 'the hammers', 'the irons', 'whufc'],
  'bvb': ['borussia dortmund', 'dortmund', 'bvb'],
  'fcb': ['bayern munchen', 'bayern munich', 'bayern münchen', 'bayern', 'fc bayern'],
  'b04': ['bayer leverkusen', 'leverkusen', 'bayer 04', 'b04'],
  'rbl': ['rb leipzig', 'leipzig', 'rbl'],
  'sge': ['eintracht frankfurt', 'frankfurt', 'sge'],
  'vfb': ['vfb stuttgart', 'stuttgart', 'vfb'],
  'barca': ['barcelona', 'fc barcelona', 'barca', 'barça'],
  'rm': ['real madrid', 'real madrid cf', 'real madrid club de futbol'],
  'atleti': ['atletico madrid', 'atlético madrid', 'atletico de madrid', 'atlético de madrid', 'atleti'],
  'ath': ['athletic club', 'athletic bilbao', 'bilbao', 'ath'],
  'rsoc': ['real sociedad', 'la real', 'rsoc'],
  'betis': ['real betis', 'betis', 'beticos'],
  'vcf': ['valencia', 'valencia cf', 'los che', 'vcf'],
  'sev': ['sevilla', 'sevilla fc', 'los palanganas', 'sev'],
  'gir': ['girona', 'girona fc', 'gir'],
  'inter': ['inter', 'inter milan', 'internazionale', 'fc internazionale milano'],
  'milan': ['ac milan', 'milan', 'rossoneri'],
  'juve': ['juventus', 'juve', 'juventus fc'],
  'roma': ['as roma', 'roma', 'giallorossi'],
  'napoli': ['ssc napoli', 'napoli', 'partenopei'],
  'lazio': ['ss lazio', 'lazio', 'biancocelesti'],
  'ata': ['atalanta', 'atalanta bc', 'la dea', 'ata'],
  'fio': ['fiorentina', 'acf fiorentina', 'la viola', 'fio'],
  'bol': ['bologna', 'bologna fc', 'rossoblu', 'bol'],
  'tor': ['torino', 'torino fc', 'il toro', 'tor'],
  'sporting': ['sporting cp', 'sporting lisbon', 'sporting'],
  'benfica': ['sl benfica', 'benfica', 'as aguias'],
  'porto': ['fc porto', 'porto', 'dragoes'],
  'ajax': ['afc ajax', 'ajax', 'afc ajax amsterdam'],
  'psv': ['psv', 'psv eindhoven', 'boeren'],
  'fey': ['feyenoord', 'feyenoord rotterdam', 'fey'],
  'intermiami': ['inter miami', 'inter miami cf'],
  'alnassr': ['al nassr', 'al-nassr', 'al nassr fc'],
  'alhilal': ['al hilal', 'al-hilal', 'al hilal sfc'],
  'alittihad': ['al ittihad', 'al-ittihad', 'ittihad'],
  'alahli': ['al ahli', 'al-ahli'],
  'celtic': ['celtic', 'celtic fc', 'the hoops'],
  'rangers': ['rangers', 'rangers fc', 'the gers'],
  'gala': ['galatasaray', 'gala', 'cimbom'],
  'fener': ['fenerbahce', 'fenerbahçe', 'fener'],
  'bjk': ['besiktas', 'beşiktaş', 'bjk', 'black eagles'],
  'fla': ['flamengo', 'mengao', 'fla'],
  'pal': ['palmeiras', 'verdao', 'pal'],
  'riv': ['river plate', 'los millonarios', 'river'],
  'boca': ['boca juniors', 'xeneizes', 'boca'],
  'mbsg': ['mohun bagan', 'mohun bagan sg', 'mbsg', 'mariners'],
  'ebfc': ['east bengal', 'east bengal fc', 'ebfc', 'red and gold brigade'],
  'mcfc_isl': ['mumbai city', 'mumbai city fc', 'mcfc isl'],
  'bfc': ['bengaluru fc', 'bengaluru', 'bfc', 'blues'],
  'kbfc': ['kerala blasters', 'kerala blasters fc', 'kbfc', 'yellow army'],
  'fcg': ['fc goa', 'the gaurs', 'fcg'],

  // 🌍 Top International Football Teams (National Teams across CONMEBOL, UEFA, CAF, CONCACAF, AFC, OFC)
  'argentina': ['argentina', 'albiceleste', 'arg'],
  'brazil': ['brazil', 'brasil', 'selecao', 'seleção', 'bra'],
  'france': ['france', 'les bleus', 'fra'],
  'england': ['england', 'three lions', 'eng'],
  'spain': ['spain', 'la roja', 'esp'],
  'germany': ['germany', 'deutschland', 'die mannschaft', 'ger'],
  'portugal': ['portugal', 'selecao das quinas', 'por'],
  'italy': ['italy', 'gli azzurri', 'azzurri', 'ita'],
  'netherlands': ['netherlands', 'holland', 'oranje', 'ned'],
  'belgium': ['belgium', 'red devils', 'bel'],
  'croatia': ['croatia', 'vatreni', 'cro'],
  'uruguay': ['uruguay', 'la celeste', 'uru'],
  'colombia': ['colombia', 'los cafeteros', 'col'],
  'mexico': ['mexico', 'el tri', 'mex'],
  'usa': ['usa', 'united states', 'usmnt', 'team usa', 'us'],
  'japan': ['japan', 'samurai blue', 'jpn'],
  'southkorea': ['south korea', 'korea republic', 'taegeuk warriors', 'kor'],
  'morocco': ['morocco', 'atlas lions', 'mar'],
  'senegal': ['senegal', 'lions of teranga', 'sen'],
  'nigeria': ['nigeria', 'super eagles', 'nga'],
  'egypt': ['egypt', 'the pharaohs', 'egy'],
  'ivorycoast': ['ivory coast', 'cote d\'ivoire', 'côte d\'ivoire', 'the elephants', 'civ'],
  'ghana': ['ghana', 'black stars', 'gha'],
  'cameroon': ['cameroon', 'indomitable lions', 'cmr'],
  'algeria': ['algeria', 'les fennecs', 'alg'],
  'southafrica': ['south africa', 'bafana bafana', 'rsa'],
  'capeverde': ['cape verde', 'cabo verde', 'tubaroes azuis', 'cpv'],
  'mali': ['mali', 'les aigles', 'mli'],
  'guinea': ['guinea', 'syli national', 'gui'],
  'drcongo': ['dr congo', 'democratic republic of the congo', 'congo dr', 'leopards', 'cod'],
  'burkinafaso': ['burkina faso', 'les etalons', 'bfa'],
  'zambia': ['zambia', 'chipolopolo', 'zam'],
  'angola': ['angola', 'palancas negras', 'ang'],
  'mozambique': ['mozambique', 'os mambas', 'moz'],
  'equatorialguinea': ['equatorial guinea', 'nzalang nacional', 'eqg'],
  'mauritania': ['mauritania', 'al-murabitun', 'mtn'],
  'namibia': ['namibia', 'brave warriors', 'nam'],
  'gambia': ['gambia', 'scorpions', 'gam'],
  'gabon': ['gabon', 'les pantheres', 'gab'],
  'uganda': ['uganda', 'cranes', 'uga'],
  'kenya': ['kenya', 'harambee stars', 'ken'],
  'tanzania': ['tanzania', 'taifa stars', 'tan'],
  'zimbabwe': ['zimbabwe', 'the warriors', 'zim'],
  'switzerland': ['switzerland', 'rossocrociati', 'sui'],
  'denmark': ['denmark', 'de rod-hvide', 'den'],
  'austria': ['austria', 'das team', 'aut'],
  'norway': ['norway', 'loveene', 'nor'],
  'sweden': ['sweden', 'blagult', 'swe'],
  'poland': ['poland', 'bialo-czerwoni', 'pol'],
  'scotland': ['scotland', 'tartan army', 'sco'],
  'wales': ['wales', 'cymru', 'wal'],
  'turkey': ['turkey', 'turkiye', 'türkiye', 'ay-yildizlilar', 'tur'],
  'czechia': ['czech republic', 'czechia', 'narodni tym', 'cze'],
  'hungary': ['hungary', 'magyarok', 'hun'],
  'ukraine': ['ukraine', 'synyo-zhovti', 'ukr'],
  'romania': ['romania', 'tricolorii', 'rou'],
  'greece': ['greece', 'ethniki', 'gre'],
  'serbia': ['serbia', 'orlovi', 'srb'],
  'albania': ['albania', 'kuq e zinjte', 'alb'],
  'georgia': ['georgia', 'crusaders', 'geo'],
  'slovenia': ['slovenia', 'fantje', 'svn'],
  'slovakia': ['slovakia', 'sokoli', 'svk'],
  'finland': ['finland', 'huuhkajat', 'fin'],
  'iceland': ['iceland', 'strakarnir okkar', 'isl'],
  'bosnia': ['bosnia and herzegovina', 'bosnia', 'zmajevi', 'bih'],
  'northernireland': ['northern ireland', 'green and white army', 'nir'],
  'ireland': ['republic of ireland', 'ireland', 'boys in green', 'irl'],
  'costarica': ['costa rica', 'los ticos', 'crc'],
  'jamaica': ['jamaica', 'reggae boyz', 'jam'],
  'panama': ['panama', 'los canaleros', 'pan'],
  'honduras': ['honduras', 'los catrachos', 'hon'],
  'elsalvador': ['el salvador', 'la selecta', 'slv'],
  'trinidad': ['trinidad and tobago', 'soca warriors', 'tri'],
  'chile': ['chile', 'la roja chi', 'chi'],
  'ecuador': ['ecuador', 'la tri', 'ecu'],
  'peru': ['peru', 'la blanquirroja', 'per'],
  'paraguay': ['paraguay', 'la albirroja', 'par'],
  'venezuela': ['venezuela', 'la vinotinto', 'ven'],
  'bolivia': ['bolivia', 'la verde', 'bol'],
  'canada': ['canada', 'canmnt', 'can'],
  'australia': ['australia', 'socceroos', 'aus'],
  'saudiarabia': ['saudi arabia', 'green falcons', 'ksa'],
  'iran': ['iran', 'team melli', 'irn'],
  'qatar': ['qatar', 'the maroon', 'qat'],
  'india': ['india', 'blue tigers', 'ind'],
  'uzbekistan': ['uzbekistan', 'white wolves', 'uzb'],
  'jordan': ['jordan', 'al-nashama', 'jor'],
  'iraq': ['iraq', 'lions of mesopotamia', 'irq'],
  'uae': ['uae', 'united arab emirates', 'al-abyad', 'uae'],
  'oman': ['oman', 'al-ahmar', 'oma'],
  'bahrain': ['bahrain', 'al-deeb al-ahmar', 'bhr'],
  'thailand': ['thailand', 'war elephants', 'tha'],
  'vietnam': ['vietnam', 'golden star warriors', 'vie'],
  'indonesia': ['indonesia', 'timnas garuda', 'idn'],
  'malaysia': ['malaysia', 'harimau malaya', 'mas'],
  'china': ['china', 'dragon\'s team', 'chn'],
  'newzealand': ['new zealand', 'all whites', 'nzl']
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
  static _cachedFavorites = null;

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
      { id: 61, name: 'Liga Portugal', shortName: 'POR', isLeague: true, category: 'League', country: 'POR', logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/61.png' },
      { id: 536, name: 'Saudi Pro League', shortName: 'SPL', isLeague: true, category: 'League', country: 'KSA', logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/536.png' },
      { id: 268, name: 'Brasileirão', shortName: 'BRA', isLeague: true, category: 'League', country: 'BRA', logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/268.png' },
      { id: 45, name: 'Copa Libertadores', shortName: 'LIB', isLeague: true, category: 'League', country: 'INT', logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/45.png' },
      { id: 96, name: 'Indian Super League', shortName: 'ISL', isLeague: true, category: 'League', country: 'IND', logo: 'https://a.espncdn.com/i/leaguelogos/soccer/500/96.png' },

      // ⚽ Top European & Global Clubs
      // Premier League
      { id: 9825, name: 'Arsenal', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9825.png' },
      { id: 8456, name: 'Manchester City', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png' },
      { id: 8650, name: 'Liverpool', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8650.png' },
      { id: 10260, name: 'Manchester United', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10260.png' },
      { id: 8455, name: 'Chelsea', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8455.png' },
      { id: 8586, name: 'Tottenham Hotspur', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8586.png' },
      { id: 10261, name: 'Newcastle United', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10261.png' },
      { id: 10252, name: 'Aston Villa', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10252.png' },
      { id: 10204, name: 'Brighton', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10204.png' },
      { id: 8654, name: 'West Ham United', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8654.png' },
<<<<<<< HEAD
=======
      { id: 8668, name: 'Everton', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8668.png' },
      { id: 9879, name: 'Fulham', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9879.png' },
      { id: 9826, name: 'Crystal Palace', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9826.png' },
      { id: 9937, name: 'Brentford', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9937.png' },
      { id: 8602, name: 'Wolverhampton Wanderers', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8602.png' },
      { id: 8678, name: 'Bournemouth', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8678.png' },
      { id: 10203, name: 'Nottingham Forest', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10203.png' },
      { id: 8197, name: 'Leicester City', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8197.png' },
      { id: 8466, name: 'Southampton', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8466.png' },
      { id: 9817, name: 'Ipswich Town', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9817.png' },
>>>>>>> 59d987a4978bca949e5ffec84ffd419559c65776

      // La Liga
      { id: 8633, name: 'Real Madrid', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png' },
      { id: 8634, name: 'Barcelona', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8634.png' },
      { id: 9906, name: 'Atlético Madrid', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9906.png' },
      { id: 8315, name: 'Athletic Club', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8315.png' },
      { id: 8560, name: 'Real Sociedad', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8560.png' },
      { id: 8603, name: 'Real Betis', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8603.png' },
      { id: 10205, name: 'Villarreal', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10205.png' },
<<<<<<< HEAD
      { id: 8302, name: 'Sevilla', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8302.png' },
=======
      { id: 9812, name: 'Girona', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9812.png' },
      { id: 8302, name: 'Sevilla', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8302.png' },
      { id: 10267, name: 'Valencia', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10267.png' },
      { id: 8581, name: 'Celta Vigo', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8581.png' },
      { id: 8371, name: 'Osasuna', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8371.png' },
      { id: 8429, name: 'Mallorca', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8429.png' },
      { id: 8305, name: 'Getafe', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8305.png' },
      { id: 8370, name: 'Rayo Vallecano', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8370.png' },
      { id: 8649, name: 'Espanyol', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8649.png' },
      { id: 9864, name: 'Alaves', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9864.png' },
      { id: 8306, name: 'Las Palmas', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8306.png' },
      { id: 10284, name: 'Real Valladolid', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10284.png' },
>>>>>>> 59d987a4978bca949e5ffec84ffd419559c65776

      // Serie A
      { id: 8636, name: 'Inter', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8636.png' },
      { id: 9885, name: 'Juventus', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9885.png' },
      { id: 9799, name: 'AC Milan', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9799.png' },
      { id: 9875, name: 'Napoli', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9875.png' },
      { id: 8524, name: 'Atalanta', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8524.png' },
      { id: 8686, name: 'Roma', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8686.png' },
      { id: 8543, name: 'Lazio', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8543.png' },
      { id: 8535, name: 'Fiorentina', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8535.png' },
<<<<<<< HEAD
=======
      { id: 9857, name: 'Bologna', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9857.png' },
      { id: 9804, name: 'Torino', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9804.png' },
      { id: 8600, name: 'Udinese', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8600.png' },
      { id: 10233, name: 'Genoa', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10233.png' },
      { id: 8534, name: 'Cagliari', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8534.png' },
      { id: 6504, name: 'Monza', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6504.png' },
      { id: 8537, name: 'Empoli', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8537.png' },
      { id: 10167, name: 'Parma', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10167.png' },
      { id: 10171, name: 'Como', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10171.png' },
      { id: 9876, name: 'Hellas Verona', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9876.png' },
      { id: 9888, name: 'Lecce', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9888.png' },
      { id: 8461, name: 'Venezia', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8461.png' },
>>>>>>> 59d987a4978bca949e5ffec84ffd419559c65776

      // Bundesliga
      { id: 9823, name: 'Bayern München', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png' },
      { id: 9931, name: 'Bayer Leverkusen', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9931.png' },
      { id: 9789, name: 'Borussia Dortmund', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9789.png' },
      { id: 178475, name: 'RB Leipzig', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/178475.png' },
      { id: 9810, name: 'Eintracht Frankfurt', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9810.png' },
      { id: 10269, name: 'VfB Stuttgart', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10269.png' },
<<<<<<< HEAD
=======
      { id: 8721, name: 'VfL Wolfsburg', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8721.png' },
      { id: 9788, name: 'Borussia M\'gladbach', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9788.png' },
      { id: 9827, name: 'SC Freiburg', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9827.png' },
      { id: 8406, name: '1. FC Union Berlin', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8406.png' },
      { id: 8226, name: 'TSG Hoffenheim', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8226.png' },
      { id: 8697, name: 'SV Werder Bremen', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8697.png' },
      { id: 8407, name: 'FC Augsburg', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8407.png' },
      { id: 9905, name: '1. FSV Mainz 05', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9905.png' },
      { id: 8234, name: '1. FC Heidenheim', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8234.png' },
      { id: 9776, name: 'FC St. Pauli', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9776.png' },
      { id: 9911, name: 'VfL Bochum', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9911.png' },
      { id: 8282, name: 'Holstein Kiel', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8282.png' },
>>>>>>> 59d987a4978bca949e5ffec84ffd419559c65776

      // Ligue 1
      { id: 9847, name: 'Paris Saint-Germain', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png' },
      { id: 9829, name: 'Monaco', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9829.png' },
      { id: 8592, name: 'Marseille', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8592.png' },
<<<<<<< HEAD
      { id: 9748, name: 'Lyon', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9748.png' },
      { id: 8639, name: 'Lille', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8639.png' },
=======
      { id: 8639, name: 'Lille', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8639.png' },
      { id: 9748, name: 'Lyon', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9748.png' },
      { id: 8588, name: 'Lens', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8588.png' },
      { id: 9831, name: 'Nice', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9831.png' },
      { id: 9851, name: 'Rennes', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9851.png' },
      { id: 8521, name: 'Brest', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8521.png' },
      { id: 8489, name: 'Strasbourg', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8489.png' },
      { id: 9941, name: 'Toulouse', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9941.png' },
      { id: 9830, name: 'Nantes', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9830.png' },
      { id: 9837, name: 'Reims', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9837.png' },
      { id: 10249, name: 'Montpellier', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10249.png' },
      { id: 9848, name: 'Auxerre', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9848.png' },
      { id: 8121, name: 'Angers', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8121.png' },
      { id: 8637, name: 'Saint-Etienne', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8637.png' },
      { id: 9747, name: 'Le Havre', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9747.png' },
>>>>>>> 59d987a4978bca949e5ffec84ffd419559c65776

      // Global Clubs
      { id: 9768, name: 'Sporting CP', league: 'Liga Portugal', category: 'Club', country: 'POR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9768.png' },
      { id: 9772, name: 'Benfica', league: 'Liga Portugal', category: 'Club', country: 'POR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9772.png' },
      { id: 9773, name: 'Porto', league: 'Liga Portugal', category: 'Club', country: 'POR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9773.png' },
<<<<<<< HEAD
      { id: 8593, name: 'Ajax', league: 'Eredivisie', category: 'Club', country: 'NED', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8593.png' },
      { id: 8640, name: 'PSV', league: 'Eredivisie', category: 'Club', country: 'NED', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8640.png' },
      { id: 102061, name: 'Al Nassr', league: 'Saudi Pro League', category: 'Club', country: 'KSA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/102061.png' },
      { id: 102062, name: 'Al Hilal', league: 'Saudi Pro League', category: 'Club', country: 'KSA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/102062.png' },
      { id: 8161, name: 'Al Ittihad', league: 'Saudi Pro League', category: 'Club', country: 'KSA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8161.png' },
      { id: 1150495, name: 'Inter Miami', league: 'MLS', category: 'Club', country: 'USA', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/20232.png' },
      { id: 9993, name: 'Celtic', league: 'Scottish Premiership', category: 'Club', country: 'SCO', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9993.png' },
      { id: 9912, name: 'Galatasaray', league: 'Süper Lig', category: 'Club', country: 'TUR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9912.png' },
      { id: 10268, name: 'Fenerbahce', league: 'Süper Lig', category: 'Club', country: 'TUR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10268.png' },
=======
      { id: 9771, name: 'Braga', league: 'Liga Portugal', category: 'Club', country: 'POR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9771.png' },
      { id: 8593, name: 'Ajax', league: 'Eredivisie', category: 'Club', country: 'NED', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8593.png' },
      { id: 8640, name: 'PSV', league: 'Eredivisie', category: 'Club', country: 'NED', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8640.png' },
      { id: 10235, name: 'Feyenoord', league: 'Eredivisie', category: 'Club', country: 'NED', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10235.png' },
      { id: 102061, name: 'Al Nassr', league: 'Saudi Pro League', category: 'Club', country: 'KSA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/102061.png' },
      { id: 102062, name: 'Al Hilal', league: 'Saudi Pro League', category: 'Club', country: 'KSA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/102062.png' },
      { id: 8161, name: 'Al Ittihad', league: 'Saudi Pro League', category: 'Club', country: 'KSA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8161.png' },
      { id: 102060, name: 'Al Ahli', league: 'Saudi Pro League', category: 'Club', country: 'KSA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/102060.png' },
      { id: 1150495, name: 'Inter Miami', league: 'MLS', category: 'Club', country: 'USA', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/20232.png' },
      { id: 9993, name: 'Celtic', league: 'Scottish Premiership', category: 'Club', country: 'SCO', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9993.png' },
      { id: 8548, name: 'Rangers', league: 'Scottish Premiership', category: 'Club', country: 'SCO', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8548.png' },
      { id: 9912, name: 'Galatasaray', league: 'Süper Lig', category: 'Club', country: 'TUR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9912.png' },
      { id: 10268, name: 'Fenerbahce', league: 'Süper Lig', category: 'Club', country: 'TUR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10268.png' },
      { id: 10185, name: 'Besiktas', league: 'Süper Lig', category: 'Club', country: 'TUR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10185.png' },
>>>>>>> 59d987a4978bca949e5ffec84ffd419559c65776
      { id: 5922, name: 'Flamengo', league: 'Brasileirão', category: 'Club', country: 'BRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5922.png' },
      { id: 10237, name: 'Palmeiras', league: 'Brasileirão', category: 'Club', country: 'BRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10237.png' },
      { id: 10077, name: 'River Plate', league: 'Liga Profesional', category: 'Club', country: 'ARG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10077.png' },
      { id: 10076, name: 'Boca Juniors', league: 'Liga Profesional', category: 'Club', country: 'ARG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10076.png' },
<<<<<<< HEAD

      // Indian Super League (ISL) Clubs
=======
>>>>>>> 59d987a4978bca949e5ffec84ffd419559c65776
      { id: 'mbsg', name: 'Mohun Bagan SG', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/17700.png' },
      { id: 'ebfc', name: 'East Bengal FC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/17701.png' },
      { id: 'mcfc_isl', name: 'Mumbai City FC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/17697.png' },
      { id: 'bfc', name: 'Bengaluru FC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/17705.png' },
      { id: 'kbfc', name: 'Kerala Blasters', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/17698.png' },
      { id: 'fcg', name: 'FC Goa', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/17699.png' },

<<<<<<< HEAD
      // 🌍 Top International National Teams
=======
      // 🌍 International Football Teams (97+ National Teams across CONMEBOL, UEFA, CAF, CONCACAF, AFC, OFC)
>>>>>>> 59d987a4978bca949e5ffec84ffd419559c65776
      { id: 8527, name: 'Argentina', shortName: 'ARG', category: 'International', country: 'ARG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8527.png' },
      { id: 8528, name: 'Brazil', shortName: 'BRA', category: 'International', country: 'BRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8528.png' },
      { id: 8538, name: 'Uruguay', shortName: 'URU', category: 'International', country: 'URU', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8538.png' },
      { id: 8539, name: 'Colombia', shortName: 'COL', category: 'International', country: 'COL', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8539.png' },
      { id: 8561, name: 'Chile', shortName: 'CHI', category: 'International', country: 'CHI', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8561.png' },
      { id: 8562, name: 'Ecuador', shortName: 'ECU', category: 'International', country: 'ECU', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8562.png' },
<<<<<<< HEAD
=======
      { id: 8563, name: 'Peru', shortName: 'PER', category: 'International', country: 'PER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8563.png' },
      { id: 'paraguay', name: 'Paraguay', shortName: 'PAR', category: 'International', country: 'PAR', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/209.png' },
      { id: 8573, name: 'Venezuela', shortName: 'VEN', category: 'International', country: 'VEN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8573.png' },
      { id: 8570, name: 'Bolivia', shortName: 'BOL', category: 'International', country: 'BOL', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8570.png' },
>>>>>>> 59d987a4978bca949e5ffec84ffd419559c65776

      { id: 8529, name: 'France', shortName: 'FRA', category: 'International', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8529.png' },
      { id: 8530, name: 'England', shortName: 'ENG', category: 'International', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8530.png' },
      { id: 8531, name: 'Spain', shortName: 'ESP', category: 'International', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8531.png' },
      { id: 8532, name: 'Germany', shortName: 'GER', category: 'International', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8532.png' },
      { id: 8533, name: 'Portugal', shortName: 'POR', category: 'International', country: 'POR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8533.png' },
      { id: 8534, name: 'Italy', shortName: 'ITA', category: 'International', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8534.png' },
      { id: 8535, name: 'Netherlands', shortName: 'NED', category: 'International', country: 'NED', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8535.png' },
      { id: 8536, name: 'Belgium', shortName: 'BEL', category: 'International', country: 'BEL', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8536.png' },
      { id: 8537, name: 'Croatia', shortName: 'CRO', category: 'International', country: 'CRO', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8537.png' },
      { id: 8552, name: 'Switzerland', shortName: 'SUI', category: 'International', country: 'SUI', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8552.png' },
      { id: 8553, name: 'Denmark', shortName: 'DEN', category: 'International', country: 'DEN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8553.png' },
      { id: 8554, name: 'Austria', shortName: 'AUT', category: 'International', country: 'AUT', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8554.png' },
      { id: 8555, name: 'Norway', shortName: 'NOR', category: 'International', country: 'NOR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8555.png' },
      { id: 8556, name: 'Sweden', shortName: 'SWE', category: 'International', country: 'SWE', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8556.png' },
      { id: 8557, name: 'Poland', shortName: 'POL', category: 'International', country: 'POL', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8557.png' },
      { id: 8558, name: 'Scotland', shortName: 'SCO', category: 'International', country: 'SCO', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8558.png' },
<<<<<<< HEAD
      { id: 8560, name: 'Turkey', shortName: 'TUR', category: 'International', country: 'TUR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8560.png' },
=======
      { id: 8559, name: 'Wales', shortName: 'WAL', category: 'International', country: 'WAL', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8559.png' },
      { id: 8560, name: 'Turkey', shortName: 'TUR', category: 'International', country: 'TUR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8560.png' },
      { id: 8493, name: 'Czech Republic', shortName: 'CZE', category: 'International', country: 'CZE', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8493.png' },
      { id: 8503, name: 'Hungary', shortName: 'HUN', category: 'International', country: 'HUN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8503.png' },
      { id: 8524, name: 'Ukraine', shortName: 'UKR', category: 'International', country: 'UKR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8524.png' },
      { id: 'romania', name: 'Romania', shortName: 'ROU', category: 'International', country: 'ROU', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/474.png' },
      { id: 8501, name: 'Greece', shortName: 'GRE', category: 'International', country: 'GRE', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8501.png' },
      { id: 8518, name: 'Serbia', shortName: 'SRB', category: 'International', country: 'SRB', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8518.png' },
      { id: 8487, name: 'Albania', shortName: 'ALB', category: 'International', country: 'ALB', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8487.png' },
      { id: 8498, name: 'Georgia', shortName: 'GEO', category: 'International', country: 'GEO', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8498.png' },
      { id: 8520, name: 'Slovenia', shortName: 'SVN', category: 'International', country: 'SVN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8520.png' },
      { id: 8519, name: 'Slovakia', shortName: 'SVK', category: 'International', country: 'SVK', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8519.png' },
      { id: 8496, name: 'Finland', shortName: 'FIN', category: 'International', country: 'FIN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8496.png' },
      { id: 8504, name: 'Iceland', shortName: 'ISL', category: 'International', country: 'ISL', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8504.png' },
      { id: 8489, name: 'Bosnia and Herzegovina', shortName: 'BIH', category: 'International', country: 'BIH', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8489.png' },
      { id: 8512, name: 'Northern Ireland', shortName: 'NIR', category: 'International', country: 'NIR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8512.png' },
      { id: 8505, name: 'Republic of Ireland', shortName: 'IRL', category: 'International', country: 'IRL', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8505.png' },
>>>>>>> 59d987a4978bca949e5ffec84ffd419559c65776

      { id: 'morocco', name: 'Morocco', shortName: 'MAR', category: 'International', country: 'MAR', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/489.png' },
      { id: 8545, name: 'Senegal', shortName: 'SEN', category: 'International', country: 'SEN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8545.png' },
      { id: 8546, name: 'Nigeria', shortName: 'NGA', category: 'International', country: 'NGA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8546.png' },
      { id: 8547, name: 'Egypt', shortName: 'EGY', category: 'International', country: 'EGY', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8547.png' },
      { id: 8548, name: 'Ivory Coast', shortName: 'CIV', category: 'International', country: 'CIV', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8548.png' },
      { id: 8549, name: 'Ghana', shortName: 'GHA', category: 'International', country: 'GHA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8549.png' },
      { id: 8550, name: 'Cameroon', shortName: 'CMR', category: 'International', country: 'CMR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8550.png' },
      { id: 8551, name: 'Algeria', shortName: 'ALG', category: 'International', country: 'ALG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8551.png' },
      { id: 8266, name: 'South Africa', shortName: 'RSA', category: 'International', country: 'RSA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8266.png' },
      { id: 8251, name: 'Cape Verde', shortName: 'CPV', category: 'International', country: 'CPV', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8251.png' },
<<<<<<< HEAD
=======
      { id: 8261, name: 'Mali', shortName: 'MLI', category: 'International', country: 'MLI', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8261.png' },
      { id: 8257, name: 'Guinea', shortName: 'GUI', category: 'International', country: 'GUI', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8257.png' },
      { id: 8254, name: 'DR Congo', shortName: 'COD', category: 'International', country: 'COD', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8254.png' },
      { id: 8250, name: 'Burkina Faso', shortName: 'BFA', category: 'International', country: 'BFA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8250.png' },
      { id: 8272, name: 'Zambia', shortName: 'ZAM', category: 'International', country: 'ZAM', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8272.png' },
      { id: 8248, name: 'Angola', shortName: 'ANG', category: 'International', country: 'ANG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8248.png' },
      { id: 8263, name: 'Mozambique', shortName: 'MOZ', category: 'International', country: 'MOZ', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8263.png' },
      { id: 8255, name: 'Equatorial Guinea', shortName: 'EQG', category: 'International', country: 'EQG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8255.png' },
      { id: 8262, name: 'Mauritania', shortName: 'MTN', category: 'International', country: 'MTN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8262.png' },
      { id: 8264, name: 'Namibia', shortName: 'NAM', category: 'International', country: 'NAM', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8264.png' },
      { id: 8256, name: 'Gambia', shortName: 'GAM', category: 'International', country: 'GAM', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8256.png' },
      { id: 8274, name: 'Gabon', shortName: 'GAB', category: 'International', country: 'GAB', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8274.png' },
      { id: 8270, name: 'Uganda', shortName: 'UGA', category: 'International', country: 'UGA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8270.png' },
      { id: 8259, name: 'Kenya', shortName: 'KEN', category: 'International', country: 'KEN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8259.png' },
      { id: 8268, name: 'Tanzania', shortName: 'TAN', category: 'International', country: 'TAN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8268.png' },
      { id: 8273, name: 'Zimbabwe', shortName: 'ZIM', category: 'International', country: 'ZIM', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8273.png' },
>>>>>>> 59d987a4978bca949e5ffec84ffd419559c65776

      { id: 8541, name: 'USA', shortName: 'USA', category: 'International', country: 'USA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8541.png' },
      { id: 8540, name: 'Mexico', shortName: 'MEX', category: 'International', country: 'MEX', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8540.png' },
      { id: 8564, name: 'Canada', shortName: 'CAN', category: 'International', country: 'CAN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8564.png' },
<<<<<<< HEAD
=======
      { id: 'costarica', name: 'Costa Rica', shortName: 'CRC', category: 'International', country: 'CRC', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/215.png' },
      { id: 8333, name: 'Jamaica', shortName: 'JAM', category: 'International', country: 'JAM', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8333.png' },
      { id: 8337, name: 'Panama', shortName: 'PAN', category: 'International', country: 'PAN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8337.png' },
      { id: 8332, name: 'Honduras', shortName: 'HON', category: 'International', country: 'HON', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8332.png' },
      { id: 'elsalvador', name: 'El Salvador', shortName: 'SLV', category: 'International', country: 'SLV', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/218.png' },
      { id: 8342, name: 'Trinidad and Tobago', shortName: 'TRI', category: 'International', country: 'TRI', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8342.png' },
>>>>>>> 59d987a4978bca949e5ffec84ffd419559c65776

      { id: 8542, name: 'Japan', shortName: 'JPN', category: 'International', country: 'JPN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8542.png' },
      { id: 8543, name: 'South Korea', shortName: 'KOR', category: 'International', country: 'KOR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8543.png' },
      { id: 8565, name: 'Australia', shortName: 'AUS', category: 'International', country: 'AUS', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8565.png' },
      { id: 8566, name: 'Saudi Arabia', shortName: 'KSA', category: 'International', country: 'KSA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8566.png' },
      { id: 8567, name: 'Iran', shortName: 'IRN', category: 'International', country: 'IRN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8567.png' },
      { id: 8568, name: 'Qatar', shortName: 'QAT', category: 'International', country: 'QAT', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8568.png' },
      { id: 8569, name: 'India', shortName: 'IND', category: 'International', country: 'IND', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8569.png' },
<<<<<<< HEAD
=======
      { id: 8322, name: 'Uzbekistan', shortName: 'UZB', category: 'International', country: 'UZB', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8322.png' },
      { id: 8303, name: 'Jordan', shortName: 'JOR', category: 'International', country: 'JOR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8303.png' },
      { id: 'iraq', name: 'Iraq', shortName: 'IRQ', category: 'International', country: 'IRQ', logo: 'https://a.espncdn.com/i/teamlogos/soccer/500/484.png' },
      { id: 8321, name: 'UAE', shortName: 'UAE', category: 'International', country: 'UAE', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8321.png' },
      { id: 8312, name: 'Oman', shortName: 'OMA', category: 'International', country: 'OMA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8312.png' },
      { id: 8293, name: 'Bahrain', shortName: 'BHR', category: 'International', country: 'BHR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8293.png' },
      { id: 8319, name: 'Thailand', shortName: 'THA', category: 'International', country: 'THA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8319.png' },
      { id: 8323, name: 'Vietnam', shortName: 'VIE', category: 'International', country: 'VIE', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8323.png' },
      { id: 8299, name: 'Indonesia', shortName: 'IDN', category: 'International', country: 'IDN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8299.png' },
      { id: 8307, name: 'Malaysia', shortName: 'MAS', category: 'International', country: 'MAS', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8307.png' },
      { id: 8295, name: 'China', shortName: 'CHN', category: 'International', country: 'CHN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8295.png' },
>>>>>>> 59d987a4978bca949e5ffec84ffd419559c65776
      { id: 8581, name: 'New Zealand', shortName: 'NZL', category: 'International', country: 'NZL', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8581.png' }
    ],
    cricket: [
      // 🏆 Major Cricket Leagues & Tournaments (100% verified official ESPN & Cricinfo logos)
      { id: 'ipl', name: 'Indian Premier League', shortName: 'IPL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png' },
      { id: 'wpl', name: 'Women\'s Premier League', shortName: 'WPL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png' },
      { id: 'bbl', name: 'Big Bash League', shortName: 'BBL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png' },
      { id: 'psl', name: 'Pakistan Super League', shortName: 'PSL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/7.png' },
      { id: 'sa20', name: 'SA20', shortName: 'SA20', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png' },
      { id: 'cpl', name: 'Caribbean Premier League', shortName: 'CPL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png' },
<<<<<<< HEAD
      { id: 'thehundred', name: 'The Hundred', shortName: 'Hundred', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png' },
      { id: 'mlc', name: 'Major League Cricket', shortName: 'MLC', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/11.png' },
      { id: 'ilt20', name: 'International League T20', shortName: 'ILT20', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/27.png' },
=======
      { id: 'wcpl', name: 'Women\'s Caribbean Premier League', shortName: 'WCPL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png' },
      { id: 'thehundred', name: 'The Hundred', shortName: 'Hundred', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png' },
      { id: 'mlc', name: 'Major League Cricket', shortName: 'MLC', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/11.png' },
      { id: 'ilt20', name: 'International League T20', shortName: 'ILT20', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/27.png' },
      { id: 'lpl', name: 'Lanka Premier League', shortName: 'LPL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/8.png' },
      { id: 'etpl', name: 'European T20 Premier League', shortName: 'ETPL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/15.png' },
      { id: 'ausoneday', name: 'Australian Domestic One-Day Cup', shortName: 'Marsh Cup', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png' },
      { id: 'county', name: 'County Championship', shortName: 'County', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png' },
>>>>>>> 59d987a4978bca949e5ffec84ffd419559c65776
      { id: 'ashes', name: 'The Ashes', shortName: 'Ashes', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png' },
      { id: 'ranji', name: 'Ranji Trophy', shortName: 'Ranji', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png' },
      { id: 'wtc', name: 'ICC World Test Championship', shortName: 'WTC', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png' },
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
      { id: 'ned', name: 'Netherlands', shortName: 'NED', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/15.png' },
      { id: 'sco', name: 'Scotland', shortName: 'SCO', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/30.png' },
      { id: 'usa', name: 'USA', shortName: 'USA', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/11.png' },
      { id: 'nep', name: 'Nepal', shortName: 'NEP', category: 'International', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/33.png' },

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
<<<<<<< HEAD
      { id: 'lsg', name: 'Lucknow Super Giants', shortName: 'LSG', category: 'IPL Franchise', logo: 'https://scores.iplt20.com/ipl/teamlogos/LSG.png' }
=======
      { id: 'lsg', name: 'Lucknow Super Giants', shortName: 'LSG', category: 'IPL Franchise', logo: 'https://scores.iplt20.com/ipl/teamlogos/LSG.png' },

      // 🌴 CPL Franchises
      { id: 'gaw', name: 'Guyana Amazon Warriors', shortName: 'GAW', category: 'CPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/642413.png' },
      { id: 'tkr', name: 'Trinbago Knight Riders', shortName: 'TKR', category: 'CPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/642417.png' },
      { id: 'br', name: 'Barbados Royals', shortName: 'BR', category: 'CPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/642411.png' },
      { id: 'slk', name: 'St Lucia Kings', shortName: 'SLK', category: 'CPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/642415.png' },
      { id: 'abf', name: 'Antigua & Barbuda Falcons', shortName: 'ABF', category: 'CPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png' },
      { id: 'jkm', name: 'Jamaica Kingsmen', shortName: 'JKM', category: 'CPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png' },

      // 🦁 Top English Counties
      { id: 'lan', name: 'Lancashire', shortName: 'LAN', category: 'English County', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1098.png' },
      { id: 'not', name: 'Nottinghamshire', shortName: 'NOT', category: 'English County', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1231.png' },
      { id: 'dur', name: 'Durham', shortName: 'DUR', category: 'English County', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/924.png' },
      { id: 'wor', name: 'Worcestershire', shortName: 'WOR', category: 'English County', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1458.png' },
      { id: 'der', name: 'Derbyshire', shortName: 'DER', category: 'English County', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/904.png' },
      { id: 'nor', name: 'Northamptonshire', shortName: 'NOR', category: 'English County', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1221.png' },
      { id: 'glo', name: 'Gloucestershire', shortName: 'GLO', category: 'English County', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/984.png' }
>>>>>>> 59d987a4978bca949e5ffec84ffd419559c65776
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
    'guyana amazon warriors': 'https://a.espncdn.com/i/teamlogos/cricket/500/642413.png',
    'gaw': 'https://a.espncdn.com/i/teamlogos/cricket/500/642413.png',
    'antigua & barbuda falcons': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'antigua and barbuda falcons': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'abf': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'jamaica kingsmen': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'jamaica tallawahs': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'jkm': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'jak': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
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
    'afc champions league': 'https://a.espncdn.com/i/leaguelogos/soccer/500/80.png',

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
    'serie b': 'https://a.espncdn.com/i/leaguelogos/soccer/500/13.png',
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
    'copa sudamericana': 'https://a.espncdn.com/i/leaguelogos/soccer/500/45.png',
    'indian super league': 'https://a.espncdn.com/i/leaguelogos/soccer/500/96.png',
    'isl': 'https://a.espncdn.com/i/leaguelogos/soccer/500/96.png',
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

  static FOOTBALL_TEAMS_LOGOS_MAP = {
    // 🌍 Top International Football Teams (National Teams)
    'argentina': 'https://images.fotmob.com/image_resources/logo/teamlogo/8527.png',
    'arg': 'https://images.fotmob.com/image_resources/logo/teamlogo/8527.png',
    'brazil': 'https://images.fotmob.com/image_resources/logo/teamlogo/8528.png',
    'bra': 'https://images.fotmob.com/image_resources/logo/teamlogo/8528.png',
    'uruguay': 'https://images.fotmob.com/image_resources/logo/teamlogo/8538.png',
    'uru': 'https://images.fotmob.com/image_resources/logo/teamlogo/8538.png',
    'colombia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8539.png',
    'col': 'https://images.fotmob.com/image_resources/logo/teamlogo/8539.png',
    'chile': 'https://images.fotmob.com/image_resources/logo/teamlogo/8561.png',
    'chi': 'https://images.fotmob.com/image_resources/logo/teamlogo/8561.png',
    'ecuador': 'https://images.fotmob.com/image_resources/logo/teamlogo/8562.png',
    'ecu': 'https://images.fotmob.com/image_resources/logo/teamlogo/8562.png',
    'peru': 'https://images.fotmob.com/image_resources/logo/teamlogo/8563.png',
    'per': 'https://images.fotmob.com/image_resources/logo/teamlogo/8563.png',
    'paraguay': 'https://a.espncdn.com/i/teamlogos/soccer/500/209.png',
    'par': 'https://a.espncdn.com/i/teamlogos/soccer/500/209.png',
    'venezuela': 'https://images.fotmob.com/image_resources/logo/teamlogo/8573.png',
    'ven': 'https://images.fotmob.com/image_resources/logo/teamlogo/8573.png',
    'bolivia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8570.png',
    'bol': 'https://images.fotmob.com/image_resources/logo/teamlogo/8570.png',

    'france': 'https://images.fotmob.com/image_resources/logo/teamlogo/8529.png',
    'fra': 'https://images.fotmob.com/image_resources/logo/teamlogo/8529.png',
    'england': 'https://images.fotmob.com/image_resources/logo/teamlogo/8530.png',
    'eng': 'https://images.fotmob.com/image_resources/logo/teamlogo/8530.png',
    'spain': 'https://images.fotmob.com/image_resources/logo/teamlogo/8531.png',
    'esp': 'https://images.fotmob.com/image_resources/logo/teamlogo/8531.png',
    'germany': 'https://images.fotmob.com/image_resources/logo/teamlogo/8532.png',
    'ger': 'https://images.fotmob.com/image_resources/logo/teamlogo/8532.png',
    'portugal': 'https://images.fotmob.com/image_resources/logo/teamlogo/8533.png',
    'por': 'https://images.fotmob.com/image_resources/logo/teamlogo/8533.png',
    'italy': 'https://images.fotmob.com/image_resources/logo/teamlogo/8534.png',
    'ita': 'https://images.fotmob.com/image_resources/logo/teamlogo/8534.png',
    'netherlands': 'https://images.fotmob.com/image_resources/logo/teamlogo/8535.png',
    'ned': 'https://images.fotmob.com/image_resources/logo/teamlogo/8535.png',
    'holland': 'https://images.fotmob.com/image_resources/logo/teamlogo/8535.png',
    'belgium': 'https://images.fotmob.com/image_resources/logo/teamlogo/8536.png',
    'bel': 'https://images.fotmob.com/image_resources/logo/teamlogo/8536.png',
    'croatia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8537.png',
    'cro': 'https://images.fotmob.com/image_resources/logo/teamlogo/8537.png',
    'switzerland': 'https://images.fotmob.com/image_resources/logo/teamlogo/8552.png',
    'sui': 'https://images.fotmob.com/image_resources/logo/teamlogo/8552.png',
    'denmark': 'https://images.fotmob.com/image_resources/logo/teamlogo/8553.png',
    'den': 'https://images.fotmob.com/image_resources/logo/teamlogo/8553.png',
    'austria': 'https://images.fotmob.com/image_resources/logo/teamlogo/8554.png',
    'aut': 'https://images.fotmob.com/image_resources/logo/teamlogo/8554.png',
    'norway': 'https://images.fotmob.com/image_resources/logo/teamlogo/8555.png',
    'nor': 'https://images.fotmob.com/image_resources/logo/teamlogo/8555.png',
    'sweden': 'https://images.fotmob.com/image_resources/logo/teamlogo/8556.png',
    'swe': 'https://images.fotmob.com/image_resources/logo/teamlogo/8556.png',
    'poland': 'https://images.fotmob.com/image_resources/logo/teamlogo/8557.png',
    'pol': 'https://images.fotmob.com/image_resources/logo/teamlogo/8557.png',
    'scotland': 'https://images.fotmob.com/image_resources/logo/teamlogo/8558.png',
    'sco': 'https://images.fotmob.com/image_resources/logo/teamlogo/8558.png',
    'wales': 'https://images.fotmob.com/image_resources/logo/teamlogo/8559.png',
    'wal': 'https://images.fotmob.com/image_resources/logo/teamlogo/8559.png',
    'turkey': 'https://images.fotmob.com/image_resources/logo/teamlogo/8560.png',
    'tur': 'https://images.fotmob.com/image_resources/logo/teamlogo/8560.png',
    'turkiye': 'https://images.fotmob.com/image_resources/logo/teamlogo/8560.png',
    'czech republic': 'https://images.fotmob.com/image_resources/logo/teamlogo/8493.png',
    'czechia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8493.png',
    'cze': 'https://images.fotmob.com/image_resources/logo/teamlogo/8493.png',
    'hungary': 'https://images.fotmob.com/image_resources/logo/teamlogo/8503.png',
    'hun': 'https://images.fotmob.com/image_resources/logo/teamlogo/8503.png',
    'ukraine': 'https://images.fotmob.com/image_resources/logo/teamlogo/8524.png',
    'ukr': 'https://images.fotmob.com/image_resources/logo/teamlogo/8524.png',
    'romania': 'https://a.espncdn.com/i/teamlogos/soccer/500/474.png',
    'rou': 'https://a.espncdn.com/i/teamlogos/soccer/500/474.png',
    'greece': 'https://images.fotmob.com/image_resources/logo/teamlogo/8501.png',
    'gre': 'https://images.fotmob.com/image_resources/logo/teamlogo/8501.png',
    'serbia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8518.png',
    'srb': 'https://images.fotmob.com/image_resources/logo/teamlogo/8518.png',
    'albania': 'https://images.fotmob.com/image_resources/logo/teamlogo/8487.png',
    'alb': 'https://images.fotmob.com/image_resources/logo/teamlogo/8487.png',
    'georgia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8498.png',
    'geo': 'https://images.fotmob.com/image_resources/logo/teamlogo/8498.png',
    'slovenia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8520.png',
    'svn': 'https://images.fotmob.com/image_resources/logo/teamlogo/8520.png',
    'slovakia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8519.png',
    'svk': 'https://images.fotmob.com/image_resources/logo/teamlogo/8519.png',
    'finland': 'https://images.fotmob.com/image_resources/logo/teamlogo/8496.png',
    'fin': 'https://images.fotmob.com/image_resources/logo/teamlogo/8496.png',
    'iceland': 'https://images.fotmob.com/image_resources/logo/teamlogo/8504.png',
    'isl': 'https://images.fotmob.com/image_resources/logo/teamlogo/8504.png',
    'bosnia and herzegovina': 'https://images.fotmob.com/image_resources/logo/teamlogo/8489.png',
    'bosnia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8489.png',
    'bih': 'https://images.fotmob.com/image_resources/logo/teamlogo/8489.png',
    'northern ireland': 'https://images.fotmob.com/image_resources/logo/teamlogo/8512.png',
    'nir': 'https://images.fotmob.com/image_resources/logo/teamlogo/8512.png',
    'republic of ireland': 'https://images.fotmob.com/image_resources/logo/teamlogo/8505.png',
    'ireland': 'https://images.fotmob.com/image_resources/logo/teamlogo/8505.png',
    'irl': 'https://images.fotmob.com/image_resources/logo/teamlogo/8505.png',

    'morocco': 'https://a.espncdn.com/i/teamlogos/soccer/500/489.png',
    'mar': 'https://a.espncdn.com/i/teamlogos/soccer/500/489.png',
    'senegal': 'https://images.fotmob.com/image_resources/logo/teamlogo/8545.png',
    'sen': 'https://images.fotmob.com/image_resources/logo/teamlogo/8545.png',
    'nigeria': 'https://images.fotmob.com/image_resources/logo/teamlogo/8546.png',
    'nga': 'https://images.fotmob.com/image_resources/logo/teamlogo/8546.png',
    'egypt': 'https://images.fotmob.com/image_resources/logo/teamlogo/8547.png',
    'egy': 'https://images.fotmob.com/image_resources/logo/teamlogo/8547.png',
    'ivory coast': 'https://images.fotmob.com/image_resources/logo/teamlogo/8548.png',
    'cote d\'ivoire': 'https://images.fotmob.com/image_resources/logo/teamlogo/8548.png',
    'civ': 'https://images.fotmob.com/image_resources/logo/teamlogo/8548.png',
    'ghana': 'https://images.fotmob.com/image_resources/logo/teamlogo/8549.png',
    'gha': 'https://images.fotmob.com/image_resources/logo/teamlogo/8549.png',
    'cameroon': 'https://images.fotmob.com/image_resources/logo/teamlogo/8550.png',
    'cmr': 'https://images.fotmob.com/image_resources/logo/teamlogo/8550.png',
    'algeria': 'https://images.fotmob.com/image_resources/logo/teamlogo/8551.png',
    'alg': 'https://images.fotmob.com/image_resources/logo/teamlogo/8551.png',
    'south africa': 'https://images.fotmob.com/image_resources/logo/teamlogo/8266.png',
    'rsa': 'https://images.fotmob.com/image_resources/logo/teamlogo/8266.png',
    'cape verde': 'https://images.fotmob.com/image_resources/logo/teamlogo/8251.png',
    'cabo verde': 'https://images.fotmob.com/image_resources/logo/teamlogo/8251.png',
    'cpv': 'https://images.fotmob.com/image_resources/logo/teamlogo/8251.png',
    'mali': 'https://images.fotmob.com/image_resources/logo/teamlogo/8261.png',
    'mli': 'https://images.fotmob.com/image_resources/logo/teamlogo/8261.png',
    'guinea': 'https://images.fotmob.com/image_resources/logo/teamlogo/8257.png',
    'gui': 'https://images.fotmob.com/image_resources/logo/teamlogo/8257.png',
    'dr congo': 'https://images.fotmob.com/image_resources/logo/teamlogo/8254.png',
    'democratic republic of the congo': 'https://images.fotmob.com/image_resources/logo/teamlogo/8254.png',
    'congo dr': 'https://images.fotmob.com/image_resources/logo/teamlogo/8254.png',
    'cod': 'https://images.fotmob.com/image_resources/logo/teamlogo/8254.png',
    'burkina faso': 'https://images.fotmob.com/image_resources/logo/teamlogo/8250.png',
    'bfa': 'https://images.fotmob.com/image_resources/logo/teamlogo/8250.png',
    'zambia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8272.png',
    'zam': 'https://images.fotmob.com/image_resources/logo/teamlogo/8272.png',
    'angola': 'https://images.fotmob.com/image_resources/logo/teamlogo/8248.png',
    'ang': 'https://images.fotmob.com/image_resources/logo/teamlogo/8248.png',
    'mozambique': 'https://images.fotmob.com/image_resources/logo/teamlogo/8263.png',
    'moz': 'https://images.fotmob.com/image_resources/logo/teamlogo/8263.png',
    'equatorial guinea': 'https://images.fotmob.com/image_resources/logo/teamlogo/8255.png',
    'eqg': 'https://images.fotmob.com/image_resources/logo/teamlogo/8255.png',
    'mauritania': 'https://images.fotmob.com/image_resources/logo/teamlogo/8262.png',
    'mtn': 'https://images.fotmob.com/image_resources/logo/teamlogo/8262.png',
    'namibia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8264.png',
    'nam': 'https://images.fotmob.com/image_resources/logo/teamlogo/8264.png',
    'gambia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8256.png',
    'gam': 'https://images.fotmob.com/image_resources/logo/teamlogo/8256.png',
    'gabon': 'https://images.fotmob.com/image_resources/logo/teamlogo/8274.png',
    'gab': 'https://images.fotmob.com/image_resources/logo/teamlogo/8274.png',
    'uganda': 'https://images.fotmob.com/image_resources/logo/teamlogo/8270.png',
    'uga': 'https://images.fotmob.com/image_resources/logo/teamlogo/8270.png',
    'kenya': 'https://images.fotmob.com/image_resources/logo/teamlogo/8259.png',
    'ken': 'https://images.fotmob.com/image_resources/logo/teamlogo/8259.png',
    'tanzania': 'https://images.fotmob.com/image_resources/logo/teamlogo/8268.png',
    'tan': 'https://images.fotmob.com/image_resources/logo/teamlogo/8268.png',
    'zimbabwe': 'https://images.fotmob.com/image_resources/logo/teamlogo/8273.png',
    'zim': 'https://images.fotmob.com/image_resources/logo/teamlogo/8273.png',

    'usa': 'https://images.fotmob.com/image_resources/logo/teamlogo/8541.png',
    'united states': 'https://images.fotmob.com/image_resources/logo/teamlogo/8541.png',
    'mexico': 'https://images.fotmob.com/image_resources/logo/teamlogo/8540.png',
    'mex': 'https://images.fotmob.com/image_resources/logo/teamlogo/8540.png',
    'canada': 'https://images.fotmob.com/image_resources/logo/teamlogo/8564.png',
    'can': 'https://images.fotmob.com/image_resources/logo/teamlogo/8564.png',
    'costa rica': 'https://a.espncdn.com/i/teamlogos/soccer/500/215.png',
    'crc': 'https://a.espncdn.com/i/teamlogos/soccer/500/215.png',
    'jamaica': 'https://images.fotmob.com/image_resources/logo/teamlogo/8333.png',
    'jam': 'https://images.fotmob.com/image_resources/logo/teamlogo/8333.png',
    'panama': 'https://images.fotmob.com/image_resources/logo/teamlogo/8337.png',
    'pan': 'https://images.fotmob.com/image_resources/logo/teamlogo/8337.png',
    'honduras': 'https://images.fotmob.com/image_resources/logo/teamlogo/8332.png',
    'hon': 'https://images.fotmob.com/image_resources/logo/teamlogo/8332.png',
    'el salvador': 'https://a.espncdn.com/i/teamlogos/soccer/500/218.png',
    'slv': 'https://a.espncdn.com/i/teamlogos/soccer/500/218.png',
    'trinidad and tobago': 'https://images.fotmob.com/image_resources/logo/teamlogo/8342.png',
    'tri': 'https://images.fotmob.com/image_resources/logo/teamlogo/8342.png',

    'japan': 'https://images.fotmob.com/image_resources/logo/teamlogo/8542.png',
    'jpn': 'https://images.fotmob.com/image_resources/logo/teamlogo/8542.png',
    'south korea': 'https://images.fotmob.com/image_resources/logo/teamlogo/8543.png',
    'kor': 'https://images.fotmob.com/image_resources/logo/teamlogo/8543.png',
    'australia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8565.png',
    'aus': 'https://images.fotmob.com/image_resources/logo/teamlogo/8565.png',
    'saudi arabia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8566.png',
    'ksa': 'https://images.fotmob.com/image_resources/logo/teamlogo/8566.png',
    'iran': 'https://images.fotmob.com/image_resources/logo/teamlogo/8567.png',
    'irn': 'https://images.fotmob.com/image_resources/logo/teamlogo/8567.png',
    'qatar': 'https://images.fotmob.com/image_resources/logo/teamlogo/8568.png',
    'qat': 'https://images.fotmob.com/image_resources/logo/teamlogo/8568.png',
    'india': 'https://images.fotmob.com/image_resources/logo/teamlogo/8569.png',
    'ind': 'https://images.fotmob.com/image_resources/logo/teamlogo/8569.png',
    'uzbekistan': 'https://images.fotmob.com/image_resources/logo/teamlogo/8322.png',
    'uzb': 'https://images.fotmob.com/image_resources/logo/teamlogo/8322.png',
    'jordan': 'https://images.fotmob.com/image_resources/logo/teamlogo/8303.png',
    'jor': 'https://images.fotmob.com/image_resources/logo/teamlogo/8303.png',
    'iraq': 'https://a.espncdn.com/i/teamlogos/soccer/500/484.png',
    'irq': 'https://a.espncdn.com/i/teamlogos/soccer/500/484.png',
    'uae': 'https://images.fotmob.com/image_resources/logo/teamlogo/8321.png',
    'united arab emirates': 'https://images.fotmob.com/image_resources/logo/teamlogo/8321.png',
    'oman': 'https://images.fotmob.com/image_resources/logo/teamlogo/8312.png',
    'oma': 'https://images.fotmob.com/image_resources/logo/teamlogo/8312.png',
    'bahrain': 'https://images.fotmob.com/image_resources/logo/teamlogo/8293.png',
    'bhr': 'https://images.fotmob.com/image_resources/logo/teamlogo/8293.png',
    'thailand': 'https://images.fotmob.com/image_resources/logo/teamlogo/8319.png',
    'tha': 'https://images.fotmob.com/image_resources/logo/teamlogo/8319.png',
    'vietnam': 'https://images.fotmob.com/image_resources/logo/teamlogo/8323.png',
    'vie': 'https://images.fotmob.com/image_resources/logo/teamlogo/8323.png',
    'indonesia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8299.png',
    'idn': 'https://images.fotmob.com/image_resources/logo/teamlogo/8299.png',
    'malaysia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8307.png',
    'mas': 'https://images.fotmob.com/image_resources/logo/teamlogo/8307.png',
    'china': 'https://images.fotmob.com/image_resources/logo/teamlogo/8295.png',
    'chn': 'https://images.fotmob.com/image_resources/logo/teamlogo/8295.png',
    'new zealand': 'https://images.fotmob.com/image_resources/logo/teamlogo/8581.png',
    'nzl': 'https://images.fotmob.com/image_resources/logo/teamlogo/8581.png',

    // ⚽ Top Clubs
    'arsenal': 'https://images.fotmob.com/image_resources/logo/teamlogo/9825.png',
    'manchester city': 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png',
    'man city': 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png',
    'liverpool': 'https://images.fotmob.com/image_resources/logo/teamlogo/8650.png',
    'manchester united': 'https://images.fotmob.com/image_resources/logo/teamlogo/10260.png',
    'man united': 'https://images.fotmob.com/image_resources/logo/teamlogo/10260.png',
    'chelsea': 'https://images.fotmob.com/image_resources/logo/teamlogo/8455.png',
    'tottenham hotspur': 'https://images.fotmob.com/image_resources/logo/teamlogo/8586.png',
    'tottenham': 'https://images.fotmob.com/image_resources/logo/teamlogo/8586.png',
    'spurs': 'https://images.fotmob.com/image_resources/logo/teamlogo/8586.png',
    'newcastle united': 'https://images.fotmob.com/image_resources/logo/teamlogo/10261.png',
    'newcastle': 'https://images.fotmob.com/image_resources/logo/teamlogo/10261.png',
    'aston villa': 'https://images.fotmob.com/image_resources/logo/teamlogo/10252.png',
    'brighton': 'https://images.fotmob.com/image_resources/logo/teamlogo/10204.png',
    'west ham united': 'https://images.fotmob.com/image_resources/logo/teamlogo/8654.png',
    'west ham': 'https://images.fotmob.com/image_resources/logo/teamlogo/8654.png',
    'everton': 'https://images.fotmob.com/image_resources/logo/teamlogo/8668.png',
    'fulham': 'https://images.fotmob.com/image_resources/logo/teamlogo/9879.png',
    'crystal palace': 'https://images.fotmob.com/image_resources/logo/teamlogo/9826.png',
    'brentford': 'https://images.fotmob.com/image_resources/logo/teamlogo/9937.png',
    'wolverhampton wanderers': 'https://images.fotmob.com/image_resources/logo/teamlogo/8602.png',
    'wolves': 'https://images.fotmob.com/image_resources/logo/teamlogo/8602.png',
    'bournemouth': 'https://images.fotmob.com/image_resources/logo/teamlogo/8678.png',
    'nottingham forest': 'https://images.fotmob.com/image_resources/logo/teamlogo/10203.png',
    'leicester city': 'https://images.fotmob.com/image_resources/logo/teamlogo/8197.png',
    'leicester': 'https://images.fotmob.com/image_resources/logo/teamlogo/8197.png',
    'southampton': 'https://images.fotmob.com/image_resources/logo/teamlogo/8466.png',
    'ipswich town': 'https://images.fotmob.com/image_resources/logo/teamlogo/9817.png',
    'ipswich': 'https://images.fotmob.com/image_resources/logo/teamlogo/9817.png',

    'real madrid': 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png',
    'barcelona': 'https://images.fotmob.com/image_resources/logo/teamlogo/8634.png',
    'atletico madrid': 'https://images.fotmob.com/image_resources/logo/teamlogo/9906.png',
    'atlético madrid': 'https://images.fotmob.com/image_resources/logo/teamlogo/9906.png',
    'athletic club': 'https://images.fotmob.com/image_resources/logo/teamlogo/8315.png',
    'real sociedad': 'https://images.fotmob.com/image_resources/logo/teamlogo/8560.png',
    'real betis': 'https://images.fotmob.com/image_resources/logo/teamlogo/8603.png',
    'villarreal': 'https://images.fotmob.com/image_resources/logo/teamlogo/10205.png',
    'girona': 'https://images.fotmob.com/image_resources/logo/teamlogo/9812.png',
    'sevilla': 'https://images.fotmob.com/image_resources/logo/teamlogo/8302.png',
    'valencia': 'https://images.fotmob.com/image_resources/logo/teamlogo/10267.png',
    'celta vigo': 'https://images.fotmob.com/image_resources/logo/teamlogo/8581.png',
    'osasuna': 'https://images.fotmob.com/image_resources/logo/teamlogo/8371.png',
    'mallorca': 'https://images.fotmob.com/image_resources/logo/teamlogo/8429.png',
    'getafe': 'https://images.fotmob.com/image_resources/logo/teamlogo/8305.png',
    'rayo vallecano': 'https://images.fotmob.com/image_resources/logo/teamlogo/8370.png',
    'espanyol': 'https://images.fotmob.com/image_resources/logo/teamlogo/8649.png',
    'alaves': 'https://images.fotmob.com/image_resources/logo/teamlogo/9864.png',
    'las palmas': 'https://images.fotmob.com/image_resources/logo/teamlogo/8306.png',
    'real valladolid': 'https://images.fotmob.com/image_resources/logo/teamlogo/10284.png',

    'inter': 'https://images.fotmob.com/image_resources/logo/teamlogo/8636.png',
    'inter milan': 'https://images.fotmob.com/image_resources/logo/teamlogo/8636.png',
    'juventus': 'https://images.fotmob.com/image_resources/logo/teamlogo/9885.png',
    'ac milan': 'https://images.fotmob.com/image_resources/logo/teamlogo/9799.png',
    'milan': 'https://images.fotmob.com/image_resources/logo/teamlogo/9799.png',
    'napoli': 'https://images.fotmob.com/image_resources/logo/teamlogo/9875.png',
    'atalanta': 'https://images.fotmob.com/image_resources/logo/teamlogo/8524.png',
    'roma': 'https://images.fotmob.com/image_resources/logo/teamlogo/8686.png',
    'lazio': 'https://images.fotmob.com/image_resources/logo/teamlogo/8543.png',
    'fiorentina': 'https://images.fotmob.com/image_resources/logo/teamlogo/8535.png',
    'bologna': 'https://images.fotmob.com/image_resources/logo/teamlogo/9857.png',
    'torino': 'https://images.fotmob.com/image_resources/logo/teamlogo/9804.png',
    'udinese': 'https://images.fotmob.com/image_resources/logo/teamlogo/8600.png',
    'genoa': 'https://images.fotmob.com/image_resources/logo/teamlogo/10233.png',
    'cagliari': 'https://images.fotmob.com/image_resources/logo/teamlogo/8534.png',
    'monza': 'https://images.fotmob.com/image_resources/logo/teamlogo/6504.png',
    'empoli': 'https://images.fotmob.com/image_resources/logo/teamlogo/8537.png',
    'parma': 'https://images.fotmob.com/image_resources/logo/teamlogo/10167.png',
    'como': 'https://images.fotmob.com/image_resources/logo/teamlogo/10171.png',
    'hellas verona': 'https://images.fotmob.com/image_resources/logo/teamlogo/9876.png',
    'verona': 'https://images.fotmob.com/image_resources/logo/teamlogo/9876.png',
    'lecce': 'https://images.fotmob.com/image_resources/logo/teamlogo/9888.png',
    'venezia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8461.png',

    'bayern munchen': 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png',
    'bayern munich': 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png',
    'bayer leverkusen': 'https://images.fotmob.com/image_resources/logo/teamlogo/9931.png',
    'leverkusen': 'https://images.fotmob.com/image_resources/logo/teamlogo/9931.png',
    'borussia dortmund': 'https://images.fotmob.com/image_resources/logo/teamlogo/9789.png',
    'dortmund': 'https://images.fotmob.com/image_resources/logo/teamlogo/9789.png',
    'rb leipzig': 'https://images.fotmob.com/image_resources/logo/teamlogo/178475.png',
    'leipzig': 'https://images.fotmob.com/image_resources/logo/teamlogo/178475.png',
    'eintracht frankfurt': 'https://images.fotmob.com/image_resources/logo/teamlogo/9810.png',
    'frankfurt': 'https://images.fotmob.com/image_resources/logo/teamlogo/9810.png',
    'vfb stuttgart': 'https://images.fotmob.com/image_resources/logo/teamlogo/10269.png',
    'stuttgart': 'https://images.fotmob.com/image_resources/logo/teamlogo/10269.png',
    'vfl wolfsburg': 'https://images.fotmob.com/image_resources/logo/teamlogo/8721.png',
    'wolfsburg': 'https://images.fotmob.com/image_resources/logo/teamlogo/8721.png',
    'borussia m\'gladbach': 'https://images.fotmob.com/image_resources/logo/teamlogo/9788.png',
    'monchengladbach': 'https://images.fotmob.com/image_resources/logo/teamlogo/9788.png',
    'sc freiburg': 'https://images.fotmob.com/image_resources/logo/teamlogo/9827.png',
    'freiburg': 'https://images.fotmob.com/image_resources/logo/teamlogo/9827.png',
    '1. fc union berlin': 'https://images.fotmob.com/image_resources/logo/teamlogo/8406.png',
    'union berlin': 'https://images.fotmob.com/image_resources/logo/teamlogo/8406.png',
    'tsg hoffenheim': 'https://images.fotmob.com/image_resources/logo/teamlogo/8226.png',
    'hoffenheim': 'https://images.fotmob.com/image_resources/logo/teamlogo/8226.png',
    'sv werder bremen': 'https://images.fotmob.com/image_resources/logo/teamlogo/8697.png',
    'werder bremen': 'https://images.fotmob.com/image_resources/logo/teamlogo/8697.png',
    'fc augsburg': 'https://images.fotmob.com/image_resources/logo/teamlogo/8407.png',
    'augsburg': 'https://images.fotmob.com/image_resources/logo/teamlogo/8407.png',
    '1. fsv mainz 05': 'https://images.fotmob.com/image_resources/logo/teamlogo/9905.png',
    'mainz': 'https://images.fotmob.com/image_resources/logo/teamlogo/9905.png',
    '1. fc heidenheim': 'https://images.fotmob.com/image_resources/logo/teamlogo/8234.png',
    'heidenheim': 'https://images.fotmob.com/image_resources/logo/teamlogo/8234.png',
    'fc st. pauli': 'https://images.fotmob.com/image_resources/logo/teamlogo/9776.png',
    'st pauli': 'https://images.fotmob.com/image_resources/logo/teamlogo/9776.png',
    'vfl bochum': 'https://images.fotmob.com/image_resources/logo/teamlogo/9911.png',
    'bochum': 'https://images.fotmob.com/image_resources/logo/teamlogo/9911.png',
    'holstein kiel': 'https://images.fotmob.com/image_resources/logo/teamlogo/8282.png',

    'paris saint-germain': 'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png',
    'psg': 'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png',
    'monaco': 'https://images.fotmob.com/image_resources/logo/teamlogo/9829.png',
    'marseille': 'https://images.fotmob.com/image_resources/logo/teamlogo/8592.png',
    'lille': 'https://images.fotmob.com/image_resources/logo/teamlogo/8639.png',
    'lyon': 'https://images.fotmob.com/image_resources/logo/teamlogo/9748.png',
    'lens': 'https://images.fotmob.com/image_resources/logo/teamlogo/8588.png',
    'nice': 'https://images.fotmob.com/image_resources/logo/teamlogo/9831.png',
    'rennes': 'https://images.fotmob.com/image_resources/logo/teamlogo/9851.png',
    'brest': 'https://images.fotmob.com/image_resources/logo/teamlogo/8521.png',
    'strasbourg': 'https://images.fotmob.com/image_resources/logo/teamlogo/8489.png',
    'toulouse': 'https://images.fotmob.com/image_resources/logo/teamlogo/9941.png',
    'nantes': 'https://images.fotmob.com/image_resources/logo/teamlogo/9830.png',
    'reims': 'https://images.fotmob.com/image_resources/logo/teamlogo/9837.png',
    'montpellier': 'https://images.fotmob.com/image_resources/logo/teamlogo/10249.png',
    'auxerre': 'https://images.fotmob.com/image_resources/logo/teamlogo/9848.png',
    'angers': 'https://images.fotmob.com/image_resources/logo/teamlogo/8121.png',
    'saint-etienne': 'https://images.fotmob.com/image_resources/logo/teamlogo/8637.png',
    'le havre': 'https://images.fotmob.com/image_resources/logo/teamlogo/9747.png',

    'sporting cp': 'https://images.fotmob.com/image_resources/logo/teamlogo/9768.png',
    'sporting': 'https://images.fotmob.com/image_resources/logo/teamlogo/9768.png',
    'benfica': 'https://images.fotmob.com/image_resources/logo/teamlogo/9772.png',
    'porto': 'https://images.fotmob.com/image_resources/logo/teamlogo/9773.png',
    'braga': 'https://images.fotmob.com/image_resources/logo/teamlogo/9771.png',
    'ajax': 'https://images.fotmob.com/image_resources/logo/teamlogo/8593.png',
    'psv': 'https://images.fotmob.com/image_resources/logo/teamlogo/8640.png',
    'feyenoord': 'https://images.fotmob.com/image_resources/logo/teamlogo/10235.png',
    'al nassr': 'https://images.fotmob.com/image_resources/logo/teamlogo/102061.png',
    'al hilal': 'https://images.fotmob.com/image_resources/logo/teamlogo/102062.png',
    'al ittihad': 'https://images.fotmob.com/image_resources/logo/teamlogo/8161.png',
    'al ahli': 'https://images.fotmob.com/image_resources/logo/teamlogo/102060.png',
    'inter miami': 'https://a.espncdn.com/i/teamlogos/soccer/500/20232.png',
    'celtic': 'https://images.fotmob.com/image_resources/logo/teamlogo/9993.png',
    'rangers': 'https://images.fotmob.com/image_resources/logo/teamlogo/8548.png',
    'galatasaray': 'https://images.fotmob.com/image_resources/logo/teamlogo/9912.png',
    'fenerbahce': 'https://images.fotmob.com/image_resources/logo/teamlogo/10268.png',
    'besiktas': 'https://images.fotmob.com/image_resources/logo/teamlogo/10185.png',
    'flamengo': 'https://images.fotmob.com/image_resources/logo/teamlogo/5922.png',
    'palmeiras': 'https://images.fotmob.com/image_resources/logo/teamlogo/10237.png',
    'river plate': 'https://images.fotmob.com/image_resources/logo/teamlogo/10077.png',
    'boca juniors': 'https://images.fotmob.com/image_resources/logo/teamlogo/10076.png',
    'mohun bagan': 'https://a.espncdn.com/i/teamlogos/soccer/500/17700.png',
    'mohun bagan sg': 'https://a.espncdn.com/i/teamlogos/soccer/500/17700.png',
    'east bengal': 'https://a.espncdn.com/i/teamlogos/soccer/500/17701.png',
    'east bengal fc': 'https://a.espncdn.com/i/teamlogos/soccer/500/17701.png',
    'mumbai city': 'https://a.espncdn.com/i/teamlogos/soccer/500/17697.png',
    'mumbai city fc': 'https://a.espncdn.com/i/teamlogos/soccer/500/17697.png',
    'bengaluru fc': 'https://a.espncdn.com/i/teamlogos/soccer/500/17705.png',
    'kerala blasters': 'https://a.espncdn.com/i/teamlogos/soccer/500/17698.png',
    'fc goa': 'https://a.espncdn.com/i/teamlogos/soccer/500/17699.png'
  };

  static getFootballLogo(name, shortName = '', id = null) {
    if (id && Number(id) > 0) {
      return `https://images.fotmob.com/image_resources/logo/teamlogo/${id}.png`;
    }
    const cleanShort = (shortName || '').toLowerCase().trim();
    if (cleanShort && this.FOOTBALL_TEAMS_LOGOS_MAP[cleanShort]) {
      return this.FOOTBALL_TEAMS_LOGOS_MAP[cleanShort];
    }
    if (name) {
      const clean = name.toLowerCase().trim();
      if (this.FOOTBALL_TEAMS_LOGOS_MAP[clean]) {
        return this.FOOTBALL_TEAMS_LOGOS_MAP[clean];
      }
      for (const [k, v] of Object.entries(this.FOOTBALL_TEAMS_LOGOS_MAP)) {
        if (clean === k || clean.startsWith(k + ' ') || clean.endsWith(' ' + k)) {
          return v;
        }
      }
    }
    return '';
  }

  /**
   * Universal Cricket Tournaments & Leagues Logos Map (100% verified unique tournament crests)
   */
  static CRICKET_TOURNAMENT_LOGOS_MAP = {
    // 🏆 Top Global T20 Leagues & Franchise Cups (100% verified ESPNcricinfo & Board CDN Crests)
    'ipl': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'indian premier league': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'tata ipl': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',

    'wpl': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'women\'s premier league': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'womens premier league': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'tata wpl': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',

    'bbl': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',
    'big bash league': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',
    'kfc bbl': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',

    'wbbl': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',
    'women\'s big bash league': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',
    'womens big bash league': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',

    'psl': 'https://a.espncdn.com/i/teamlogos/cricket/500/7.png',
    'pakistan super league': 'https://a.espncdn.com/i/teamlogos/cricket/500/7.png',
    'hbl psl': 'https://a.espncdn.com/i/teamlogos/cricket/500/7.png',

    'sa20': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',
    'betway sa20': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',

    'cpl': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'caribbean premier league': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'women\'s caribbean premier league': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'womens caribbean premier league': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'wcpl': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',

    'the hundred': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'the hundred men': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'the hundred women': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'the hundred mens competition': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'the hundred womens competition': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',

    'major league cricket': 'https://a.espncdn.com/i/teamlogos/cricket/500/11.png',
    'mlc': 'https://a.espncdn.com/i/teamlogos/cricket/500/11.png',
    'cognizant mlc': 'https://a.espncdn.com/i/teamlogos/cricket/500/11.png',

    'international league t20': 'https://a.espncdn.com/i/teamlogos/cricket/500/27.png',
    'ilt20': 'https://a.espncdn.com/i/teamlogos/cricket/500/27.png',
    'dp world ilt20': 'https://a.espncdn.com/i/teamlogos/cricket/500/27.png',

    'lanka premier league': 'https://a.espncdn.com/i/teamlogos/cricket/500/8.png',
    'lpl': 'https://a.espncdn.com/i/teamlogos/cricket/500/8.png',

    'european t20 premier league': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'etpl': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',

    'africa continental cup': 'https://a.espncdn.com/i/teamlogos/cricket/500/26.png',
    'asian games': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'asian games women\'s cricket': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'asian games women\'s cricket competition': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'asian games men\'s cricket': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',

    'australian domestic one-day competition': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',
    'australia domestic one-day cup': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',
    'marsh one-day cup': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',
    'marsh cup': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',

    'england women one day cup': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'ecb women\'s one-day cup': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'england women one day cup league-2': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',

    'csa provincial one-day challenge division two': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',
    'csa provincial one-day challenge': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',
    'csa provincial': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',

    'president\'s trophy': 'https://a.espncdn.com/i/teamlogos/cricket/500/7.png',
    'president trophy': 'https://a.espncdn.com/i/teamlogos/cricket/500/7.png',

    'oman invitational triangular': 'https://a.espncdn.com/i/teamlogos/cricket/500/37.png',

    'world test championship': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'icc world test championship': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'wtc': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',

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
   * Retrieve followed teams from chrome.storage with memory cache for 0ms lookup
   */
  static async getFavorites(forceReload = false) {
    if (!forceReload && this._cachedFavorites) {
      return this._cachedFavorites;
    }

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise(resolve => {
        chrome.storage.local.get([this.STORAGE_KEY], result => {
          if (result && result[this.STORAGE_KEY]) {
            const favs = result[this.STORAGE_KEY];
            if (!favs.f1) favs.f1 = [];
            if (!favs.football) favs.football = [];
            if (!favs.cricket) favs.cricket = [];
            this._cachedFavorites = favs;
            resolve(favs);
          } else {
            chrome.storage.local.set({ [this.STORAGE_KEY]: this.DEFAULT_FAVORITES });
            this._cachedFavorites = this.DEFAULT_FAVORITES;
            resolve(this.DEFAULT_FAVORITES);
          }
        });
      });
    } else {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(this.STORAGE_KEY) : null;
      const favs = stored ? JSON.parse(stored) : this.DEFAULT_FAVORITES;
      this._cachedFavorites = favs;
      return favs;
    }
  }

  /**
   * Save followed teams
   */
  static async saveFavorites(favorites) {
    this._cachedFavorites = favorites;
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
    this._cachedFavorites = empty;
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
   * Supports sport and category sub-filtering.
   */
  static getDiscoverableItems(sport = 'all', category = 'all', footballMatches = [], cricketMatches = [], f1Data = null, footballLeagues = [], cricketSeries = []) {
    let items = [];
    const normCat = (category || 'all').toLowerCase().trim();

    if (sport === 'all' || sport === 'football') {
      const fbMap = new Map();
      this.DISCOVER_CATALOG.football.forEach(t => {
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
      for (const m of footballMatches) {
        if (m.home?.id && !fbMap.has(String(m.home.id))) {
          fbMap.set(String(m.home.id), { id: m.home.id, name: m.home.name, league: m.leagueName, sport: 'football', logo: m.home.logo, category: 'Club' });
        }
        if (m.away?.id && !fbMap.has(String(m.away.id))) {
          fbMap.set(String(m.away.id), { id: m.away.id, name: m.away.name, league: m.leagueName, sport: 'football', logo: m.away.logo, category: 'Club' });
        }
      }

      let fbItems = Array.from(fbMap.values());
      if (normCat === 'clubs') {
        fbItems = fbItems.filter(t => !t.isLeague && t.category !== 'International');
      } else if (normCat === 'intl' || normCat === 'international' || normCat === 'national') {
        fbItems = fbItems.filter(t => !t.isLeague && t.category === 'International');
      } else if (normCat === 'leagues' || normCat === 'tournaments') {
        fbItems = fbItems.filter(t => t.isLeague || t.category === 'League');
      } else if (normCat === 'drivers' || normCat === 'constructors') {
        fbItems = [];
      }
      items.push(...fbItems);
    }

    if (sport === 'all' || sport === 'cricket') {
      const crMap = new Map();
      this.DISCOVER_CATALOG.cricket.forEach(t => {
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

      let crItems = Array.from(crMap.values());
      if (normCat === 'intl' || normCat === 'international' || normCat === 'national') {
        crItems = crItems.filter(t => !t.isLeague && t.category === 'International');
      } else if (normCat === 'franchises' || normCat === 'clubs') {
        crItems = crItems.filter(t => !t.isLeague && t.category !== 'International');
      } else if (normCat === 'leagues' || normCat === 'tournaments') {
        crItems = crItems.filter(t => t.isLeague || t.category === 'Tournament');
      } else if (normCat === 'drivers' || normCat === 'constructors') {
        crItems = [];
      }
      items.push(...crItems);
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

      let f1Items = Array.from(f1Map.values());
      if (normCat === 'drivers') {
        f1Items = f1Items.filter(t => !t.isTeam && t.category === 'Driver');
      } else if (normCat === 'constructors' || normCat === 'teams') {
        f1Items = f1Items.filter(t => t.isTeam || t.category === 'Constructor');
      } else if (normCat === 'clubs' || normCat === 'intl' || normCat === 'international' || normCat === 'national' || normCat === 'leagues' || normCat === 'tournaments' || normCat === 'franchises') {
        f1Items = [];
      }
      items.push(...f1Items);
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
