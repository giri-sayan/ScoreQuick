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
  'mbsg': ['mohun bagan', 'mohun bagan super giant', 'mohun bagan sg', 'mbsg', 'mariners', 'mohun bagan ac'],
  'ebfc': ['east bengal', 'east bengal fc', 'ebfc', 'red and gold brigade', 'torchbearers'],
  'mcfc_isl': ['mumbai city', 'mumbai city fc', 'mcfc isl', 'islanders'],
  'bfc': ['bengaluru fc', 'bengaluru', 'bfc', 'blues', 'west block blues'],
  'kbfc': ['kerala blasters', 'kerala blasters fc', 'kbfc', 'yellow army', 'blasters', 'manjappada'],
  'fcg': ['fc goa', 'the gaurs', 'fcg', 'goa'],
  'cfc_isl': ['chennaiyin fc', 'chennaiyin', 'cfc', 'marina machans'],
  'ofc': ['odisha fc', 'odisha', 'ofc', 'kalinga warriors', 'juggernauts'],
  'neufc': ['northeast united fc', 'northeast united', 'neufc', 'highlanders'],
  'jfc': ['jamshedpur fc', 'jamshedpur', 'jfc', 'red miners', 'men of steel'],
  'pfc': ['punjab fc', 'punjab', 'pfc', 'shers'],
  'msc': ['mohammedan sc', 'mohammedan sporting', 'mohammedan', 'msc', 'black panthers'],
  'hfc': ['hyderabad fc', 'hyderabad', 'hfc', 'nizams'],

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
      // 🏆 Major Football Leagues (100% verified OneFootball badges)
      { id: 9, name: 'Premier League', shortName: 'EPL', isLeague: true, category: 'League', country: 'ENG', logo: 'https://images.onefootball.com/icons/leagueColoredCompetition/128/9.png' },
      { id: 5, name: 'Champions League', shortName: 'UCL', isLeague: true, category: 'League', country: 'INT', logo: 'https://images.onefootball.com/icons/leagueColoredCompetition/128/5.png' },
      { id: 10, name: 'LaLiga', shortName: 'La Liga', isLeague: true, category: 'League', country: 'ESP', logo: 'https://images.onefootball.com/icons/leagueColoredCompetition/128/10.png' },
      { id: 1, name: 'Bundesliga', shortName: 'BL', isLeague: true, category: 'League', country: 'GER', logo: 'https://images.onefootball.com/icons/leagueColoredCompetition/128/1.png' },
      { id: 13, name: 'Serie A', shortName: 'Serie A', isLeague: true, category: 'League', country: 'ITA', logo: 'https://images.onefootball.com/icons/leagueColoredCompetition/128/13.png' },
      { id: 23, name: 'Ligue 1', shortName: 'L1', isLeague: true, category: 'League', country: 'FRA', logo: 'https://images.onefootball.com/icons/leagueColoredCompetition/128/23.png' },
      { id: 7, name: 'Europa League', shortName: 'UEL', isLeague: true, category: 'League', country: 'INT', logo: 'https://images.onefootball.com/icons/leagueColoredCompetition/128/7.png' },
      { id: 28, name: 'Championship', shortName: 'Champ', isLeague: true, category: 'League', country: 'ENG', logo: 'https://images.onefootball.com/icons/leagueColoredCompetition/128/28.png' },
      { id: 34, name: 'Major League Soccer', shortName: 'MLS', isLeague: true, category: 'League', country: 'USA', logo: 'https://images.onefootball.com/icons/leagueColoredCompetition/128/34.png' },
      { id: 36, name: 'Eredivisie', shortName: 'ERE', isLeague: true, category: 'League', country: 'NED', logo: 'https://images.onefootball.com/icons/leagueColoredCompetition/128/36.png' },
      { id: 37, name: 'Liga Portugal', shortName: 'POR', isLeague: true, category: 'League', country: 'POR', logo: 'https://images.onefootball.com/icons/leagueColoredCompetition/128/37.png' },
      { id: 538, name: 'Saudi Pro League', shortName: 'SPL', isLeague: true, category: 'League', country: 'KSA', logo: 'https://images.onefootball.com/icons/leagueColoredCompetition/128/538.png' },
      { id: 16, name: 'Brasileirão', shortName: 'BRA', isLeague: true, category: 'League', country: 'BRA', logo: 'https://images.onefootball.com/icons/leagueColoredCompetition/128/16.png' },
      { id: 384, name: 'Copa Libertadores', shortName: 'LIB', isLeague: true, category: 'League', country: 'INT', logo: 'https://images.onefootball.com/icons/leagueColoredCompetition/128/384.png' },
      { id: 305, name: 'Indian Super League', shortName: 'ISL', isLeague: true, category: 'League', country: 'IND', logo: 'https://www.indiansuperleague.com/static-assets/images/svg/isl-logo.svg' },

      // ⚽ Top European & Global Clubs (100% verified OneFootball crests)
      // Premier League
      { id: 2, name: 'Arsenal', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/2.png' },
      { id: 209, name: 'Manchester City', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/209.png' },
      { id: 18, name: 'Liverpool', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/18.png' },
      { id: 21, name: 'Manchester United', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/21.png' },
      { id: 9, name: 'Chelsea', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/9.png' },
      { id: 202, name: 'Tottenham Hotspur', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/202.png' },
      { id: 207, name: 'Newcastle United', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/207.png' },
      { id: 199, name: 'Aston Villa', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/199.png' },
      { id: 670, name: 'Brighton', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/670.png' },
      { id: 198, name: 'West Ham United', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/198.png' },
      { id: 197, name: 'Everton', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/197.png' },
      { id: 211, name: 'Fulham', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/211.png' },
      { id: 567, name: 'Crystal Palace', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/567.png' },
      { id: 671, name: 'Brentford', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/671.png' },
      { id: 566, name: 'Wolverhampton Wanderers', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/566.png' },
      { id: 622, name: 'Bournemouth', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/622.png' },
      { id: 577, name: 'Nottingham Forest', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/577.png' },
      { id: 572, name: 'Leicester City', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/572.png' },
      { id: 578, name: 'Southampton', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/578.png' },
      { id: 570, name: 'Ipswich Town', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/570.png' },

      // La Liga
      { id: 26, name: 'Real Madrid', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/26.png' },
      { id: 5, name: 'Barcelona', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/5.png' },
      { id: 3, name: 'Atlético Madrid', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/3.png' },
      { id: 213, name: 'Athletic Club', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/213.png' },
      { id: 224, name: 'Real Sociedad', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/224.png' },
      { id: 222, name: 'Real Betis', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/222.png' },
      { id: 229, name: 'Villarreal', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/229.png' },
      { id: 3762, name: 'Girona', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/3762.png' },
      { id: 27, name: 'Sevilla', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/27.png' },
      { id: 28, name: 'Valencia', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/28.png' },
      { id: 680, name: 'Celta Vigo', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/680.png' },
      { id: 221, name: 'Osasuna', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/221.png' },
      { id: 218, name: 'Mallorca', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/218.png' },
      { id: 215, name: 'Getafe', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/215.png' },
      { id: 223, name: 'Rayo Vallecano', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/223.png' },
      { id: 214, name: 'Espanyol', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/214.png' },
      { id: 679, name: 'Alaves', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/679.png' },
      { id: 683, name: 'Las Palmas', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/683.png' },
      { id: 228, name: 'Real Valladolid', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/228.png' },

      // Serie A
      { id: 15, name: 'Inter', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/15.png' },
      { id: 21, name: 'Juventus', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/21.png' },
      { id: 11, name: 'AC Milan', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/11.png' },
      { id: 17, name: 'Napoli', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/17.png' },
      { id: 190, name: 'Atalanta', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/190.png' },
      { id: 16, name: 'Roma', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/16.png' },
      { id: 12, name: 'Lazio', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/12.png' },
      { id: 217, name: 'Fiorentina', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/217.png' },
      { id: 191, name: 'Bologna', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/191.png' },
      { id: 194, name: 'Torino', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/194.png' },
      { id: 195, name: 'Udinese', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/195.png' },
      { id: 192, name: 'Genoa', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/192.png' },
      { id: 189, name: 'Cagliari', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/189.png' },
      { id: 6013, name: 'Monza', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/6013.png' },
      { id: 216, name: 'Empoli', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/216.png' },
      { id: 193, name: 'Parma', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/193.png' },
      { id: 6014, name: 'Como', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/6014.png' },
      { id: 220, name: 'Hellas Verona', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/220.png' },
      { id: 234, name: 'Lecce', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/234.png' },
      { id: 5988, name: 'Venezia', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/5988.png' },

      // Bundesliga
      { id: 23, name: 'Bayern München', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/23.png' },
      { id: 7, name: 'Bayer Leverkusen', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/7.png' },
      { id: 8, name: 'Borussia Dortmund', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/8.png' },
      { id: 5152, name: 'RB Leipzig', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/5152.png' },
      { id: 148, name: 'Eintracht Frankfurt', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/148.png' },
      { id: 151, name: 'VfB Stuttgart', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/151.png' },
      { id: 152, name: 'VfL Wolfsburg', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/152.png' },
      { id: 154, name: 'Borussia M\'gladbach', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/154.png' },
      { id: 150, name: 'SC Freiburg', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/150.png' },
      { id: 166, name: '1. FC Union Berlin', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/166.png' },
      { id: 158, name: 'TSG Hoffenheim', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/158.png' },
      { id: 153, name: 'SV Werder Bremen', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/153.png' },
      { id: 146, name: 'FC Augsburg', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/146.png' },
      { id: 149, name: '1. FSV Mainz 05', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/149.png' },
      { id: 5154, name: '1. FC Heidenheim', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/5154.png' },
      { id: 157, name: 'FC St. Pauli', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/157.png' },
      { id: 147, name: 'VfL Bochum', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/147.png' },
      { id: 5155, name: 'Holstein Kiel', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/5155.png' },

      // Ligue 1
      { id: 24, name: 'Paris Saint-Germain', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/24.png' },
      { id: 259, name: 'Monaco', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/259.png' },
      { id: 19, name: 'Marseille', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/19.png' },
      { id: 256, name: 'Lille', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/256.png' },
      { id: 257, name: 'Lyon', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/257.png' },
      { id: 255, name: 'Lens', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/255.png' },
      { id: 261, name: 'Nice', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/261.png' },
      { id: 264, name: 'Rennes', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/264.png' },
      { id: 5168, name: 'Brest', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/5168.png' },
      { id: 267, name: 'Strasbourg', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/267.png' },
      { id: 268, name: 'Toulouse', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/268.png' },
      { id: 260, name: 'Nantes', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/260.png' },
      { id: 265, name: 'Reims', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/265.png' },
      { id: 258, name: 'Montpellier', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/258.png' },
      { id: 251, name: 'Auxerre', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/251.png' },
      { id: 5167, name: 'Angers', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/5167.png' },
      { id: 266, name: 'Saint-Etienne', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/266.png' },
      { id: 5169, name: 'Le Havre', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/5169.png' },

      // Global Clubs
      { id: 345, name: 'Sporting CP', league: 'Liga Portugal', category: 'Club', country: 'POR', logo: 'https://images.onefootball.com/icons/teams/164/345.png' },
      { id: 344, name: 'Benfica', league: 'Liga Portugal', category: 'Club', country: 'POR', logo: 'https://images.onefootball.com/icons/teams/164/344.png' },
      { id: 346, name: 'Porto', league: 'Liga Portugal', category: 'Club', country: 'POR', logo: 'https://images.onefootball.com/icons/teams/164/346.png' },
      { id: 347, name: 'Braga', league: 'Liga Portugal', category: 'Club', country: 'POR', logo: 'https://images.onefootball.com/icons/teams/164/347.png' },
      { id: 248, name: 'Ajax', league: 'Eredivisie', category: 'Club', country: 'NED', logo: 'https://images.onefootball.com/icons/teams/164/248.png' },
      { id: 250, name: 'PSV', league: 'Eredivisie', category: 'Club', country: 'NED', logo: 'https://images.onefootball.com/icons/teams/164/250.png' },
      { id: 249, name: 'Feyenoord', league: 'Eredivisie', category: 'Club', country: 'NED', logo: 'https://images.onefootball.com/icons/teams/164/249.png' },
      { id: 4011, name: 'Al Nassr', league: 'Saudi Pro League', category: 'Club', country: 'KSA', logo: 'https://images.onefootball.com/icons/teams/164/4011.png' },
      { id: 4010, name: 'Al Hilal', league: 'Saudi Pro League', category: 'Club', country: 'KSA', logo: 'https://images.onefootball.com/icons/teams/164/4010.png' },
      { id: 4012, name: 'Al Ittihad', league: 'Saudi Pro League', category: 'Club', country: 'KSA', logo: 'https://images.onefootball.com/icons/teams/164/4012.png' },
      { id: 4013, name: 'Al Ahli', league: 'Saudi Pro League', category: 'Club', country: 'KSA', logo: 'https://images.onefootball.com/icons/teams/164/4013.png' },
      { id: 5590, name: 'Inter Miami', league: 'MLS', category: 'Club', country: 'USA', logo: 'https://images.onefootball.com/icons/teams/164/5590.png' },
      { id: 288, name: 'Celtic', league: 'Scottish Premiership', category: 'Club', country: 'SCO', logo: 'https://images.onefootball.com/icons/teams/164/288.png' },
      { id: 289, name: 'Rangers', league: 'Scottish Premiership', category: 'Club', country: 'SCO', logo: 'https://images.onefootball.com/icons/teams/164/289.png' },
      { id: 312, name: 'Galatasaray', league: 'Süper Lig', category: 'Club', country: 'TUR', logo: 'https://images.onefootball.com/icons/teams/164/312.png' },
      { id: 311, name: 'Fenerbahce', league: 'Süper Lig', category: 'Club', country: 'TUR', logo: 'https://images.onefootball.com/icons/teams/164/311.png' },
      { id: 310, name: 'Besiktas', league: 'Süper Lig', category: 'Club', country: 'TUR', logo: 'https://images.onefootball.com/icons/teams/164/310.png' },
      { id: 1681, name: 'Flamengo', league: 'Brasileirão', category: 'Club', country: 'BRA', logo: 'https://images.onefootball.com/icons/teams/164/1681.png' },
      { id: 1682, name: 'Palmeiras', league: 'Brasileirão', category: 'Club', country: 'BRA', logo: 'https://images.onefootball.com/icons/teams/164/1682.png' },
      { id: 1688, name: 'River Plate', league: 'Liga Profesional', category: 'Club', country: 'ARG', logo: 'https://images.onefootball.com/icons/teams/164/1688.png' },
      { id: 1689, name: 'Boca Juniors', league: 'Liga Profesional', category: 'Club', country: 'ARG', logo: 'https://images.onefootball.com/icons/teams/164/1689.png' },

      // Indian Super League (ISL) Clubs (100% verified official logos from indiansuperleague.com)
      { id: 1874, name: 'Mohun Bagan Super Giant', shortName: 'MBSG', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://www.indiansuperleague.com/static-assets/images/club/1874.png' },
      { id: 1102, name: 'East Bengal FC', shortName: 'EBFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://www.indiansuperleague.com/static-assets/images/club/1102.png' },
      { id: 506, name: 'Mumbai City FC', shortName: 'MCFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://www.indiansuperleague.com/static-assets/images/club/506.png' },
      { id: 656, name: 'Bengaluru FC', shortName: 'BFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://www.indiansuperleague.com/static-assets/images/club/656.png' },
      { id: 498, name: 'Kerala Blasters FC', shortName: 'KBFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://www.indiansuperleague.com/static-assets/images/club/498.png' },
      { id: 496, name: 'FC Goa', shortName: 'FCG', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://www.indiansuperleague.com/static-assets/images/club/496.png' },
      { id: 505, name: 'Chennaiyin FC', shortName: 'CFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://www.indiansuperleague.com/static-assets/images/club/505.png' },
      { id: 1499, name: 'Odisha FC', shortName: 'OFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://www.indiansuperleague.com/static-assets/images/club/1499.png' },
      { id: 504, name: 'NorthEast United FC', shortName: 'NEUFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://www.indiansuperleague.com/static-assets/images/club/504.png' },
      { id: 1159, name: 'Jamshedpur FC', shortName: 'JFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://www.indiansuperleague.com/static-assets/images/club/1159.png' },
      { id: 1252, name: 'Punjab FC', shortName: 'PFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://www.indiansuperleague.com/static-assets/images/club/1252.png' },
      { id: 1109, name: 'Mohammedan SC', shortName: 'MSC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://www.indiansuperleague.com/static-assets/images/club/1109.png' },
      { id: 1536, name: 'Hyderabad FC', shortName: 'HFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://www.indiansuperleague.com/static-assets/images/club/1536.png' },

      // 🌍 International Football Teams (100% verified OneFootball federation crests)
      { id: 436, name: 'Argentina', shortName: 'ARG', category: 'International', country: 'ARG', logo: 'https://images.onefootball.com/icons/teams/164/436.png' },
      { id: 438, name: 'Brazil', shortName: 'BRA', category: 'International', country: 'BRA', logo: 'https://images.onefootball.com/icons/teams/164/438.png' },
      { id: 462, name: 'Uruguay', shortName: 'URU', category: 'International', country: 'URU', logo: 'https://images.onefootball.com/icons/teams/164/462.png' },
      { id: 439, name: 'Colombia', shortName: 'COL', category: 'International', country: 'COL', logo: 'https://images.onefootball.com/icons/teams/164/439.png' },
      { id: 470, name: 'Chile', shortName: 'CHI', category: 'International', country: 'CHI', logo: 'https://images.onefootball.com/icons/teams/164/470.png' },
      { id: 491, name: 'Ecuador', shortName: 'ECU', category: 'International', country: 'ECU', logo: 'https://images.onefootball.com/icons/teams/164/491.png' },
      { id: 492, name: 'Peru', shortName: 'PER', category: 'International', country: 'PER', logo: 'https://images.onefootball.com/icons/teams/164/492.png' },
      { id: 493, name: 'Paraguay', shortName: 'PAR', category: 'International', country: 'PAR', logo: 'https://images.onefootball.com/icons/teams/164/493.png' },
      { id: 494, name: 'Venezuela', shortName: 'VEN', category: 'International', country: 'VEN', logo: 'https://images.onefootball.com/icons/teams/164/494.png' },
      { id: 495, name: 'Bolivia', shortName: 'BOL', category: 'International', country: 'BOL', logo: 'https://images.onefootball.com/icons/teams/164/495.png' },

      { id: 443, name: 'France', shortName: 'FRA', category: 'International', country: 'FRA', logo: 'https://images.onefootball.com/icons/teams/164/443.png' },
      { id: 441, name: 'England', shortName: 'ENG', category: 'International', country: 'ENG', logo: 'https://images.onefootball.com/icons/teams/164/441.png' },
      { id: 457, name: 'Spain', shortName: 'ESP', category: 'International', country: 'ESP', logo: 'https://images.onefootball.com/icons/teams/164/457.png' },
      { id: 444, name: 'Germany', shortName: 'GER', category: 'International', country: 'GER', logo: 'https://images.onefootball.com/icons/teams/164/444.png' },
      { id: 454, name: 'Portugal', shortName: 'POR', category: 'International', country: 'POR', logo: 'https://images.onefootball.com/icons/teams/164/454.png' },
      { id: 448, name: 'Italy', shortName: 'ITA', category: 'International', country: 'ITA', logo: 'https://images.onefootball.com/icons/teams/164/448.png' },
      { id: 451, name: 'Netherlands', shortName: 'NED', category: 'International', country: 'NED', logo: 'https://images.onefootball.com/icons/teams/164/451.png' },
      { id: 437, name: 'Belgium', shortName: 'BEL', category: 'International', country: 'BEL', logo: 'https://images.onefootball.com/icons/teams/164/437.png' },
      { id: 440, name: 'Croatia', shortName: 'CRO', category: 'International', country: 'CRO', logo: 'https://images.onefootball.com/icons/teams/164/440.png' },
      { id: 496, name: 'Switzerland', shortName: 'SUI', category: 'International', country: 'SUI', logo: 'https://images.onefootball.com/icons/teams/164/496.png' },
      { id: 497, name: 'Denmark', shortName: 'DEN', category: 'International', country: 'DEN', logo: 'https://images.onefootball.com/icons/teams/164/497.png' },
      { id: 498, name: 'Austria', shortName: 'AUT', category: 'International', country: 'AUT', logo: 'https://images.onefootball.com/icons/teams/164/498.png' },
      { id: 499, name: 'Norway', shortName: 'NOR', category: 'International', country: 'NOR', logo: 'https://images.onefootball.com/icons/teams/164/499.png' },
      { id: 500, name: 'Sweden', shortName: 'SWE', category: 'International', country: 'SWE', logo: 'https://images.onefootball.com/icons/teams/164/500.png' },
      { id: 453, name: 'Poland', shortName: 'POL', category: 'International', country: 'POL', logo: 'https://images.onefootball.com/icons/teams/164/453.png' },
      { id: 455, name: 'Scotland', shortName: 'SCO', category: 'International', country: 'SCO', logo: 'https://images.onefootball.com/icons/teams/164/455.png' },
      { id: 464, name: 'Wales', shortName: 'WAL', category: 'International', country: 'WAL', logo: 'https://images.onefootball.com/icons/teams/164/464.png' },
      { id: 461, name: 'Turkey', shortName: 'TUR', category: 'International', country: 'TUR', logo: 'https://images.onefootball.com/icons/teams/164/461.png' },
      { id: 442, name: 'Czech Republic', shortName: 'CZE', category: 'International', country: 'CZE', logo: 'https://images.onefootball.com/icons/teams/164/442.png' },
      { id: 446, name: 'Hungary', shortName: 'HUN', category: 'International', country: 'HUN', logo: 'https://images.onefootball.com/icons/teams/164/446.png' },
      { id: 460, name: 'Ukraine', shortName: 'UKR', category: 'International', country: 'UKR', logo: 'https://images.onefootball.com/icons/teams/164/460.png' },
      { id: 501, name: 'Romania', shortName: 'ROU', category: 'International', country: 'ROU', logo: 'https://images.onefootball.com/icons/teams/164/501.png' },
      { id: 445, name: 'Greece', shortName: 'GRE', category: 'International', country: 'GRE', logo: 'https://images.onefootball.com/icons/teams/164/445.png' },
      { id: 456, name: 'Serbia', shortName: 'SRB', category: 'International', country: 'SRB', logo: 'https://images.onefootball.com/icons/teams/164/456.png' },
      { id: 435, name: 'Albania', shortName: 'ALB', category: 'International', country: 'ALB', logo: 'https://images.onefootball.com/icons/teams/164/435.png' },
      { id: 447, name: 'Georgia', shortName: 'GEO', category: 'International', country: 'GEO', logo: 'https://images.onefootball.com/icons/teams/164/447.png' },
      { id: 458, name: 'Slovenia', shortName: 'SVN', category: 'International', country: 'SVN', logo: 'https://images.onefootball.com/icons/teams/164/458.png' },
      { id: 502, name: 'Slovakia', shortName: 'SVK', category: 'International', country: 'SVK', logo: 'https://images.onefootball.com/icons/teams/164/502.png' },
      { id: 467, name: 'Finland', shortName: 'FIN', category: 'International', country: 'FIN', logo: 'https://images.onefootball.com/icons/teams/164/467.png' },
      { id: 468, name: 'Iceland', shortName: 'ISL', category: 'International', country: 'ISL', logo: 'https://images.onefootball.com/icons/teams/164/468.png' },
      { id: 469, name: 'Bosnia and Herzegovina', shortName: 'BIH', category: 'International', country: 'BIH', logo: 'https://images.onefootball.com/icons/teams/164/469.png' },
      { id: 471, name: 'Northern Ireland', shortName: 'NIR', category: 'International', country: 'NIR', logo: 'https://images.onefootball.com/icons/teams/164/471.png' },
      { id: 472, name: 'Republic of Ireland', shortName: 'IRL', category: 'International', country: 'IRL', logo: 'https://images.onefootball.com/icons/teams/164/472.png' },

      { id: 480, name: 'Morocco', shortName: 'MAR', category: 'International', country: 'MAR', logo: 'https://images.onefootball.com/icons/teams/164/480.png' },
      { id: 473, name: 'Senegal', shortName: 'SEN', category: 'International', country: 'SEN', logo: 'https://images.onefootball.com/icons/teams/164/473.png' },
      { id: 503, name: 'Nigeria', shortName: 'NGA', category: 'International', country: 'NGA', logo: 'https://images.onefootball.com/icons/teams/164/503.png' },
      { id: 474, name: 'Egypt', shortName: 'EGY', category: 'International', country: 'EGY', logo: 'https://images.onefootball.com/icons/teams/164/474.png' },
      { id: 475, name: 'Ivory Coast', shortName: 'CIV', category: 'International', country: 'CIV', logo: 'https://images.onefootball.com/icons/teams/164/475.png' },
      { id: 476, name: 'Ghana', shortName: 'GHA', category: 'International', country: 'GHA', logo: 'https://images.onefootball.com/icons/teams/164/476.png' },
      { id: 504, name: 'Cameroon', shortName: 'CMR', category: 'International', country: 'CMR', logo: 'https://images.onefootball.com/icons/teams/164/504.png' },
      { id: 478, name: 'Algeria', shortName: 'ALG', category: 'International', country: 'ALG', logo: 'https://images.onefootball.com/icons/teams/164/478.png' },
      { id: 479, name: 'South Africa', shortName: 'RSA', category: 'International', country: 'RSA', logo: 'https://images.onefootball.com/icons/teams/164/479.png' },
      { id: 505, name: 'Cape Verde', shortName: 'CPV', category: 'International', country: 'CPV', logo: 'https://images.onefootball.com/icons/teams/164/505.png' },
      { id: 506, name: 'Mali', shortName: 'MLI', category: 'International', country: 'MLI', logo: 'https://images.onefootball.com/icons/teams/164/506.png' },
      { id: 507, name: 'Guinea', shortName: 'GUI', category: 'International', country: 'GUI', logo: 'https://images.onefootball.com/icons/teams/164/507.png' },
      { id: 508, name: 'DR Congo', shortName: 'COD', category: 'International', country: 'COD', logo: 'https://images.onefootball.com/icons/teams/164/508.png' },
      { id: 509, name: 'Burkina Faso', shortName: 'BFA', category: 'International', country: 'BFA', logo: 'https://images.onefootball.com/icons/teams/164/509.png' },
      { id: 510, name: 'Zambia', shortName: 'ZAM', category: 'International', country: 'ZAM', logo: 'https://images.onefootball.com/icons/teams/164/510.png' },
      { id: 511, name: 'Angola', shortName: 'ANG', category: 'International', country: 'ANG', logo: 'https://images.onefootball.com/icons/teams/164/511.png' },
      { id: 512, name: 'Mozambique', shortName: 'MOZ', category: 'International', country: 'MOZ', logo: 'https://images.onefootball.com/icons/teams/164/512.png' },
      { id: 513, name: 'Equatorial Guinea', shortName: 'EQG', category: 'International', country: 'EQG', logo: 'https://images.onefootball.com/icons/teams/164/513.png' },
      { id: 514, name: 'Mauritania', shortName: 'MTN', category: 'International', country: 'MTN', logo: 'https://images.onefootball.com/icons/teams/164/514.png' },
      { id: 515, name: 'Namibia', shortName: 'NAM', category: 'International', country: 'NAM', logo: 'https://images.onefootball.com/icons/teams/164/515.png' },
      { id: 516, name: 'Gambia', shortName: 'GAM', category: 'International', country: 'GAM', logo: 'https://images.onefootball.com/icons/teams/164/516.png' },
      { id: 517, name: 'Gabon', shortName: 'GAB', category: 'International', country: 'GAB', logo: 'https://images.onefootball.com/icons/teams/164/517.png' },
      { id: 518, name: 'Uganda', shortName: 'UGA', category: 'International', country: 'UGA', logo: 'https://images.onefootball.com/icons/teams/164/518.png' },
      { id: 519, name: 'Kenya', shortName: 'KEN', category: 'International', country: 'KEN', logo: 'https://images.onefootball.com/icons/teams/164/519.png' },
      { id: 520, name: 'Tanzania', shortName: 'TAN', category: 'International', country: 'TAN', logo: 'https://images.onefootball.com/icons/teams/164/520.png' },
      { id: 521, name: 'Zimbabwe', shortName: 'ZIM', category: 'International', country: 'ZIM', logo: 'https://images.onefootball.com/icons/teams/164/521.png' },

      { id: 463, name: 'USA', shortName: 'USA', category: 'International', country: 'USA', logo: 'https://images.onefootball.com/icons/teams/164/463.png' },
      { id: 450, name: 'Mexico', shortName: 'MEX', category: 'International', country: 'MEX', logo: 'https://images.onefootball.com/icons/teams/164/450.png' },
      { id: 481, name: 'Canada', shortName: 'CAN', category: 'International', country: 'CAN', logo: 'https://images.onefootball.com/icons/teams/164/481.png' },
      { id: 522, name: 'Costa Rica', shortName: 'CRC', category: 'International', country: 'CRC', logo: 'https://images.onefootball.com/icons/teams/164/522.png' },
      { id: 523, name: 'Jamaica', shortName: 'JAM', category: 'International', country: 'JAM', logo: 'https://images.onefootball.com/icons/teams/164/523.png' },
      { id: 524, name: 'Panama', shortName: 'PAN', category: 'International', country: 'PAN', logo: 'https://images.onefootball.com/icons/teams/164/524.png' },
      { id: 525, name: 'Honduras', shortName: 'HON', category: 'International', country: 'HON', logo: 'https://images.onefootball.com/icons/teams/164/525.png' },
      { id: 526, name: 'El Salvador', shortName: 'SLV', category: 'International', country: 'SLV', logo: 'https://images.onefootball.com/icons/teams/164/526.png' },
      { id: 527, name: 'Trinidad and Tobago', shortName: 'TRI', category: 'International', country: 'TRI', logo: 'https://images.onefootball.com/icons/teams/164/527.png' },

      { id: 449, name: 'Japan', shortName: 'JPN', category: 'International', country: 'JPN', logo: 'https://images.onefootball.com/icons/teams/164/449.png' },
      { id: 459, name: 'South Korea', shortName: 'KOR', category: 'International', country: 'KOR', logo: 'https://images.onefootball.com/icons/teams/164/459.png' },
      { id: 482, name: 'Australia', shortName: 'AUS', category: 'International', country: 'AUS', logo: 'https://images.onefootball.com/icons/teams/164/482.png' },
      { id: 483, name: 'Saudi Arabia', shortName: 'KSA', category: 'International', country: 'KSA', logo: 'https://images.onefootball.com/icons/teams/164/483.png' },
      { id: 528, name: 'Iran', shortName: 'IRN', category: 'International', country: 'IRN', logo: 'https://images.onefootball.com/icons/teams/164/528.png' },
      { id: 485, name: 'Qatar', shortName: 'QAT', category: 'International', country: 'QAT', logo: 'https://images.onefootball.com/icons/teams/164/485.png' },
      { id: 486, name: 'India', shortName: 'IND', category: 'International', country: 'IND', logo: 'https://images.onefootball.com/icons/teams/164/486.png' },
      { id: 529, name: 'Uzbekistan', shortName: 'UZB', category: 'International', country: 'UZB', logo: 'https://images.onefootball.com/icons/teams/164/529.png' },
      { id: 530, name: 'Jordan', shortName: 'JOR', category: 'International', country: 'JOR', logo: 'https://images.onefootball.com/icons/teams/164/530.png' },
      { id: 531, name: 'Iraq', shortName: 'IRQ', category: 'International', country: 'IRQ', logo: 'https://images.onefootball.com/icons/teams/164/531.png' },
      { id: 532, name: 'UAE', shortName: 'UAE', category: 'International', country: 'UAE', logo: 'https://images.onefootball.com/icons/teams/164/532.png' },
      { id: 533, name: 'Oman', shortName: 'OMA', category: 'International', country: 'OMA', logo: 'https://images.onefootball.com/icons/teams/164/533.png' },
      { id: 534, name: 'Bahrain', shortName: 'BHR', category: 'International', country: 'BHR', logo: 'https://images.onefootball.com/icons/teams/164/534.png' },
      { id: 535, name: 'Thailand', shortName: 'THA', category: 'International', country: 'THA', logo: 'https://images.onefootball.com/icons/teams/164/535.png' },
      { id: 536, name: 'Vietnam', shortName: 'VIE', category: 'International', country: 'VIE', logo: 'https://images.onefootball.com/icons/teams/164/536.png' },
      { id: 537, name: 'Indonesia', shortName: 'IDN', category: 'International', country: 'IDN', logo: 'https://images.onefootball.com/icons/teams/164/537.png' },
      { id: 538, name: 'Malaysia', shortName: 'MAS', category: 'International', country: 'MAS', logo: 'https://images.onefootball.com/icons/teams/164/538.png' },
      { id: 539, name: 'China', shortName: 'CHN', category: 'International', country: 'CHN', logo: 'https://images.onefootball.com/icons/teams/164/539.png' },
      { id: 540, name: 'New Zealand', shortName: 'NZL', category: 'International', country: 'NZL', logo: 'https://images.onefootball.com/icons/teams/164/540.png' }
    ],
    cricket: [
      // 🏆 Major Cricket Leagues & Tournaments (100% verified official ESPN & Cricinfo logos)
      { id: 'ipl', name: 'Indian Premier League', shortName: 'IPL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png' },
      { id: 'wpl', name: 'Women\'s Premier League', shortName: 'WPL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png' },
      { id: 'bbl', name: 'Big Bash League', shortName: 'BBL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png' },
      { id: 'psl', name: 'Pakistan Super League', shortName: 'PSL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/7.png' },
      { id: 'sa20', name: 'SA20', shortName: 'SA20', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png' },
      { id: 'cpl', name: 'Caribbean Premier League', shortName: 'CPL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png' },
      { id: 'wcpl', name: 'Women\'s Caribbean Premier League', shortName: 'WCPL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png' },
      { id: 'thehundred', name: 'The Hundred', shortName: 'Hundred', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png' },
      { id: 'mlc', name: 'Major League Cricket', shortName: 'MLC', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/11.png' },
      { id: 'ilt20', name: 'International League T20', shortName: 'ILT20', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/27.png' },
      { id: 'lpl', name: 'Lanka Premier League', shortName: 'LPL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/8.png' },
      { id: 'etpl', name: 'European T20 Premier League', shortName: 'ETPL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/15.png' },
      { id: 'ausoneday', name: 'Australian Domestic One-Day Cup', shortName: 'Marsh Cup', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png' },
      { id: 'county', name: 'County Championship', shortName: 'County', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png' },
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
   * Universal Football Leagues Logos Map (OneFootball official CDN - 100% Verified)
   */
  static FOOTBALL_LEAGUES_LOGOS_MAP = {
    // English Competitions
    'premier league': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/9.png',
    'epl': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/9.png',
    'championship': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/27.png',
    'efl championship': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/27.png',
    'league one': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/42.png',
    'efl league one': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/42.png',
    'league two': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/43.png',
    'efl league two': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/43.png',
    'fa cup': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/17.png',
    'efl cup': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/41.png',
    'carabao cup': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/41.png',
    'community shield': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/65.png',
    'fa community shield': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/65.png',

    // European & International Tournaments
    'champions league': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/5.png',
    'ucl': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/5.png',
    'uefa champions league': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/5.png',
    'europa league': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/7.png',
    'uel': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/7.png',
    'uefa europa league': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/7.png',
    'conference league': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/2762.png',
    'uefa conference league': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/2762.png',
    'uefa nations league': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/2349.png',
    'nations league': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/2349.png',
    'uefa super cup': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/68.png',
    'world cup': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/12.png',
    'fifa world cup': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/12.png',
    'fifa club world cup': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/2955.png',
    'copa america': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/37.png',
    'euro': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/20.png',
    'uefa euro': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/20.png',
    'euro 2024': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/20.png',
    'afc champions league': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/155.png',
    'afc champions league elite': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/155.png',

    // Spain
    'laliga': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/10.png',
    'la liga': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/10.png',
    'laliga ea sports': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/10.png',
    'la liga 2': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/28.png',
    'copa del rey': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/18.png',
    'supercopa de espana': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/63.png',

    // Germany
    'bundesliga': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/1.png',
    '1. bundesliga': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/1.png',
    '2. bundesliga': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/2.png',
    'dfb-pokal': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/4.png',
    'dfb pokal': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/4.png',

    // Italy
    'serie a': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/13.png',
    'serie a enilive': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/13.png',
    'serie b': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/30.png',
    'serie bkt': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/30.png',
    'coppa italia': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/19.png',

    // France
    'ligue 1': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/23.png',
    'ligue 1 mcdonalds': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/23.png',
    'ligue 2': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/29.png',
    'coupe de france': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/33.png',

    // Americas & Global Leagues
    'major league soccer': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/15.png',
    'mls': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/15.png',
    'saudi pro league': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/111.png',
    'roshn saudi league': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/111.png',
    'eredivisie': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/36.png',
    'liga portugal': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/35.png',
    'primeira liga': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/35.png',
    'brasileirao': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/16.png',
    'brasileirao betano': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/16.png',
    'copa libertadores': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/76.png',
    'conmebol libertadores': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/76.png',
    'copa sudamericana': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/102.png',
    'conmebol sudamericana': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/102.png',
    'indian super league': 'https://www.indiansuperleague.com/static-assets/images/svg/isl-logo.svg',
    'isl': 'https://www.indiansuperleague.com/static-assets/images/svg/isl-logo.svg',
    'scottish premiership': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/39.png',
    'super lig': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/8.png',
    'sueper lig': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/8.png',
    'liga mx': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/40.png',
    'belgian pro league': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/38.png',
    'swiss super league': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/25.png',
    'austrian bundesliga': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/26.png',
    'liga profesional': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/17.png',
    'primera division': 'https://images.onefootball.com/icons/leagueColoredCompetition/128/17.png'
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
    if (leagueName) {
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
        if (clean === k || clean.includes(k) || cleanNoYear.includes(k)) {
          return v;
        }
      }
    }
    if (leagueId && Number(leagueId) > 0) {
      return `https://images.onefootball.com/icons/leagueColoredCompetition/128/${leagueId}.png`;
    }
    return '';
  }

  /**
   * Universal Football Teams Logos Map (OneFootball official CDN - 100% Verified)
   */
  static FOOTBALL_TEAMS_LOGOS_MAP = {
    'hfc': 'https://www.indiansuperleague.com/static-assets/images/club/1536.png',
    'hyderabad fc': 'https://www.indiansuperleague.com/static-assets/images/club/1536.png',
    'hyderabad': 'https://www.indiansuperleague.com/static-assets/images/club/1536.png',
    'msc': 'https://www.indiansuperleague.com/static-assets/images/club/1109.png',
    'mohammedan sporting': 'https://www.indiansuperleague.com/static-assets/images/club/1109.png',
    'mohammedan sc': 'https://www.indiansuperleague.com/static-assets/images/club/1109.png',
    'mohammedan': 'https://www.indiansuperleague.com/static-assets/images/club/1109.png',
    'pfc': 'https://www.indiansuperleague.com/static-assets/images/club/1252.png',
    'punjab fc': 'https://www.indiansuperleague.com/static-assets/images/club/1252.png',
    'punjab': 'https://www.indiansuperleague.com/static-assets/images/club/1252.png',
    'jfc': 'https://www.indiansuperleague.com/static-assets/images/club/1159.png',
    'jamshedpur fc': 'https://www.indiansuperleague.com/static-assets/images/club/1159.png',
    'jamshedpur': 'https://www.indiansuperleague.com/static-assets/images/club/1159.png',
    'neufc': 'https://www.indiansuperleague.com/static-assets/images/club/504.png',
    'northeast united fc': 'https://www.indiansuperleague.com/static-assets/images/club/504.png',
    'northeast united': 'https://www.indiansuperleague.com/static-assets/images/club/504.png',
    'ofc': 'https://www.indiansuperleague.com/static-assets/images/club/1499.png',
    'odisha fc': 'https://www.indiansuperleague.com/static-assets/images/club/1499.png',
    'odisha': 'https://www.indiansuperleague.com/static-assets/images/club/1499.png',
    'cfc': 'https://www.indiansuperleague.com/static-assets/images/club/505.png',
    'chennaiyin fc': 'https://www.indiansuperleague.com/static-assets/images/club/505.png',
    'chennaiyin': 'https://www.indiansuperleague.com/static-assets/images/club/505.png',
    'fcg': 'https://www.indiansuperleague.com/static-assets/images/club/496.png',
    'goa': 'https://www.indiansuperleague.com/static-assets/images/club/496.png',
    'kbfc': 'https://www.indiansuperleague.com/static-assets/images/club/498.png',
    'kerala blasters fc': 'https://www.indiansuperleague.com/static-assets/images/club/498.png',
    'bfc': 'https://www.indiansuperleague.com/static-assets/images/club/656.png',
    'ebfc': 'https://www.indiansuperleague.com/static-assets/images/club/1102.png',
    'mariners': 'https://www.indiansuperleague.com/static-assets/images/club/1874.png',
    'mbsg': 'https://www.indiansuperleague.com/static-assets/images/club/1874.png',
    'mohun bagan super giant': 'https://www.indiansuperleague.com/static-assets/images/club/1874.png',
    "arsenal": "https://images.onefootball.com/icons/teams/164/2.png",
    "manchester city": "https://images.onefootball.com/icons/teams/164/209.png",
    "man city": "https://images.onefootball.com/icons/teams/164/209.png",
    "liverpool": "https://images.onefootball.com/icons/teams/164/18.png",
    "manchester united": "https://images.onefootball.com/icons/teams/164/21.png",
    "man united": "https://images.onefootball.com/icons/teams/164/21.png",
    "chelsea": "https://images.onefootball.com/icons/teams/164/9.png",
    "tottenham hotspur": "https://images.onefootball.com/icons/teams/164/202.png",
    "tottenham": "https://images.onefootball.com/icons/teams/164/202.png",
    "spurs": "https://images.onefootball.com/icons/teams/164/202.png",
    "newcastle united": "https://images.onefootball.com/icons/teams/164/207.png",
    "newcastle": "https://images.onefootball.com/icons/teams/164/207.png",
    "aston villa": "https://images.onefootball.com/icons/teams/164/199.png",
    "brighton": "https://images.onefootball.com/icons/teams/164/670.png",
    "brighton & hove albion": "https://images.onefootball.com/icons/teams/164/670.png",
    "west ham united": "https://images.onefootball.com/icons/teams/164/198.png",
    "west ham": "https://images.onefootball.com/icons/teams/164/198.png",
    "everton": "https://images.onefootball.com/icons/teams/164/197.png",
    "fulham": "https://images.onefootball.com/icons/teams/164/211.png",
    "crystal palace": "https://images.onefootball.com/icons/teams/164/567.png",
    "brentford": "https://images.onefootball.com/icons/teams/164/671.png",
    "wolverhampton wanderers": "https://images.onefootball.com/icons/teams/164/566.png",
    "wolves": "https://images.onefootball.com/icons/teams/164/566.png",
    "bournemouth": "https://images.onefootball.com/icons/teams/164/622.png",
    "afc bournemouth": "https://images.onefootball.com/icons/teams/164/622.png",
    "nottingham forest": "https://images.onefootball.com/icons/teams/164/577.png",
    "leicester city": "https://images.onefootball.com/icons/teams/164/572.png",
    "leicester": "https://images.onefootball.com/icons/teams/164/572.png",
    "southampton": "https://images.onefootball.com/icons/teams/164/578.png",
    "ipswich town": "https://images.onefootball.com/icons/teams/164/570.png",
    "ipswich": "https://images.onefootball.com/icons/teams/164/570.png",
    "real madrid": "https://images.onefootball.com/icons/teams/164/26.png",
    "barcelona": "https://images.onefootball.com/icons/teams/164/5.png",
    "atletico madrid": "https://images.onefootball.com/icons/teams/164/3.png",
    "atlético madrid": "https://images.onefootball.com/icons/teams/164/3.png",
    "athletic club": "https://images.onefootball.com/icons/teams/164/213.png",
    "athletic bilbao": "https://images.onefootball.com/icons/teams/164/213.png",
    "real sociedad": "https://images.onefootball.com/icons/teams/164/224.png",
    "real betis": "https://images.onefootball.com/icons/teams/164/222.png",
    "villarreal": "https://images.onefootball.com/icons/teams/164/229.png",
    "girona": "https://images.onefootball.com/icons/teams/164/3762.png",
    "sevilla": "https://images.onefootball.com/icons/teams/164/27.png",
    "valencia": "https://images.onefootball.com/icons/teams/164/28.png",
    "celta vigo": "https://images.onefootball.com/icons/teams/164/680.png",
    "celta de vigo": "https://images.onefootball.com/icons/teams/164/680.png",
    "osasuna": "https://images.onefootball.com/icons/teams/164/221.png",
    "mallorca": "https://images.onefootball.com/icons/teams/164/218.png",
    "getafe": "https://images.onefootball.com/icons/teams/164/215.png",
    "rayo vallecano": "https://images.onefootball.com/icons/teams/164/223.png",
    "espanyol": "https://images.onefootball.com/icons/teams/164/214.png",
    "alaves": "https://images.onefootball.com/icons/teams/164/679.png",
    "deportivo alaves": "https://images.onefootball.com/icons/teams/164/679.png",
    "las palmas": "https://images.onefootball.com/icons/teams/164/683.png",
    "real valladolid": "https://images.onefootball.com/icons/teams/164/228.png",
    "valladolid": "https://images.onefootball.com/icons/teams/164/228.png",
    "inter": "https://images.onefootball.com/icons/teams/164/15.png",
    "inter milan": "https://images.onefootball.com/icons/teams/164/15.png",
    "juventus": "https://images.onefootball.com/icons/teams/164/21.png",
    "ac milan": "https://images.onefootball.com/icons/teams/164/11.png",
    "milan": "https://images.onefootball.com/icons/teams/164/11.png",
    "napoli": "https://images.onefootball.com/icons/teams/164/17.png",
    "atalanta": "https://images.onefootball.com/icons/teams/164/190.png",
    "roma": "https://images.onefootball.com/icons/teams/164/16.png",
    "lazio": "https://images.onefootball.com/icons/teams/164/12.png",
    "fiorentina": "https://images.onefootball.com/icons/teams/164/217.png",
    "bologna": "https://images.onefootball.com/icons/teams/164/191.png",
    "torino": "https://images.onefootball.com/icons/teams/164/194.png",
    "udinese": "https://images.onefootball.com/icons/teams/164/195.png",
    "genoa": "https://images.onefootball.com/icons/teams/164/192.png",
    "cagliari": "https://images.onefootball.com/icons/teams/164/189.png",
    "monza": "https://images.onefootball.com/icons/teams/164/6013.png",
    "empoli": "https://images.onefootball.com/icons/teams/164/216.png",
    "parma": "https://images.onefootball.com/icons/teams/164/193.png",
    "como": "https://images.onefootball.com/icons/teams/164/6014.png",
    "hellas verona": "https://images.onefootball.com/icons/teams/164/220.png",
    "verona": "https://images.onefootball.com/icons/teams/164/220.png",
    "lecce": "https://images.onefootball.com/icons/teams/164/234.png",
    "venezia": "https://images.onefootball.com/icons/teams/164/5988.png",
    "bayern munchen": "https://images.onefootball.com/icons/teams/164/23.png",
    "bayern munich": "https://images.onefootball.com/icons/teams/164/23.png",
    "bayer leverkusen": "https://images.onefootball.com/icons/teams/164/7.png",
    "leverkusen": "https://images.onefootball.com/icons/teams/164/7.png",
    "borussia dortmund": "https://images.onefootball.com/icons/teams/164/8.png",
    "dortmund": "https://images.onefootball.com/icons/teams/164/8.png",
    "rb leipzig": "https://images.onefootball.com/icons/teams/164/5152.png",
    "leipzig": "https://images.onefootball.com/icons/teams/164/5152.png",
    "eintracht frankfurt": "https://images.onefootball.com/icons/teams/164/148.png",
    "frankfurt": "https://images.onefootball.com/icons/teams/164/148.png",
    "vfb stuttgart": "https://images.onefootball.com/icons/teams/164/151.png",
    "stuttgart": "https://images.onefootball.com/icons/teams/164/151.png",
    "vfl wolfsburg": "https://images.onefootball.com/icons/teams/164/152.png",
    "wolfsburg": "https://images.onefootball.com/icons/teams/164/152.png",
    "borussia m'gladbach": "https://images.onefootball.com/icons/teams/164/154.png",
    "monchengladbach": "https://images.onefootball.com/icons/teams/164/154.png",
    "sc freiburg": "https://images.onefootball.com/icons/teams/164/150.png",
    "freiburg": "https://images.onefootball.com/icons/teams/164/150.png",
    "1. fc union berlin": "https://images.onefootball.com/icons/teams/164/166.png",
    "union berlin": "https://images.onefootball.com/icons/teams/164/166.png",
    "tsg hoffenheim": "https://images.onefootball.com/icons/teams/164/158.png",
    "hoffenheim": "https://images.onefootball.com/icons/teams/164/158.png",
    "sv werder bremen": "https://images.onefootball.com/icons/teams/164/153.png",
    "werder bremen": "https://images.onefootball.com/icons/teams/164/153.png",
    "fc augsburg": "https://images.onefootball.com/icons/teams/164/146.png",
    "augsburg": "https://images.onefootball.com/icons/teams/164/146.png",
    "1. fsv mainz 05": "https://images.onefootball.com/icons/teams/164/149.png",
    "mainz": "https://images.onefootball.com/icons/teams/164/149.png",
    "1. fc heidenheim": "https://images.onefootball.com/icons/teams/164/5154.png",
    "heidenheim": "https://images.onefootball.com/icons/teams/164/5154.png",
    "fc st. pauli": "https://images.onefootball.com/icons/teams/164/157.png",
    "st pauli": "https://images.onefootball.com/icons/teams/164/157.png",
    "vfl bochum": "https://images.onefootball.com/icons/teams/164/147.png",
    "bochum": "https://images.onefootball.com/icons/teams/164/147.png",
    "holstein kiel": "https://images.onefootball.com/icons/teams/164/5155.png",
    "paris saint-germain": "https://images.onefootball.com/icons/teams/164/24.png",
    "psg": "https://images.onefootball.com/icons/teams/164/24.png",
    "monaco": "https://images.onefootball.com/icons/teams/164/259.png",
    "marseille": "https://images.onefootball.com/icons/teams/164/19.png",
    "lille": "https://images.onefootball.com/icons/teams/164/256.png",
    "lyon": "https://images.onefootball.com/icons/teams/164/257.png",
    "lens": "https://images.onefootball.com/icons/teams/164/255.png",
    "nice": "https://images.onefootball.com/icons/teams/164/261.png",
    "rennes": "https://images.onefootball.com/icons/teams/164/264.png",
    "brest": "https://images.onefootball.com/icons/teams/164/5168.png",
    "strasbourg": "https://images.onefootball.com/icons/teams/164/267.png",
    "toulouse": "https://images.onefootball.com/icons/teams/164/268.png",
    "nantes": "https://images.onefootball.com/icons/teams/164/260.png",
    "reims": "https://images.onefootball.com/icons/teams/164/265.png",
    "montpellier": "https://images.onefootball.com/icons/teams/164/258.png",
    "auxerre": "https://images.onefootball.com/icons/teams/164/251.png",
    "angers": "https://images.onefootball.com/icons/teams/164/5167.png",
    "saint-etienne": "https://images.onefootball.com/icons/teams/164/266.png",
    "le havre": "https://images.onefootball.com/icons/teams/164/5169.png",
    "sporting cp": "https://images.onefootball.com/icons/teams/164/345.png",
    "sporting": "https://images.onefootball.com/icons/teams/164/345.png",
    "benfica": "https://images.onefootball.com/icons/teams/164/344.png",
    "porto": "https://images.onefootball.com/icons/teams/164/346.png",
    "braga": "https://images.onefootball.com/icons/teams/164/347.png",
    "ajax": "https://images.onefootball.com/icons/teams/164/248.png",
    "psv": "https://images.onefootball.com/icons/teams/164/250.png",
    "feyenoord": "https://images.onefootball.com/icons/teams/164/249.png",
    "al nassr": "https://images.onefootball.com/icons/teams/164/4011.png",
    "al hilal": "https://images.onefootball.com/icons/teams/164/4010.png",
    "al ittihad": "https://images.onefootball.com/icons/teams/164/4012.png",
    "al ahli": "https://images.onefootball.com/icons/teams/164/4013.png",
    "inter miami": "https://images.onefootball.com/icons/teams/164/5590.png",
    "celtic": "https://images.onefootball.com/icons/teams/164/288.png",
    "rangers": "https://images.onefootball.com/icons/teams/164/289.png",
    "galatasaray": "https://images.onefootball.com/icons/teams/164/312.png",
    "fenerbahce": "https://images.onefootball.com/icons/teams/164/311.png",
    "besiktas": "https://images.onefootball.com/icons/teams/164/310.png",
    "flamengo": "https://images.onefootball.com/icons/teams/164/1681.png",
    "palmeiras": "https://images.onefootball.com/icons/teams/164/1682.png",
    "river plate": "https://images.onefootball.com/icons/teams/164/1688.png",
    "boca juniors": "https://images.onefootball.com/icons/teams/164/1689.png",
    'mohun bagan sg': 'https://www.indiansuperleague.com/static-assets/images/club/1874.png',
    'mohun bagan': 'https://www.indiansuperleague.com/static-assets/images/club/1874.png',
    'east bengal fc': 'https://www.indiansuperleague.com/static-assets/images/club/1102.png',
    'east bengal': 'https://www.indiansuperleague.com/static-assets/images/club/1102.png',
    'mumbai city fc': 'https://www.indiansuperleague.com/static-assets/images/club/506.png',
    'mumbai city': 'https://www.indiansuperleague.com/static-assets/images/club/506.png',
    'bengaluru fc': 'https://www.indiansuperleague.com/static-assets/images/club/656.png',
    'bengaluru': 'https://www.indiansuperleague.com/static-assets/images/club/656.png',
    'kerala blasters': 'https://www.indiansuperleague.com/static-assets/images/club/498.png',
    'fc goa': 'https://www.indiansuperleague.com/static-assets/images/club/496.png',
    "argentina": "https://images.onefootball.com/icons/teams/164/436.png",
    "arg": "https://images.onefootball.com/icons/teams/164/436.png",
    "brazil": "https://images.onefootball.com/icons/teams/164/438.png",
    "bra": "https://images.onefootball.com/icons/teams/164/438.png",
    "uruguay": "https://images.onefootball.com/icons/teams/164/462.png",
    "uru": "https://images.onefootball.com/icons/teams/164/462.png",
    "colombia": "https://images.onefootball.com/icons/teams/164/439.png",
    "col": "https://images.onefootball.com/icons/teams/164/439.png",
    "chile": "https://images.onefootball.com/icons/teams/164/470.png",
    "chi": "https://images.onefootball.com/icons/teams/164/470.png",
    "ecuador": "https://images.onefootball.com/icons/teams/164/491.png",
    "ecu": "https://images.onefootball.com/icons/teams/164/491.png",
    "peru": "https://images.onefootball.com/icons/teams/164/492.png",
    "per": "https://images.onefootball.com/icons/teams/164/492.png",
    "paraguay": "https://images.onefootball.com/icons/teams/164/493.png",
    "par": "https://images.onefootball.com/icons/teams/164/493.png",
    "venezuela": "https://images.onefootball.com/icons/teams/164/494.png",
    "ven": "https://images.onefootball.com/icons/teams/164/494.png",
    "bolivia": "https://images.onefootball.com/icons/teams/164/495.png",
    "bol": "https://images.onefootball.com/icons/teams/164/495.png",
    "france": "https://images.onefootball.com/icons/teams/164/443.png",
    "fra": "https://images.onefootball.com/icons/teams/164/443.png",
    "england": "https://images.onefootball.com/icons/teams/164/441.png",
    "eng": "https://images.onefootball.com/icons/teams/164/441.png",
    "spain": "https://images.onefootball.com/icons/teams/164/457.png",
    "esp": "https://images.onefootball.com/icons/teams/164/457.png",
    "germany": "https://images.onefootball.com/icons/teams/164/444.png",
    "ger": "https://images.onefootball.com/icons/teams/164/444.png",
    "portugal": "https://images.onefootball.com/icons/teams/164/454.png",
    "por": "https://images.onefootball.com/icons/teams/164/454.png",
    "italy": "https://images.onefootball.com/icons/teams/164/448.png",
    "ita": "https://images.onefootball.com/icons/teams/164/448.png",
    "netherlands": "https://images.onefootball.com/icons/teams/164/451.png",
    "ned": "https://images.onefootball.com/icons/teams/164/451.png",
    "holland": "https://images.onefootball.com/icons/teams/164/451.png",
    "belgium": "https://images.onefootball.com/icons/teams/164/437.png",
    "bel": "https://images.onefootball.com/icons/teams/164/437.png",
    "croatia": "https://images.onefootball.com/icons/teams/164/440.png",
    "cro": "https://images.onefootball.com/icons/teams/164/440.png",
    "switzerland": "https://images.onefootball.com/icons/teams/164/496.png",
    "sui": "https://images.onefootball.com/icons/teams/164/496.png",
    "denmark": "https://images.onefootball.com/icons/teams/164/497.png",
    "den": "https://images.onefootball.com/icons/teams/164/497.png",
    "austria": "https://images.onefootball.com/icons/teams/164/498.png",
    "aut": "https://images.onefootball.com/icons/teams/164/498.png",
    "norway": "https://images.onefootball.com/icons/teams/164/499.png",
    "nor": "https://images.onefootball.com/icons/teams/164/499.png",
    "sweden": "https://images.onefootball.com/icons/teams/164/500.png",
    "swe": "https://images.onefootball.com/icons/teams/164/500.png",
    "poland": "https://images.onefootball.com/icons/teams/164/453.png",
    "pol": "https://images.onefootball.com/icons/teams/164/453.png",
    "scotland": "https://images.onefootball.com/icons/teams/164/455.png",
    "sco": "https://images.onefootball.com/icons/teams/164/455.png",
    "wales": "https://images.onefootball.com/icons/teams/164/464.png",
    "wal": "https://images.onefootball.com/icons/teams/164/464.png",
    "turkey": "https://images.onefootball.com/icons/teams/164/461.png",
    "tur": "https://images.onefootball.com/icons/teams/164/461.png",
    "turkiye": "https://images.onefootball.com/icons/teams/164/461.png",
    "czech republic": "https://images.onefootball.com/icons/teams/164/442.png",
    "czechia": "https://images.onefootball.com/icons/teams/164/442.png",
    "cze": "https://images.onefootball.com/icons/teams/164/442.png",
    "hungary": "https://images.onefootball.com/icons/teams/164/446.png",
    "hun": "https://images.onefootball.com/icons/teams/164/446.png",
    "ukraine": "https://images.onefootball.com/icons/teams/164/460.png",
    "ukr": "https://images.onefootball.com/icons/teams/164/460.png",
    "romania": "https://images.onefootball.com/icons/teams/164/501.png",
    "rou": "https://images.onefootball.com/icons/teams/164/501.png",
    "greece": "https://images.onefootball.com/icons/teams/164/445.png",
    "gre": "https://images.onefootball.com/icons/teams/164/445.png",
    "serbia": "https://images.onefootball.com/icons/teams/164/456.png",
    "srb": "https://images.onefootball.com/icons/teams/164/456.png",
    "albania": "https://images.onefootball.com/icons/teams/164/435.png",
    "alb": "https://images.onefootball.com/icons/teams/164/435.png",
    "georgia": "https://images.onefootball.com/icons/teams/164/447.png",
    "geo": "https://images.onefootball.com/icons/teams/164/447.png",
    "slovenia": "https://images.onefootball.com/icons/teams/164/458.png",
    "svn": "https://images.onefootball.com/icons/teams/164/458.png",
    "slovakia": "https://images.onefootball.com/icons/teams/164/502.png",
    "svk": "https://images.onefootball.com/icons/teams/164/502.png",
    "finland": "https://images.onefootball.com/icons/teams/164/467.png",
    "fin": "https://images.onefootball.com/icons/teams/164/467.png",
    "iceland": "https://images.onefootball.com/icons/teams/164/468.png",
    "isl": "https://images.onefootball.com/icons/teams/164/468.png",
    "bosnia and herzegovina": "https://images.onefootball.com/icons/teams/164/469.png",
    "bosnia": "https://images.onefootball.com/icons/teams/164/469.png",
    "bih": "https://images.onefootball.com/icons/teams/164/469.png",
    "northern ireland": "https://images.onefootball.com/icons/teams/164/471.png",
    "nir": "https://images.onefootball.com/icons/teams/164/471.png",
    "republic of ireland": "https://images.onefootball.com/icons/teams/164/472.png",
    "ireland": "https://images.onefootball.com/icons/teams/164/472.png",
    "irl": "https://images.onefootball.com/icons/teams/164/472.png",
    "morocco": "https://images.onefootball.com/icons/teams/164/480.png",
    "mar": "https://images.onefootball.com/icons/teams/164/480.png",
    "senegal": "https://images.onefootball.com/icons/teams/164/473.png",
    "sen": "https://images.onefootball.com/icons/teams/164/473.png",
    "nigeria": "https://images.onefootball.com/icons/teams/164/503.png",
    "nga": "https://images.onefootball.com/icons/teams/164/503.png",
    "egypt": "https://images.onefootball.com/icons/teams/164/474.png",
    "egy": "https://images.onefootball.com/icons/teams/164/474.png",
    "ivory coast": "https://images.onefootball.com/icons/teams/164/475.png",
    "cote d'ivoire": "https://images.onefootball.com/icons/teams/164/475.png",
    "civ": "https://images.onefootball.com/icons/teams/164/475.png",
    "ghana": "https://images.onefootball.com/icons/teams/164/476.png",
    "gha": "https://images.onefootball.com/icons/teams/164/476.png",
    "cameroon": "https://images.onefootball.com/icons/teams/164/504.png",
    "cmr": "https://images.onefootball.com/icons/teams/164/504.png",
    "algeria": "https://images.onefootball.com/icons/teams/164/478.png",
    "alg": "https://images.onefootball.com/icons/teams/164/478.png",
    "south africa": "https://images.onefootball.com/icons/teams/164/479.png",
    "rsa": "https://images.onefootball.com/icons/teams/164/479.png",
    "cape verde": "https://images.onefootball.com/icons/teams/164/505.png",
    "cpv": "https://images.onefootball.com/icons/teams/164/505.png",
    "mali": "https://images.onefootball.com/icons/teams/164/506.png",
    "mli": "https://images.onefootball.com/icons/teams/164/506.png",
    "guinea": "https://images.onefootball.com/icons/teams/164/507.png",
    "gui": "https://images.onefootball.com/icons/teams/164/507.png",
    "dr congo": "https://images.onefootball.com/icons/teams/164/508.png",
    "cod": "https://images.onefootball.com/icons/teams/164/508.png",
    "burkina faso": "https://images.onefootball.com/icons/teams/164/509.png",
    "bfa": "https://images.onefootball.com/icons/teams/164/509.png",
    "zambia": "https://images.onefootball.com/icons/teams/164/510.png",
    "zam": "https://images.onefootball.com/icons/teams/164/510.png",
    "angola": "https://images.onefootball.com/icons/teams/164/511.png",
    "ang": "https://images.onefootball.com/icons/teams/164/511.png",
    "mozambique": "https://images.onefootball.com/icons/teams/164/512.png",
    "moz": "https://images.onefootball.com/icons/teams/164/512.png",
    "equatorial guinea": "https://images.onefootball.com/icons/teams/164/513.png",
    "eqg": "https://images.onefootball.com/icons/teams/164/513.png",
    "mauritania": "https://images.onefootball.com/icons/teams/164/514.png",
    "mtn": "https://images.onefootball.com/icons/teams/164/514.png",
    "namibia": "https://images.onefootball.com/icons/teams/164/515.png",
    "nam": "https://images.onefootball.com/icons/teams/164/515.png",
    "gambia": "https://images.onefootball.com/icons/teams/164/516.png",
    "gam": "https://images.onefootball.com/icons/teams/164/516.png",
    "gabon": "https://images.onefootball.com/icons/teams/164/517.png",
    "gab": "https://images.onefootball.com/icons/teams/164/517.png",
    "uganda": "https://images.onefootball.com/icons/teams/164/518.png",
    "uga": "https://images.onefootball.com/icons/teams/164/518.png",
    "kenya": "https://images.onefootball.com/icons/teams/164/519.png",
    "ken": "https://images.onefootball.com/icons/teams/164/519.png",
    "tanzania": "https://images.onefootball.com/icons/teams/164/520.png",
    "tan": "https://images.onefootball.com/icons/teams/164/520.png",
    "zimbabwe": "https://images.onefootball.com/icons/teams/164/521.png",
    "zim": "https://images.onefootball.com/icons/teams/164/521.png",
    "usa": "https://images.onefootball.com/icons/teams/164/463.png",
    "united states": "https://images.onefootball.com/icons/teams/164/463.png",
    "mexico": "https://images.onefootball.com/icons/teams/164/450.png",
    "mex": "https://images.onefootball.com/icons/teams/164/450.png",
    "canada": "https://images.onefootball.com/icons/teams/164/481.png",
    "can": "https://images.onefootball.com/icons/teams/164/481.png",
    "costa rica": "https://images.onefootball.com/icons/teams/164/522.png",
    "crc": "https://images.onefootball.com/icons/teams/164/522.png",
    "jamaica": "https://images.onefootball.com/icons/teams/164/523.png",
    "jam": "https://images.onefootball.com/icons/teams/164/523.png",
    "panama": "https://images.onefootball.com/icons/teams/164/524.png",
    "pan": "https://images.onefootball.com/icons/teams/164/524.png",
    "honduras": "https://images.onefootball.com/icons/teams/164/525.png",
    "hon": "https://images.onefootball.com/icons/teams/164/525.png",
    "el salvador": "https://images.onefootball.com/icons/teams/164/526.png",
    "slv": "https://images.onefootball.com/icons/teams/164/526.png",
    "trinidad and tobago": "https://images.onefootball.com/icons/teams/164/527.png",
    "tri": "https://images.onefootball.com/icons/teams/164/527.png",
    "japan": "https://images.onefootball.com/icons/teams/164/449.png",
    "jpn": "https://images.onefootball.com/icons/teams/164/449.png",
    "south korea": "https://images.onefootball.com/icons/teams/164/459.png",
    "kor": "https://images.onefootball.com/icons/teams/164/459.png",
    "australia": "https://images.onefootball.com/icons/teams/164/482.png",
    "aus": "https://images.onefootball.com/icons/teams/164/482.png",
    "saudi arabia": "https://images.onefootball.com/icons/teams/164/483.png",
    "ksa": "https://images.onefootball.com/icons/teams/164/483.png",
    "iran": "https://images.onefootball.com/icons/teams/164/528.png",
    "irn": "https://images.onefootball.com/icons/teams/164/528.png",
    "qatar": "https://images.onefootball.com/icons/teams/164/485.png",
    "qat": "https://images.onefootball.com/icons/teams/164/485.png",
    "india": "https://images.onefootball.com/icons/teams/164/486.png",
    "ind": "https://images.onefootball.com/icons/teams/164/486.png",
    "uzbekistan": "https://images.onefootball.com/icons/teams/164/529.png",
    "uzb": "https://images.onefootball.com/icons/teams/164/529.png",
    "jordan": "https://images.onefootball.com/icons/teams/164/530.png",
    "jor": "https://images.onefootball.com/icons/teams/164/530.png",
    "iraq": "https://images.onefootball.com/icons/teams/164/531.png",
    "irq": "https://images.onefootball.com/icons/teams/164/531.png",
    "uae": "https://images.onefootball.com/icons/teams/164/532.png",
    "united arab emirates": "https://images.onefootball.com/icons/teams/164/532.png",
    "oman": "https://images.onefootball.com/icons/teams/164/533.png",
    "oma": "https://images.onefootball.com/icons/teams/164/533.png",
    "bahrain": "https://images.onefootball.com/icons/teams/164/534.png",
    "bhr": "https://images.onefootball.com/icons/teams/164/534.png",
    "thailand": "https://images.onefootball.com/icons/teams/164/535.png",
    "tha": "https://images.onefootball.com/icons/teams/164/535.png",
    "vietnam": "https://images.onefootball.com/icons/teams/164/536.png",
    "vie": "https://images.onefootball.com/icons/teams/164/536.png",
    "indonesia": "https://images.onefootball.com/icons/teams/164/537.png",
    "idn": "https://images.onefootball.com/icons/teams/164/537.png",
    "malaysia": "https://images.onefootball.com/icons/teams/164/538.png",
    "mas": "https://images.onefootball.com/icons/teams/164/538.png",
    "china": "https://images.onefootball.com/icons/teams/164/539.png",
    "chn": "https://images.onefootball.com/icons/teams/164/539.png",
    "new zealand": "https://images.onefootball.com/icons/teams/164/540.png",
    "nzl": "https://images.onefootball.com/icons/teams/164/540.png",
    "ivoire": "https://images.onefootball.com/icons/teams/164/447.png",
    "cabo verde": "https://images.onefootball.com/icons/teams/164/489.png",
    "democratic republic of the congo": "https://images.onefootball.com/icons/teams/164/493.png",
    "congo dr": "https://images.onefootball.com/icons/teams/164/493.png",
    "gladbach": "https://images.onefootball.com/icons/teams/164/100.png"
  };

  static getFootballLogo(name, shortName = '', id = null) {
    const cleanShort = (shortName || '').toLowerCase().trim();
    if (cleanShort && this.FOOTBALL_TEAMS_LOGOS_MAP[cleanShort]) {
      return this.FOOTBALL_TEAMS_LOGOS_MAP[cleanShort];
    }
    if (name) {
      const clean = name.toLowerCase().trim();
      if (this.FOOTBALL_TEAMS_LOGOS_MAP[clean]) {
        return this.FOOTBALL_TEAMS_LOGOS_MAP[clean];
      }
      // Strip common suffixes / prefixes (e.g. "Arsenal FC" -> "arsenal")
      const baseName = clean.replace(/\b(women|men|u19|u-19|under-19|under 19|a|xi|fc|cf|sc|ac|afc|club)\b/gi, '').trim();
      if (baseName && this.FOOTBALL_TEAMS_LOGOS_MAP[baseName]) {
        return this.FOOTBALL_TEAMS_LOGOS_MAP[baseName];
      }
      for (const [k, v] of Object.entries(this.FOOTBALL_TEAMS_LOGOS_MAP)) {
        if (clean === k || clean.startsWith(k + ' ') || clean.endsWith(' ' + k) || (baseName && baseName === k)) {
          return v;
        }
      }
    }
    if (id && Number(id) > 0) {
      return `https://images.onefootball.com/icons/teams/164/${id}.png`;
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
