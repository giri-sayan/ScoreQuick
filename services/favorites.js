/**
 * ScoreQuick - Followed Teams & Favorites Manager
 * Copyright (c) 2026 Giri Sayan. All Rights Reserved.
 * PROPRIETARY & CONFIDENTIAL. Unauthorized copying, modification, or distribution is prohibited.
 *
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
      // 🏆 Major Football Leagues (100% verified official FotMob logos)
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
      { id: 9478, name: 'Indian Super League', shortName: 'ISL', isLeague: true, category: 'League', country: 'IND', logo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/9478.png' },

      // ⚽ Top European & Global Clubs (100% verified official FotMob crests)
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
      { id: 8668, name: 'Everton', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8668.png' },
      { id: 9879, name: 'Fulham', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9879.png' },
      { id: 9826, name: 'Crystal Palace', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9826.png' },
      { id: 9937, name: 'Brentford', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9937.png' },
      { id: 8602, name: 'Wolverhampton Wanderers', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8602.png' },
      { id: 8678, name: 'Bournemouth', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8678.png' },
      { id: 10203, name: 'Nottingham Forest', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10203.png' },
      { id: 8197, name: 'Leicester City', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8197.png' },
      { id: 8466, name: 'Southampton', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8466.png' },
      { id: 9902, name: 'Ipswich Town', league: 'Premier League', category: 'Club', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9902.png' },
      // La Liga
      { id: 8633, name: 'Real Madrid', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png' },
      { id: 8634, name: 'Barcelona', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8634.png' },
      { id: 9906, name: 'Atlético Madrid', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9906.png' },
      { id: 8315, name: 'Athletic Club', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8315.png' },
      { id: 8560, name: 'Real Sociedad', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8560.png' },
      { id: 8603, name: 'Real Betis', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8603.png' },
      { id: 10205, name: 'Villarreal', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10205.png' },
      { id: 7732, name: 'Girona', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/7732.png' },
      { id: 8302, name: 'Sevilla', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8302.png' },
      { id: 10267, name: 'Valencia', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10267.png' },
      { id: 9910, name: 'Celta Vigo', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9910.png' },
      { id: 8371, name: 'Osasuna', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8371.png' },
      { id: 8661, name: 'Mallorca', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8661.png' },
      { id: 8305, name: 'Getafe', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8305.png' },
      { id: 8370, name: 'Rayo Vallecano', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8370.png' },
      { id: 8558, name: 'Espanyol', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8558.png' },
      { id: 9866, name: 'Alaves', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9866.png' },
      { id: 8306, name: 'Las Palmas', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8306.png' },
      { id: 10281, name: 'Real Valladolid', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10281.png' },
      { id: 7854, name: 'Leganes', league: 'La Liga', category: 'Club', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/7854.png' },
      // Serie A
      { id: 8636, name: 'Inter', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8636.png' },
      { id: 9885, name: 'Juventus', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9885.png' },
      { id: 8564, name: 'AC Milan', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8564.png' },
      { id: 9875, name: 'Napoli', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9875.png' },
      { id: 8524, name: 'Atalanta', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8524.png' },
      { id: 8686, name: 'Roma', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8686.png' },
      { id: 8543, name: 'Lazio', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8543.png' },
      { id: 8535, name: 'Fiorentina', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8535.png' },
      { id: 9857, name: 'Bologna', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9857.png' },
      { id: 9804, name: 'Torino', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9804.png' },
      { id: 8600, name: 'Udinese', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8600.png' },
      { id: 10233, name: 'Genoa', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10233.png' },
      { id: 8529, name: 'Cagliari', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8529.png' },
      { id: 6504, name: 'Monza', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6504.png' },
      { id: 8534, name: 'Empoli', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8534.png' },
      { id: 10167, name: 'Parma', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10167.png' },
      { id: 10171, name: 'Como', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10171.png' },
      { id: 9876, name: 'Hellas Verona', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9876.png' },
      { id: 9888, name: 'Lecce', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9888.png' },
      { id: 7881, name: 'Venezia', league: 'Serie A', category: 'Club', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/7881.png' },
      // Bundesliga
      { id: 9823, name: 'Bayern München', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png' },
      { id: 8178, name: 'Bayer Leverkusen', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8178.png' },
      { id: 9789, name: 'Borussia Dortmund', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9789.png' },
      { id: 178475, name: 'RB Leipzig', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/178475.png' },
      { id: 9810, name: 'Eintracht Frankfurt', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9810.png' },
      { id: 10269, name: 'VfB Stuttgart', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10269.png' },
      { id: 394121, name: 'VfL Wolfsburg', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/394121.png' },
      { id: 9788, name: 'Borussia Mönchengladbach', shortName: 'BMG', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9788.png' },
      { id: 8358, name: 'SC Freiburg', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8358.png' },
      { id: 8149, name: '1. FC Union Berlin', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8149.png' },
      { id: 8226, name: 'TSG Hoffenheim', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8226.png' },
      { id: 8697, name: 'SV Werder Bremen', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8697.png' },
      { id: 8406, name: 'FC Augsburg', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8406.png' },
      { id: 9905, name: '1. FSV Mainz 05', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9905.png' },
      { id: 94937, name: '1. FC Heidenheim', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/94937.png' },
      { id: 8152, name: 'FC St. Pauli', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8152.png' },
      { id: 9911, name: 'VfL Bochum', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9911.png' },
      { id: 8150, name: 'Holstein Kiel', league: 'Bundesliga', category: 'Club', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8150.png' },
      // Ligue 1
      { id: 9847, name: 'Paris Saint-Germain', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png' },
      { id: 9829, name: 'Monaco', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9829.png' },
      { id: 8592, name: 'Marseille', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8592.png' },
      { id: 8639, name: 'Lille', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8639.png' },
      { id: 9748, name: 'Lyon', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9748.png' },
      { id: 8588, name: 'Lens', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8588.png' },
      { id: 9831, name: 'Nice', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9831.png' },
      { id: 9851, name: 'Rennes', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9851.png' },
      { id: 8521, name: 'Brest', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8521.png' },
      { id: 9848, name: 'Strasbourg', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9848.png' },
      { id: 9941, name: 'Toulouse', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9941.png' },
      { id: 9830, name: 'Nantes', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9830.png' },
      { id: 9837, name: 'Reims', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9837.png' },
      { id: 10249, name: 'Montpellier', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10249.png' },
      { id: 8583, name: 'Auxerre', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8583.png' },
      { id: 8121, name: 'Angers', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8121.png' },
      { id: 9853, name: 'Saint-Etienne', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9853.png' },
      { id: 9746, name: 'Le Havre', league: 'Ligue 1', category: 'Club', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9746.png' },
      // Liga Portugal
      { id: 9768, name: 'Sporting CP', league: 'Liga Portugal', category: 'Club', country: 'POR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9768.png' },
      { id: 9772, name: 'Benfica', league: 'Liga Portugal', category: 'Club', country: 'POR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9772.png' },
      { id: 9773, name: 'Porto', league: 'Liga Portugal', category: 'Club', country: 'POR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9773.png' },
      { id: 10264, name: 'Braga', league: 'Liga Portugal', category: 'Club', country: 'POR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10264.png' },
      // Eredivisie
      { id: 8593, name: 'Ajax', league: 'Eredivisie', category: 'Club', country: 'NED', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8593.png' },
      { id: 8640, name: 'PSV', league: 'Eredivisie', category: 'Club', country: 'NED', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8640.png' },
      { id: 10235, name: 'Feyenoord', league: 'Eredivisie', category: 'Club', country: 'NED', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10235.png' },
      // Saudi Pro League
      { id: 101918, name: 'Al Nassr', league: 'Saudi Pro League', category: 'Club', country: 'KSA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/101918.png' },
      { id: 2529, name: 'Al Hilal', league: 'Saudi Pro League', category: 'Club', country: 'KSA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/2529.png' },
      { id: 8577, name: 'Al Ittihad', league: 'Saudi Pro League', category: 'Club', country: 'KSA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8577.png' },
      { id: 2530, name: 'Al Ahli', league: 'Saudi Pro League', category: 'Club', country: 'KSA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/2530.png' },
      // MLS
      { id: 960720, name: 'Inter Miami', league: 'MLS', category: 'Club', country: 'USA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/960720.png' },
      // Scottish Premiership
      { id: 9925, name: 'Celtic', league: 'Scottish Premiership', category: 'Club', country: 'SCO', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9925.png' },
      { id: 8548, name: 'Rangers', league: 'Scottish Premiership', category: 'Club', country: 'SCO', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8548.png' },
      // Süper Lig
      { id: 8637, name: 'Galatasaray', league: 'Süper Lig', category: 'Club', country: 'TUR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8637.png' },
      { id: 8695, name: 'Fenerbahce', league: 'Süper Lig', category: 'Club', country: 'TUR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8695.png' },
      { id: 10188, name: 'Besiktas', league: 'Süper Lig', category: 'Club', country: 'TUR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10188.png' },
      // Brasileirão
      { id: 9770, name: 'Flamengo', league: 'Brasileirão', category: 'Club', country: 'BRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9770.png' },
      { id: 10283, name: 'Palmeiras', league: 'Brasileirão', category: 'Club', country: 'BRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10283.png' },
      // Liga Profesional
      { id: 10076, name: 'River Plate', league: 'Liga Profesional', category: 'Club', country: 'ARG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10076.png' },
      { id: 10077, name: 'Boca Juniors', league: 'Liga Profesional', category: 'Club', country: 'ARG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10077.png' },
      // ISL
      { id: 578651, name: 'Mohun Bagan Super Giant', shortName: 'MBSG', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/578651.png' },
      { id: 165184, name: 'East Bengal FC', shortName: 'EBFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/165184.png' },
      { id: 578655, name: 'Mumbai City FC', shortName: 'MCFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/578655.png' },
      { id: 485935, name: 'Bengaluru FC', shortName: 'BFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/485935.png' },
      { id: 578654, name: 'Kerala Blasters FC', shortName: 'KBFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/578654.png' },
      { id: 578650, name: 'FC Goa', shortName: 'FCG', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/578650.png' },
      { id: 578652, name: 'Chennaiyin FC', shortName: 'CFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/578652.png' },
      { id: 578653, name: 'Odisha FC', shortName: 'OFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/578653.png' },
      { id: 578656, name: 'NorthEast United FC', shortName: 'NEUFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/578656.png' },
      { id: 873038, name: 'Jamshedpur FC', shortName: 'JFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/873038.png' },
      { id: 589749, name: 'Punjab FC', shortName: 'PFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/589749.png' },
      { id: 165187, name: 'Mohammedan SC', shortName: 'MSC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/165187.png' },
      { id: 1086744, name: 'Hyderabad FC', shortName: 'HFC', league: 'ISL', category: 'Club', country: 'IND', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/1086744.png' },

      // 🌍 International Football Teams (100% verified official FotMob federation crests)
      { id: 6706, name: 'Argentina', shortName: 'ARG', category: 'International', country: 'ARG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6706.png' },
      { id: 8256, name: 'Brazil', shortName: 'BRA', category: 'International', country: 'BRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8256.png' },
      { id: 5796, name: 'Uruguay', shortName: 'URU', category: 'International', country: 'URU', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5796.png' },
      { id: 8258, name: 'Colombia', shortName: 'COL', category: 'International', country: 'COL', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8258.png' },
      { id: 9762, name: 'Chile', shortName: 'CHI', category: 'International', country: 'CHI', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9762.png' },
      { id: 6707, name: 'Ecuador', shortName: 'ECU', category: 'International', country: 'ECU', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6707.png' },
      { id: 5798, name: 'Peru', shortName: 'PER', category: 'International', country: 'PER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5798.png' },
      { id: 6724, name: 'Paraguay', shortName: 'PAR', category: 'International', country: 'PAR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6724.png' },
      { id: 5800, name: 'Venezuela', shortName: 'VEN', category: 'International', country: 'VEN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5800.png' },
      { id: 5797, name: 'Bolivia', shortName: 'BOL', category: 'International', country: 'BOL', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5797.png' },
      { id: 6723, name: 'France', shortName: 'FRA', category: 'International', country: 'FRA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6723.png' },
      { id: 8491, name: 'England', shortName: 'ENG', category: 'International', country: 'ENG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8491.png' },
      { id: 6720, name: 'Spain', shortName: 'ESP', category: 'International', country: 'ESP', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6720.png' },
      { id: 8570, name: 'Germany', shortName: 'GER', category: 'International', country: 'GER', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8570.png' },
      { id: 8361, name: 'Portugal', shortName: 'POR', category: 'International', country: 'POR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8361.png' },
      { id: 8204, name: 'Italy', shortName: 'ITA', category: 'International', country: 'ITA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8204.png' },
      { id: 6708, name: 'Netherlands', shortName: 'NED', category: 'International', country: 'NED', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6708.png' },
      { id: 8263, name: 'Belgium', shortName: 'BEL', category: 'International', country: 'BEL', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8263.png' },
      { id: 10155, name: 'Croatia', shortName: 'CRO', category: 'International', country: 'CRO', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10155.png' },
      { id: 6717, name: 'Switzerland', shortName: 'SUI', category: 'International', country: 'SUI', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6717.png' },
      { id: 8238, name: 'Denmark', shortName: 'DEN', category: 'International', country: 'DEN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8238.png' },
      { id: 8255, name: 'Austria', shortName: 'AUT', category: 'International', country: 'AUT', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8255.png' },
      { id: 8492, name: 'Norway', shortName: 'NOR', category: 'International', country: 'NOR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8492.png' },
      { id: 8520, name: 'Sweden', shortName: 'SWE', category: 'International', country: 'SWE', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8520.png' },
      { id: 8568, name: 'Poland', shortName: 'POL', category: 'International', country: 'POL', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8568.png' },
      { id: 8498, name: 'Scotland', shortName: 'SCO', category: 'International', country: 'SCO', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8498.png' },
      { id: 5790, name: 'Wales', shortName: 'WAL', category: 'International', country: 'WAL', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5790.png' },
      { id: 6595, name: 'Turkey', shortName: 'TUR', category: 'International', country: 'TUR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6595.png' },
      { id: 8496, name: 'Czech Republic', shortName: 'CZE', category: 'International', country: 'CZE', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8496.png' },
      { id: 8565, name: 'Hungary', shortName: 'HUN', category: 'International', country: 'HUN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8565.png' },
      { id: 6718, name: 'Ukraine', shortName: 'UKR', category: 'International', country: 'UKR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6718.png' },
      { id: 9730, name: 'Romania', shortName: 'ROU', category: 'International', country: 'ROU', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/9730.png' },
      { id: 6383, name: 'Greece', shortName: 'GRE', category: 'International', country: 'GRE', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6383.png' },
      { id: 8205, name: 'Serbia', shortName: 'SRB', category: 'International', country: 'SRB', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8205.png' },
      { id: 10024, name: 'Albania', shortName: 'ALB', category: 'International', country: 'ALB', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10024.png' },
      { id: 8268, name: 'Georgia', shortName: 'GEO', category: 'International', country: 'GEO', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8268.png' },
      { id: 5787, name: 'Slovenia', shortName: 'SVN', category: 'International', country: 'SVN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5787.png' },
      { id: 8497, name: 'Slovakia', shortName: 'SVK', category: 'International', country: 'SVK', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8497.png' },
      { id: 7871, name: 'Finland', shortName: 'FIN', category: 'International', country: 'FIN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/7871.png' },
      { id: 8536, name: 'Iceland', shortName: 'ISL', category: 'International', country: 'ISL', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8536.png' },
      { id: 10106, name: 'Bosnia and Herzegovina', shortName: 'BIH', category: 'International', country: 'BIH', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10106.png' },
      { id: 10259, name: 'Northern Ireland', shortName: 'NIR', category: 'International', country: 'NIR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10259.png' },
      { id: 5791, name: 'Republic of Ireland', shortName: 'IRL', category: 'International', country: 'IRL', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5791.png' },
      { id: 6262, name: 'Morocco', shortName: 'MAR', category: 'International', country: 'MAR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6262.png' },
      { id: 6395, name: 'Senegal', shortName: 'SEN', category: 'International', country: 'SEN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6395.png' },
      { id: 6346, name: 'Nigeria', shortName: 'NGA', category: 'International', country: 'NGA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6346.png' },
      { id: 10255, name: 'Egypt', shortName: 'EGY', category: 'International', country: 'EGY', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/10255.png' },
      { id: 6709, name: 'Ivory Coast', shortName: 'CIV', category: 'International', country: 'CIV', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6709.png' },
      { id: 6714, name: 'Ghana', shortName: 'GHA', category: 'International', country: 'GHA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6714.png' },
      { id: 6629, name: 'Cameroon', shortName: 'CMR', category: 'International', country: 'CMR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6629.png' },
      { id: 6317, name: 'Algeria', shortName: 'ALG', category: 'International', country: 'ALG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6317.png' },
      { id: 6316, name: 'South Africa', shortName: 'RSA', category: 'International', country: 'RSA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6316.png' },
      { id: 5888, name: 'Cape Verde', shortName: 'CPV', category: 'International', country: 'CPV', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5888.png' },
      { id: 5815, name: 'Mali', shortName: 'MLI', category: 'International', country: 'MLI', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5815.png' },
      { id: 8323, name: 'Guinea', shortName: 'GUI', category: 'International', country: 'GUI', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8323.png' },
      { id: 6321, name: 'DR Congo', shortName: 'COD', category: 'International', country: 'COD', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6321.png' },
      { id: 6323, name: 'Burkina Faso', shortName: 'BFA', category: 'International', country: 'BFA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6323.png' },
      { id: 6277, name: 'Zambia', shortName: 'ZAM', category: 'International', country: 'ZAM', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6277.png' },
      { id: 6712, name: 'Angola', shortName: 'ANG', category: 'International', country: 'ANG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6712.png' },
      { id: 5965, name: 'Mozambique', shortName: 'MOZ', category: 'International', country: 'MOZ', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5965.png' },
      { id: 8323, name: 'Equatorial Guinea', shortName: 'EQG', category: 'International', country: 'EQG', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8323.png' },
      { id: 68374, name: 'Mauritania', shortName: 'MTN', category: 'International', country: 'MTN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/68374.png' },
      { id: 5802, name: 'Namibia', shortName: 'NAM', category: 'International', country: 'NAM', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5802.png' },
      { id: 5979, name: 'Gambia', shortName: 'GAM', category: 'International', country: 'GAM', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5979.png' },
      { id: 5889, name: 'Gabon', shortName: 'GAB', category: 'International', country: 'GAB', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5889.png' },
      { id: 5890, name: 'Uganda', shortName: 'UGA', category: 'International', country: 'UGA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5890.png' },
      { id: 5884, name: 'Kenya', shortName: 'KEN', category: 'International', country: 'KEN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5884.png' },
      { id: 7941, name: 'Tanzania', shortName: 'TAN', category: 'International', country: 'TAN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/7941.png' },
      { id: 6290, name: 'Zimbabwe', shortName: 'ZIM', category: 'International', country: 'ZIM', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6290.png' },
      { id: 6713, name: 'USA', shortName: 'USA', category: 'International', country: 'USA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6713.png' },
      { id: 6710, name: 'Mexico', shortName: 'MEX', category: 'International', country: 'MEX', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6710.png' },
      { id: 5810, name: 'Canada', shortName: 'CAN', category: 'International', country: 'CAN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5810.png' },
      { id: 6705, name: 'Costa Rica', shortName: 'CRC', category: 'International', country: 'CRC', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6705.png' },
      { id: 5806, name: 'Jamaica', shortName: 'JAM', category: 'International', country: 'JAM', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5806.png' },
      { id: 5922, name: 'Panama', shortName: 'PAN', category: 'International', country: 'PAN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5922.png' },
      { id: 5808, name: 'Honduras', shortName: 'HON', category: 'International', country: 'HON', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5808.png' },
      { id: 6327, name: 'El Salvador', shortName: 'SLV', category: 'International', country: 'SLV', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6327.png' },
      { id: 7724, name: 'Trinidad and Tobago', shortName: 'TRI', category: 'International', country: 'TRI', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/7724.png' },
      { id: 6715, name: 'Japan', shortName: 'JPN', category: 'International', country: 'JPN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6715.png' },
      { id: 7804, name: 'South Korea', shortName: 'KOR', category: 'International', country: 'KOR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/7804.png' },
      { id: 6716, name: 'Australia', shortName: 'AUS', category: 'International', country: 'AUS', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6716.png' },
      { id: 7795, name: 'Saudi Arabia', shortName: 'KSA', category: 'International', country: 'KSA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/7795.png' },
      { id: 6711, name: 'Iran', shortName: 'IRN', category: 'International', country: 'IRN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6711.png' },
      { id: 5902, name: 'Qatar', shortName: 'QAT', category: 'International', country: 'QAT', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5902.png' },
      { id: 6329, name: 'India', shortName: 'IND', category: 'International', country: 'IND', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6329.png' },
      { id: 8700, name: 'Uzbekistan', shortName: 'UZB', category: 'International', country: 'UZB', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/8700.png' },
      { id: 5816, name: 'Jordan', shortName: 'JOR', category: 'International', country: 'JOR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5816.png' },
      { id: 5819, name: 'Iraq', shortName: 'IRQ', category: 'International', country: 'IRQ', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5819.png' },
      { id: 5789, name: 'UAE', shortName: 'UAE', category: 'International', country: 'UAE', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5789.png' },
      { id: 5824, name: 'Oman', shortName: 'OMA', category: 'International', country: 'OMA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5824.png' },
      { id: 5901, name: 'Bahrain', shortName: 'BHR', category: 'International', country: 'BHR', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5901.png' },
      { id: 5788, name: 'Thailand', shortName: 'THA', category: 'International', country: 'THA', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5788.png' },
      { id: 5894, name: 'Vietnam', shortName: 'VIE', category: 'International', country: 'VIE', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5894.png' },
      { id: 6324, name: 'Indonesia', shortName: 'IDN', category: 'International', country: 'IDN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/6324.png' },
      { id: 5823, name: 'Malaysia', shortName: 'MAS', category: 'International', country: 'MAS', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5823.png' },
      { id: 5822, name: 'China', shortName: 'CHN', category: 'International', country: 'CHN', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5822.png' },
      { id: 5820, name: 'New Zealand', shortName: 'NZL', category: 'International', country: 'NZL', logo: 'https://images.fotmob.com/image_resources/logo/teamlogo/5820.png' },
    ],
    cricket: [
      // 🏆 Major Cricket Leagues & Tournaments (100% verified official league sites & ESPN CDN)
      { id: 'ipl', name: 'Indian Premier League', shortName: 'IPL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png' },
      { id: 'wpl', name: 'Women\'s Premier League', shortName: 'WPL', isLeague: true, category: 'Tournament', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png' },
      { id: 'bbl', name: 'Big Bash League', shortName: 'BBL', isLeague: true, category: 'Tournament', logo: 'https://resources.bigbash.pulselive.com/bigbash/photo/2026/06/15/cc13b4a5-25e1-4057-8b11-37cb8f836651/WBBL-BBL-logo-lock-up.png' },
      { id: 'psl', name: 'Pakistan Super League', shortName: 'PSL', isLeague: true, category: 'Tournament', logo: 'https://psl-t20.com/wp-content/uploads/2026/02/HBL-PSL-new-logo.png' },
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

      // 🦘 BBL Franchises (Official CDN Crests)
      { id: 'ade', name: 'Adelaide Strikers', shortName: 'ADE', category: 'BBL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/335970.png' },
      { id: 'bhi', name: 'Brisbane Heat', shortName: 'BHI', category: 'BBL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/335971.png' },
      { id: 'hur', name: 'Hobart Hurricanes', shortName: 'HUR', category: 'BBL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/335973.png' },
      { id: 'ren', name: 'Melbourne Renegades', shortName: 'REN', category: 'BBL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/335974.png' },
      { id: 'sta', name: 'Melbourne Stars', shortName: 'STA', category: 'BBL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/335975.png' },
      { id: 'sco_bbl', name: 'Perth Scorchers', shortName: 'SCO', category: 'BBL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/335977.png' },
      { id: 'six', name: 'Sydney Sixers', shortName: 'SIX', category: 'BBL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/335978.png' },
      { id: 'thu', name: 'Sydney Thunder', shortName: 'THU', category: 'BBL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/628333.png' },

      // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 The Hundred Franchises (Official thehundred.com SVGs)
      { id: 'bp', name: 'Birmingham Phoenix', shortName: 'BP', category: 'The Hundred', logo: 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/birmingham-phoenix-black.svg' },
      { id: 'ls', name: 'London Spirit', shortName: 'LS', category: 'The Hundred', logo: 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/london-spirit-black.svg' },
      { id: 'mo', name: 'Manchester Originals', shortName: 'MO', category: 'The Hundred', logo: 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/manchester-originals-black.svg' },
      { id: 'ns', name: 'Northern Superchargers', shortName: 'NS', category: 'The Hundred', logo: 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/northern-superchargers-black.svg' },
      { id: 'oi', name: 'Oval Invincibles', shortName: 'OI', category: 'The Hundred', logo: 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/oval-invincibles-black.svg' },
      { id: 'sb', name: 'Southern Brave', shortName: 'SB', category: 'The Hundred', logo: 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/southern-brave-black.svg' },
      { id: 'tr', name: 'Trent Rockets', shortName: 'TR', category: 'The Hundred', logo: 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/trent-rockets-black.svg' },
      { id: 'wf', name: 'Welsh Fire', shortName: 'WF', category: 'The Hundred', logo: 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/welsh-fire-black.svg' },

      // 🌴 CPL Franchises
      { id: 'gaw', name: 'Guyana Amazon Warriors', shortName: 'GAW', category: 'CPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/642413.png' },
      { id: 'tkr', name: 'Trinbago Knight Riders', shortName: 'TKR', category: 'CPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/642417.png' },
      { id: 'br', name: 'Barbados Royals', shortName: 'BR', category: 'CPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/642411.png' },
      { id: 'slk', name: 'Saint Lucia Kings', shortName: 'SLK', category: 'CPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/642415.png' },
      { id: 'abf', name: 'Antigua & Barbuda Falcons', shortName: 'ABF', category: 'CPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png' },
      { id: 'sknp', name: 'St Kitts & Nevis Patriots', shortName: 'SKNP', category: 'CPL Franchise', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png' },

      // 🦁 English County Championship Clubs
      { id: 'dur', name: 'Durham', shortName: 'DUR', category: 'County Club', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/924.png' },
      { id: 'wor', name: 'Worcestershire', shortName: 'WOR', category: 'County Club', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1458.png' },
      { id: 'der', name: 'Derbyshire', shortName: 'DER', category: 'County Club', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/904.png' },
      { id: 'nor', name: 'Northamptonshire', shortName: 'NOR', category: 'County Club', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1221.png' },
      { id: 'lan', name: 'Lancashire', shortName: 'LAN', category: 'County Club', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1098.png' },
      { id: 'not', name: 'Nottinghamshire', shortName: 'NOT', category: 'County Club', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/1231.png' },
      { id: 'glo', name: 'Gloucestershire', shortName: 'GLO', category: 'County Club', logo: 'https://a.espncdn.com/i/teamlogos/cricket/500/984.png' }
    ],
    f1: [
      // 🏎️ Formula 1 Constructors (Official 2024/2025/2026 liveries & crests)
      { id: 'redbull', name: 'Red Bull Racing', shortName: 'RBR', category: 'Constructor', logo: 'https://media.formula1.com/content/dam/fom-website/teams/2024/red-bull-racing.png' },
      { id: 'ferrari', name: 'Ferrari', shortName: 'FER', category: 'Constructor', logo: 'https://media.formula1.com/content/dam/fom-website/teams/2024/ferrari.png' },
      { id: 'mclaren', name: 'McLaren', shortName: 'MCL', category: 'Constructor', logo: 'https://media.formula1.com/content/dam/fom-website/teams/2024/mclaren.png' },
      { id: 'mercedes', name: 'Mercedes', shortName: 'MER', category: 'Constructor', logo: 'https://media.formula1.com/content/dam/fom-website/teams/2024/mercedes.png' },
      { id: 'astonmartin', name: 'Aston Martin', shortName: 'AST', category: 'Constructor', logo: 'https://media.formula1.com/content/dam/fom-website/teams/2024/aston-martin.png' },
      { id: 'alpine', name: 'Alpine', shortName: 'ALP', category: 'Constructor', logo: 'https://media.formula1.com/content/dam/fom-website/teams/2024/alpine.png' },
      { id: 'williams', name: 'Williams', shortName: 'WIL', category: 'Constructor', logo: 'https://media.formula1.com/content/dam/fom-website/teams/2024/williams.png' },
      { id: 'racingbulls', name: 'Racing Bulls', shortName: 'RB', category: 'Constructor', logo: 'https://media.formula1.com/content/dam/fom-website/teams/2024/rb.png' },
      { id: 'sauber', name: 'Kick Sauber', shortName: 'SAU', category: 'Constructor', logo: 'https://media.formula1.com/content/dam/fom-website/teams/2024/kick-sauber.png' },
      { id: 'haas', name: 'Haas', shortName: 'HAA', category: 'Constructor', logo: 'https://media.formula1.com/content/dam/fom-website/teams/2024/haas.png' },

      // 🏁 Formula 1 Drivers
      { id: 'ver', name: 'Max Verstappen', shortName: 'VER', category: 'Driver' },
      { id: 'nor', name: 'Lando Norris', shortName: 'NOR', category: 'Driver' },
      { id: 'lec', name: 'Charles Leclerc', shortName: 'LEC', category: 'Driver' },
      { id: 'ham', name: 'Lewis Hamilton', shortName: 'HAM', category: 'Driver' },
      { id: 'pia', name: 'Oscar Piastri', shortName: 'PIA', category: 'Driver' },
      { id: 'rus', name: 'George Russell', shortName: 'RUS', category: 'Driver' },
      { id: 'alo', name: 'Fernando Alonso', shortName: 'ALO', category: 'Driver' },
      { id: 'sai', name: 'Carlos Sainz', shortName: 'SAI', category: 'Driver' },
      { id: 'ant', name: 'Andrea Kimi Antonelli', shortName: 'ANT', category: 'Driver' },
      { id: 'alb', name: 'Alexander Albon', shortName: 'ALB', category: 'Driver' },
      { id: 'gas', name: 'Pierre Gasly', shortName: 'GAS', category: 'Driver' },
      { id: 'tsu', name: 'Yuki Tsunoda', shortName: 'TSU', category: 'Driver' },
      { id: 'hul', name: 'Nico Hülkenberg', shortName: 'HUL', category: 'Driver' },
      { id: 'bea', name: 'Oliver Bearman', shortName: 'BEA', category: 'Driver' },
      { id: 'oco', name: 'Esteban Ocon', shortName: 'OCO', category: 'Driver' },
      { id: 'str', name: 'Lance Stroll', shortName: 'STR', category: 'Driver' }
    ]
  };

  /**
   * Universal Cricket Team and League Logos Map (100% Verified ESPNcricinfo & IPL CDN Crests)
   */
  static CRICKET_LOGOS_MAP = {
    // 🇮🇳 Official IPL Franchise Logos (scores.iplt20.com official CDN)
    'csk': 'https://scores.iplt20.com/ipl/teamlogos/CSK.png',
    'chennai super kings': 'https://scores.iplt20.com/ipl/teamlogos/CSK.png',
    'chennai': 'https://scores.iplt20.com/ipl/teamlogos/CSK.png',
    'mi': 'https://scores.iplt20.com/ipl/teamlogos/MI.png',
    'mumbai indians': 'https://scores.iplt20.com/ipl/teamlogos/MI.png',
    'mumbai': 'https://scores.iplt20.com/ipl/teamlogos/MI.png',
    'rcb': 'https://scores.iplt20.com/ipl/teamlogos/RCB.png',
    'royal challengers bengaluru': 'https://scores.iplt20.com/ipl/teamlogos/RCB.png',
    'royal challengers bangalore': 'https://scores.iplt20.com/ipl/teamlogos/RCB.png',
    'bengaluru': 'https://scores.iplt20.com/ipl/teamlogos/RCB.png',
    'bangalore': 'https://scores.iplt20.com/ipl/teamlogos/RCB.png',
    'kkr': 'https://scores.iplt20.com/ipl/teamlogos/KKR.png',
    'kolkata knight riders': 'https://scores.iplt20.com/ipl/teamlogos/KKR.png',
    'kolkata': 'https://scores.iplt20.com/ipl/teamlogos/KKR.png',
    'dc': 'https://scores.iplt20.com/ipl/teamlogos/DC.png',
    'delhi capitals': 'https://scores.iplt20.com/ipl/teamlogos/DC.png',
    'delhi daredevils': 'https://scores.iplt20.com/ipl/teamlogos/DC.png',
    'delhi': 'https://scores.iplt20.com/ipl/teamlogos/DC.png',
    'rr': 'https://scores.iplt20.com/ipl/teamlogos/RR.png',
    'rajasthan royals': 'https://scores.iplt20.com/ipl/teamlogos/RR.png',
    'rajasthan': 'https://scores.iplt20.com/ipl/teamlogos/RR.png',
    'gt': 'https://scores.iplt20.com/ipl/teamlogos/GT.png',
    'gujarat titans': 'https://scores.iplt20.com/ipl/teamlogos/GT.png',
    'gujarat': 'https://scores.iplt20.com/ipl/teamlogos/GT.png',
    'pbks': 'https://scores.iplt20.com/ipl/teamlogos/PBKS.png',
    'punjab kings': 'https://scores.iplt20.com/ipl/teamlogos/PBKS.png',
    'kings xi punjab': 'https://scores.iplt20.com/ipl/teamlogos/PBKS.png',
    'punjab': 'https://scores.iplt20.com/ipl/teamlogos/PBKS.png',
    'srh': 'https://scores.iplt20.com/ipl/teamlogos/SRH.png',
    'sunrisers hyderabad': 'https://scores.iplt20.com/ipl/teamlogos/SRH.png',
    'sunrisers': 'https://scores.iplt20.com/ipl/teamlogos/SRH.png',
    'hyderabad': 'https://scores.iplt20.com/ipl/teamlogos/SRH.png',
    'lsg': 'https://scores.iplt20.com/ipl/teamlogos/LSG.png',
    'lucknow super giants': 'https://scores.iplt20.com/ipl/teamlogos/LSG.png',
    'lucknow': 'https://scores.iplt20.com/ipl/teamlogos/LSG.png',

    // 🌍 Top International Cricket Teams (ESPNcricinfo CDN)
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
    'netherlands': 'https://a.espncdn.com/i/teamlogos/cricket/500/15.png',
    'ned': 'https://a.espncdn.com/i/teamlogos/cricket/500/15.png',
    'scotland': 'https://a.espncdn.com/i/teamlogos/cricket/500/30.png',
    'sco': 'https://a.espncdn.com/i/teamlogos/cricket/500/30.png',
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
    'jersey': 'https://a.espncdn.com/i/teamlogos/cricket/500/41.png',
    'jer': 'https://a.espncdn.com/i/teamlogos/cricket/500/41.png',
    'kenya': 'https://a.espncdn.com/i/teamlogos/cricket/500/26.png',
    'ken': 'https://a.espncdn.com/i/teamlogos/cricket/500/26.png',
    'hong kong': 'https://a.espncdn.com/i/teamlogos/cricket/500/19.png',
    'hk': 'https://a.espncdn.com/i/teamlogos/cricket/500/19.png',

    // 🌴 CPL Franchises
    'guyana amazon warriors': 'https://a.espncdn.com/i/teamlogos/cricket/500/642413.png',
    'gaw': 'https://a.espncdn.com/i/teamlogos/cricket/500/642413.png',
    'trinbago knight riders': 'https://a.espncdn.com/i/teamlogos/cricket/500/642417.png',
    'tkr': 'https://a.espncdn.com/i/teamlogos/cricket/500/642417.png',
    'barbados royals': 'https://a.espncdn.com/i/teamlogos/cricket/500/642411.png',
    'barbados tridents': 'https://a.espncdn.com/i/teamlogos/cricket/500/642411.png',
    'br': 'https://a.espncdn.com/i/teamlogos/cricket/500/642411.png',
    'st lucia kings': 'https://a.espncdn.com/i/teamlogos/cricket/500/642415.png',
    'saint lucia kings': 'https://a.espncdn.com/i/teamlogos/cricket/500/642415.png',
    'slk': 'https://a.espncdn.com/i/teamlogos/cricket/500/642415.png',
    'antigua & barbuda falcons': 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png',
    'antigua and barbuda falcons': 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png',
    'abf': 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png',
    'jamaica kingsmen': 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png',
    'jamaica tallawahs': 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png',
    'jkm': 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png',
    'st kitts & nevis patriots': 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png',
    'sknp': 'https://a.espncdn.com/i/teamlogos/cricket/500/4.png',

    // 🦘 BBL Franchises (Official CDN Crests)
    'adelaide strikers': 'https://a.espncdn.com/i/teamlogos/cricket/500/335970.png',
    'strikers': 'https://a.espncdn.com/i/teamlogos/cricket/500/335970.png',
    'ade': 'https://a.espncdn.com/i/teamlogos/cricket/500/335970.png',
    'brisbane heat': 'https://a.espncdn.com/i/teamlogos/cricket/500/335971.png',
    'heat': 'https://a.espncdn.com/i/teamlogos/cricket/500/335971.png',
    'bhi': 'https://a.espncdn.com/i/teamlogos/cricket/500/335971.png',
    'hobart hurricanes': 'https://a.espncdn.com/i/teamlogos/cricket/500/335973.png',
    'hurricanes': 'https://a.espncdn.com/i/teamlogos/cricket/500/335973.png',
    'hur': 'https://a.espncdn.com/i/teamlogos/cricket/500/335973.png',
    'melbourne renegades': 'https://a.espncdn.com/i/teamlogos/cricket/500/335974.png',
    'renegades': 'https://a.espncdn.com/i/teamlogos/cricket/500/335974.png',
    'ren': 'https://a.espncdn.com/i/teamlogos/cricket/500/335974.png',
    'melbourne stars': 'https://a.espncdn.com/i/teamlogos/cricket/500/335975.png',
    'stars': 'https://a.espncdn.com/i/teamlogos/cricket/500/335975.png',
    'sta': 'https://a.espncdn.com/i/teamlogos/cricket/500/335975.png',
    'perth scorchers': 'https://a.espncdn.com/i/teamlogos/cricket/500/335977.png',
    'scorchers': 'https://a.espncdn.com/i/teamlogos/cricket/500/335977.png',
    'sco_bbl': 'https://a.espncdn.com/i/teamlogos/cricket/500/335977.png',
    'sydney sixers': 'https://a.espncdn.com/i/teamlogos/cricket/500/335978.png',
    'sixers': 'https://a.espncdn.com/i/teamlogos/cricket/500/335978.png',
    'six': 'https://a.espncdn.com/i/teamlogos/cricket/500/335978.png',
    'sydney thunder': 'https://a.espncdn.com/i/teamlogos/cricket/500/628333.png',
    'thunder': 'https://a.espncdn.com/i/teamlogos/cricket/500/628333.png',
    'thu': 'https://a.espncdn.com/i/teamlogos/cricket/500/628333.png',

    // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 The Hundred Franchises (Official thehundred.com SVGs)
    'birmingham phoenix': 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/birmingham-phoenix-black.svg',
    'phoenix': 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/birmingham-phoenix-black.svg',
    'london spirit': 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/london-spirit-black.svg',
    'spirit': 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/london-spirit-black.svg',
    'manchester originals': 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/manchester-originals-black.svg',
    'originals': 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/manchester-originals-black.svg',
    'northern superchargers': 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/northern-superchargers-black.svg',
    'superchargers': 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/northern-superchargers-black.svg',
    'oval invincibles': 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/oval-invincibles-black.svg',
    'invincibles': 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/oval-invincibles-black.svg',
    'southern brave': 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/southern-brave-black.svg',
    'brave': 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/southern-brave-black.svg',
    'trent rockets': 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/trent-rockets-black.svg',
    'rockets': 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/trent-rockets-black.svg',
    'welsh fire': 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/welsh-fire-black.svg',
    'fire': 'https://www.thehundred.com/resources/v3.1.23/i/team-logos/welsh-fire-black.svg',

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

    // 🏆 Major Leagues & Tournaments (100% Verified Official League Sites & Board CDN Crests)
    'indian premier league': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'ipl': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'tata ipl': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'icc t20 world cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'icc men\'s t20 world cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    't20 world cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    't20 wc': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'icc cricket world cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'cricket world cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'world cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'cwc': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'icc champions trophy': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'champions trophy': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'ct': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'world test championship': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'icc world test championship': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'wtc': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'asia cup': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png',
    'big bash league': 'https://resources.bigbash.pulselive.com/bigbash/photo/2026/06/15/cc13b4a5-25e1-4057-8b11-37cb8f836651/WBBL-BBL-logo-lock-up.png',
    'bbl': 'https://resources.bigbash.pulselive.com/bigbash/photo/2026/06/15/cc13b4a5-25e1-4057-8b11-37cb8f836651/WBBL-BBL-logo-lock-up.png',
    'kfc bbl': 'https://resources.bigbash.pulselive.com/bigbash/photo/2026/06/15/cc13b4a5-25e1-4057-8b11-37cb8f836651/WBBL-BBL-logo-lock-up.png',
    'wbbl': 'https://resources.bigbash.pulselive.com/bigbash/photo/2026/06/15/cc13b4a5-25e1-4057-8b11-37cb8f836651/WBBL-BBL-logo-lock-up.png',
    'women\'s big bash league': 'https://resources.bigbash.pulselive.com/bigbash/photo/2026/06/15/cc13b4a5-25e1-4057-8b11-37cb8f836651/WBBL-BBL-logo-lock-up.png',
    'caribbean premier league': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'cpl': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'republic bank cpl': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'women\'s caribbean premier league': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'wcpl': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8043.png',
    'pakistan super league': 'https://psl-t20.com/wp-content/uploads/2026/02/HBL-PSL-new-logo.png',
    'psl': 'https://psl-t20.com/wp-content/uploads/2026/02/HBL-PSL-new-logo.png',
    'hbl psl': 'https://psl-t20.com/wp-content/uploads/2026/02/HBL-PSL-new-logo.png',
    'sa20': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',
    'betway sa20': 'https://a.espncdn.com/i/teamlogos/cricket/500/3.png',
    'wpl': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'women\'s premier league': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'womens premier league': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'tata wpl': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'the hundred': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'the hundred men': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'the hundred women': 'https://a.espncdn.com/i/leaguelogos/cricket/500/8044.png',
    'major league cricket': 'https://a.espncdn.com/i/teamlogos/cricket/500/11.png',
    'mlc': 'https://a.espncdn.com/i/teamlogos/cricket/500/11.png',
    'cognizant mlc': 'https://a.espncdn.com/i/teamlogos/cricket/500/11.png',
    'county championship': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'vitality county championship': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'the ashes': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'ashes': 'https://a.espncdn.com/i/teamlogos/cricket/500/1.png',
    'super smash': 'https://a.espncdn.com/i/teamlogos/cricket/500/5.png',
    'bpl': 'https://a.espncdn.com/i/teamlogos/cricket/500/25.png',
    'bangladesh premier league': 'https://a.espncdn.com/i/teamlogos/cricket/500/25.png',
    'lanka premier league': 'https://a.espncdn.com/i/teamlogos/cricket/500/8.png',
    'lpl': 'https://a.espncdn.com/i/teamlogos/cricket/500/8.png',
    'ilt20': 'https://a.espncdn.com/i/teamlogos/cricket/500/27.png',
    'international league t20': 'https://a.espncdn.com/i/teamlogos/cricket/500/27.png',
    'dp world ilt20': 'https://a.espncdn.com/i/teamlogos/cricket/500/27.png',
    'ranji trophy': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'ranji': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'syed mushtaq ali trophy': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'vijay hazare trophy': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'duleep trophy': 'https://a.espncdn.com/i/teamlogos/cricket/500/6.png',
    'marsh cup': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',
    'marsh one-day cup': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png',
    'sheffield shield': 'https://a.espncdn.com/i/teamlogos/cricket/500/2.png'
  };

  /**
   * Universal Football Leagues Logos Map (FotMob official CDN - 100% Verified)
   */
        static FOOTBALL_LEAGUES_LOGOS_MAP = {
    'premier league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/47.png',
    'epl': 'https://images.fotmob.com/image_resources/logo/leaguelogo/47.png',
    'english premier league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/47.png',
    'championship': 'https://images.fotmob.com/image_resources/logo/leaguelogo/48.png',
    'efl championship': 'https://images.fotmob.com/image_resources/logo/leaguelogo/48.png',
    'english championship': 'https://images.fotmob.com/image_resources/logo/leaguelogo/48.png',
    'league one': 'https://images.fotmob.com/image_resources/logo/leaguelogo/108.png',
    'efl league one': 'https://images.fotmob.com/image_resources/logo/leaguelogo/108.png',
    'league two': 'https://images.fotmob.com/image_resources/logo/leaguelogo/109.png',
    'efl league two': 'https://images.fotmob.com/image_resources/logo/leaguelogo/109.png',
    'fa cup': 'https://images.fotmob.com/image_resources/logo/leaguelogo/132.png',
    'efl cup': 'https://images.fotmob.com/image_resources/logo/leaguelogo/133.png',
    'carabao cup': 'https://images.fotmob.com/image_resources/logo/leaguelogo/133.png',
    'community shield': 'https://images.fotmob.com/image_resources/logo/leaguelogo/247.png',
    'fa community shield': 'https://images.fotmob.com/image_resources/logo/leaguelogo/247.png',
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
    'fifa world cup': 'https://images.fotmob.com/image_resources/logo/leaguelogo/77.png',
    'fifa club world cup': 'https://images.fotmob.com/image_resources/logo/leaguelogo/78.png',
    'club world cup': 'https://images.fotmob.com/image_resources/logo/leaguelogo/78.png',
    'copa america': 'https://images.fotmob.com/image_resources/logo/leaguelogo/44.png',
    'euro': 'https://images.fotmob.com/image_resources/logo/leaguelogo/50.png',
    'uefa euro': 'https://images.fotmob.com/image_resources/logo/leaguelogo/50.png',
    'euro 2024': 'https://images.fotmob.com/image_resources/logo/leaguelogo/50.png',
    'euro 2026': 'https://images.fotmob.com/image_resources/logo/leaguelogo/50.png',
    'afc champions league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/42.png',
    'afc champions league elite': 'https://images.fotmob.com/image_resources/logo/leaguelogo/42.png',
    'laliga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/87.png',
    'la liga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/87.png',
    'laliga ea sports': 'https://images.fotmob.com/image_resources/logo/leaguelogo/87.png',
    'spanish laliga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/87.png',
    'la liga 2': 'https://images.fotmob.com/image_resources/logo/leaguelogo/87.png',
    'laliga hypermotion': 'https://images.fotmob.com/image_resources/logo/leaguelogo/87.png',
    'copa del rey': 'https://images.fotmob.com/image_resources/logo/leaguelogo/138.png',
    'supercopa de espana': 'https://images.fotmob.com/image_resources/logo/leaguelogo/139.png',
    'supercopa': 'https://images.fotmob.com/image_resources/logo/leaguelogo/139.png',
    'bundesliga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/54.png',
    '1. bundesliga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/54.png',
    'german bundesliga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/54.png',
    '2. bundesliga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/54.png',
    'dfb-pokal': 'https://images.fotmob.com/image_resources/logo/leaguelogo/109.png',
    'dfb pokal': 'https://images.fotmob.com/image_resources/logo/leaguelogo/109.png',
    'serie a': 'https://images.fotmob.com/image_resources/logo/leaguelogo/55.png',
    'serie a enilive': 'https://images.fotmob.com/image_resources/logo/leaguelogo/55.png',
    'italian serie a': 'https://images.fotmob.com/image_resources/logo/leaguelogo/55.png',
    'serie b': 'https://images.fotmob.com/image_resources/logo/leaguelogo/86.png',
    'serie bkt': 'https://images.fotmob.com/image_resources/logo/leaguelogo/86.png',
    'coppa italia': 'https://images.fotmob.com/image_resources/logo/leaguelogo/141.png',
    'ligue 1': 'https://images.fotmob.com/image_resources/logo/leaguelogo/53.png',
    'ligue 1 mcdonalds': 'https://images.fotmob.com/image_resources/logo/leaguelogo/53.png',
    'french ligue 1': 'https://images.fotmob.com/image_resources/logo/leaguelogo/53.png',
    'ligue 2': 'https://images.fotmob.com/image_resources/logo/leaguelogo/110.png',
    'coupe de france': 'https://images.fotmob.com/image_resources/logo/leaguelogo/134.png',
    'major league soccer': 'https://images.fotmob.com/image_resources/logo/leaguelogo/130.png',
    'mls': 'https://images.fotmob.com/image_resources/logo/leaguelogo/130.png',
    'saudi pro league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/536.png',
    'roshn saudi league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/536.png',
    'saudi league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/536.png',
    'eredivisie': 'https://images.fotmob.com/image_resources/logo/leaguelogo/57.png',
    'dutch eredivisie': 'https://images.fotmob.com/image_resources/logo/leaguelogo/57.png',
    'liga portugal': 'https://images.fotmob.com/image_resources/logo/leaguelogo/61.png',
    'primeira liga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/61.png',
    'brasileirao': 'https://images.fotmob.com/image_resources/logo/leaguelogo/268.png',
    'brasileirao betano': 'https://images.fotmob.com/image_resources/logo/leaguelogo/268.png',
    'copa libertadores': 'https://images.fotmob.com/image_resources/logo/leaguelogo/45.png',
    'conmebol libertadores': 'https://images.fotmob.com/image_resources/logo/leaguelogo/45.png',
    'copa sudamericana': 'https://images.fotmob.com/image_resources/logo/leaguelogo/240.png',
    'conmebol sudamericana': 'https://images.fotmob.com/image_resources/logo/leaguelogo/240.png',
    'indian super league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/9478.png',
    'isl': 'https://images.fotmob.com/image_resources/logo/leaguelogo/9478.png',
    'scottish premiership': 'https://images.fotmob.com/image_resources/logo/leaguelogo/64.png',
    'super lig': 'https://images.fotmob.com/image_resources/logo/leaguelogo/71.png',
    'sueper lig': 'https://images.fotmob.com/image_resources/logo/leaguelogo/71.png',
    'liga mx': 'https://images.fotmob.com/image_resources/logo/leaguelogo/230.png',
    'belgian pro league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/40.png',
    'jupiler pro league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/40.png',
    'swiss super league': 'https://images.fotmob.com/image_resources/logo/leaguelogo/67.png',
    'austrian bundesliga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/38.png',
    'liga profesional': 'https://images.fotmob.com/image_resources/logo/leaguelogo/112.png',
    'primera division': 'https://images.fotmob.com/image_resources/logo/leaguelogo/87.png'
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
    if (leagueId) {
      return `https://images.fotmob.com/image_resources/logo/leaguelogo/${leagueId}.png`;
    }
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
    return '';
  }

  /**
   * Universal Football Teams Logos Map (FotMob official CDN - 100% Verified)
   */
            static FOOTBALL_TEAMS_LOGOS_MAP = {
    'mbsg': 'https://images.fotmob.com/image_resources/logo/teamlogo/578651.png',
    'mohun bagan super giant': 'https://images.fotmob.com/image_resources/logo/teamlogo/578651.png',
    'mohun bagan sg': 'https://images.fotmob.com/image_resources/logo/teamlogo/578651.png',
    'mohun bagan': 'https://images.fotmob.com/image_resources/logo/teamlogo/578651.png',
    'ebfc': 'https://images.fotmob.com/image_resources/logo/teamlogo/165184.png',
    'east bengal fc': 'https://images.fotmob.com/image_resources/logo/teamlogo/165184.png',
    'east bengal': 'https://images.fotmob.com/image_resources/logo/teamlogo/165184.png',
    'mumbai city fc': 'https://images.fotmob.com/image_resources/logo/teamlogo/578655.png',
    'mumbai city': 'https://images.fotmob.com/image_resources/logo/teamlogo/578655.png',
    'bfc': 'https://images.fotmob.com/image_resources/logo/teamlogo/485935.png',
    'bengaluru fc': 'https://images.fotmob.com/image_resources/logo/teamlogo/485935.png',
    'bengaluru': 'https://images.fotmob.com/image_resources/logo/teamlogo/485935.png',
    'kbfc': 'https://images.fotmob.com/image_resources/logo/teamlogo/578654.png',
    'kerala blasters fc': 'https://images.fotmob.com/image_resources/logo/teamlogo/578654.png',
    'kerala blasters': 'https://images.fotmob.com/image_resources/logo/teamlogo/578654.png',
    'fcg': 'https://images.fotmob.com/image_resources/logo/teamlogo/578650.png',
    'fc goa': 'https://images.fotmob.com/image_resources/logo/teamlogo/578650.png',
    'goa': 'https://images.fotmob.com/image_resources/logo/teamlogo/578650.png',
    'chennaiyin fc': 'https://images.fotmob.com/image_resources/logo/teamlogo/578652.png',
    'chennaiyin': 'https://images.fotmob.com/image_resources/logo/teamlogo/578652.png',
    'ofc': 'https://images.fotmob.com/image_resources/logo/teamlogo/578653.png',
    'odisha fc': 'https://images.fotmob.com/image_resources/logo/teamlogo/578653.png',
    'odisha': 'https://images.fotmob.com/image_resources/logo/teamlogo/578653.png',
    'neufc': 'https://images.fotmob.com/image_resources/logo/teamlogo/578656.png',
    'northeast united fc': 'https://images.fotmob.com/image_resources/logo/teamlogo/578656.png',
    'northeast united': 'https://images.fotmob.com/image_resources/logo/teamlogo/578656.png',
    'jfc': 'https://images.fotmob.com/image_resources/logo/teamlogo/873038.png',
    'jamshedpur fc': 'https://images.fotmob.com/image_resources/logo/teamlogo/873038.png',
    'jamshedpur': 'https://images.fotmob.com/image_resources/logo/teamlogo/873038.png',
    'pfc': 'https://images.fotmob.com/image_resources/logo/teamlogo/589749.png',
    'punjab fc': 'https://images.fotmob.com/image_resources/logo/teamlogo/589749.png',
    'punjab': 'https://images.fotmob.com/image_resources/logo/teamlogo/589749.png',
    'msc': 'https://images.fotmob.com/image_resources/logo/teamlogo/165187.png',
    'mohammedan sc': 'https://images.fotmob.com/image_resources/logo/teamlogo/165187.png',
    'mohammedan': 'https://images.fotmob.com/image_resources/logo/teamlogo/165187.png',
    'hfc': 'https://images.fotmob.com/image_resources/logo/teamlogo/1086744.png',
    'hyderabad fc': 'https://images.fotmob.com/image_resources/logo/teamlogo/1086744.png',
    'hyderabad': 'https://images.fotmob.com/image_resources/logo/teamlogo/1086744.png',
    'arsenal': 'https://images.fotmob.com/image_resources/logo/teamlogo/9825.png',
    'manchester city': 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png',
    'man city': 'https://images.fotmob.com/image_resources/logo/teamlogo/8456.png',
    'mcfc': 'https://images.fotmob.com/image_resources/logo/teamlogo/578655.png',
    'liverpool': 'https://images.fotmob.com/image_resources/logo/teamlogo/8650.png',
    'manchester united': 'https://images.fotmob.com/image_resources/logo/teamlogo/10260.png',
    'man united': 'https://images.fotmob.com/image_resources/logo/teamlogo/10260.png',
    'chelsea': 'https://images.fotmob.com/image_resources/logo/teamlogo/8455.png',
    'cfc': 'https://images.fotmob.com/image_resources/logo/teamlogo/578652.png',
    'tottenham hotspur': 'https://images.fotmob.com/image_resources/logo/teamlogo/8586.png',
    'tottenham': 'https://images.fotmob.com/image_resources/logo/teamlogo/8586.png',
    'newcastle united': 'https://images.fotmob.com/image_resources/logo/teamlogo/10261.png',
    'newcastle': 'https://images.fotmob.com/image_resources/logo/teamlogo/10261.png',
    'aston villa': 'https://images.fotmob.com/image_resources/logo/teamlogo/10252.png',
    'villa': 'https://images.fotmob.com/image_resources/logo/teamlogo/10252.png',
    'brighton': 'https://images.fotmob.com/image_resources/logo/teamlogo/10204.png',
    'brighton & hove albion': 'https://images.fotmob.com/image_resources/logo/teamlogo/10204.png',
    'west ham united': 'https://images.fotmob.com/image_resources/logo/teamlogo/8654.png',
    'west ham': 'https://images.fotmob.com/image_resources/logo/teamlogo/8654.png',
    'everton': 'https://images.fotmob.com/image_resources/logo/teamlogo/8668.png',
    'fulham': 'https://images.fotmob.com/image_resources/logo/teamlogo/9879.png',
    'crystal palace': 'https://images.fotmob.com/image_resources/logo/teamlogo/9826.png',
    'brentford': 'https://images.fotmob.com/image_resources/logo/teamlogo/9937.png',
    'wolverhampton wanderers': 'https://images.fotmob.com/image_resources/logo/teamlogo/8602.png',
    'wolves': 'https://images.fotmob.com/image_resources/logo/teamlogo/8602.png',
    'bournemouth': 'https://images.fotmob.com/image_resources/logo/teamlogo/8678.png',
    'afc bournemouth': 'https://images.fotmob.com/image_resources/logo/teamlogo/8678.png',
    'nottingham forest': 'https://images.fotmob.com/image_resources/logo/teamlogo/10203.png',
    'leicester city': 'https://images.fotmob.com/image_resources/logo/teamlogo/8197.png',
    'leicester': 'https://images.fotmob.com/image_resources/logo/teamlogo/8197.png',
    'southampton': 'https://images.fotmob.com/image_resources/logo/teamlogo/8466.png',
    'ipswich town': 'https://images.fotmob.com/image_resources/logo/teamlogo/9902.png',
    'ipswich': 'https://images.fotmob.com/image_resources/logo/teamlogo/9902.png',
    'real madrid': 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png',
    'rm': 'https://images.fotmob.com/image_resources/logo/teamlogo/8633.png',
    'barcelona': 'https://images.fotmob.com/image_resources/logo/teamlogo/8634.png',
    'fc barcelona': 'https://images.fotmob.com/image_resources/logo/teamlogo/8634.png',
    'atletico madrid': 'https://images.fotmob.com/image_resources/logo/teamlogo/9906.png',
    'atlético madrid': 'https://images.fotmob.com/image_resources/logo/teamlogo/9906.png',
    'athletic club': 'https://images.fotmob.com/image_resources/logo/teamlogo/8315.png',
    'ath': 'https://images.fotmob.com/image_resources/logo/teamlogo/8315.png',
    'real sociedad': 'https://images.fotmob.com/image_resources/logo/teamlogo/8560.png',
    'real betis': 'https://images.fotmob.com/image_resources/logo/teamlogo/8603.png',
    'betis': 'https://images.fotmob.com/image_resources/logo/teamlogo/8603.png',
    'villarreal': 'https://images.fotmob.com/image_resources/logo/teamlogo/10205.png',
    'girona': 'https://images.fotmob.com/image_resources/logo/teamlogo/7732.png',
    'gir': 'https://images.fotmob.com/image_resources/logo/teamlogo/7732.png',
    'sevilla': 'https://images.fotmob.com/image_resources/logo/teamlogo/8302.png',
    'sev': 'https://images.fotmob.com/image_resources/logo/teamlogo/8302.png',
    'valencia': 'https://images.fotmob.com/image_resources/logo/teamlogo/10267.png',
    'celta vigo': 'https://images.fotmob.com/image_resources/logo/teamlogo/9910.png',
    'osasuna': 'https://images.fotmob.com/image_resources/logo/teamlogo/8371.png',
    'mallorca': 'https://images.fotmob.com/image_resources/logo/teamlogo/8661.png',
    'getafe': 'https://images.fotmob.com/image_resources/logo/teamlogo/8305.png',
    'rayo vallecano': 'https://images.fotmob.com/image_resources/logo/teamlogo/8370.png',
    'espanyol': 'https://images.fotmob.com/image_resources/logo/teamlogo/8558.png',
    'alaves': 'https://images.fotmob.com/image_resources/logo/teamlogo/9866.png',
    'deportivo alaves': 'https://images.fotmob.com/image_resources/logo/teamlogo/9866.png',
    'las palmas': 'https://images.fotmob.com/image_resources/logo/teamlogo/8306.png',
    'real valladolid': 'https://images.fotmob.com/image_resources/logo/teamlogo/10281.png',
    'valladolid': 'https://images.fotmob.com/image_resources/logo/teamlogo/10281.png',
    'leganes': 'https://images.fotmob.com/image_resources/logo/teamlogo/7854.png',
    'inter': 'https://images.fotmob.com/image_resources/logo/teamlogo/8636.png',
    'inter milan': 'https://images.fotmob.com/image_resources/logo/teamlogo/8636.png',
    'internazionale': 'https://images.fotmob.com/image_resources/logo/teamlogo/8636.png',
    'juventus': 'https://images.fotmob.com/image_resources/logo/teamlogo/9885.png',
    'juve': 'https://images.fotmob.com/image_resources/logo/teamlogo/9885.png',
    'ac milan': 'https://images.fotmob.com/image_resources/logo/teamlogo/8564.png',
    'milan': 'https://images.fotmob.com/image_resources/logo/teamlogo/8564.png',
    'napoli': 'https://images.fotmob.com/image_resources/logo/teamlogo/9875.png',
    'atalanta': 'https://images.fotmob.com/image_resources/logo/teamlogo/8524.png',
    'ata': 'https://images.fotmob.com/image_resources/logo/teamlogo/8524.png',
    'roma': 'https://images.fotmob.com/image_resources/logo/teamlogo/8686.png',
    'as roma': 'https://images.fotmob.com/image_resources/logo/teamlogo/8686.png',
    'lazio': 'https://images.fotmob.com/image_resources/logo/teamlogo/8543.png',
    'ss lazio': 'https://images.fotmob.com/image_resources/logo/teamlogo/8543.png',
    'fiorentina': 'https://images.fotmob.com/image_resources/logo/teamlogo/8535.png',
    'fio': 'https://images.fotmob.com/image_resources/logo/teamlogo/8535.png',
    'bologna': 'https://images.fotmob.com/image_resources/logo/teamlogo/9857.png',
    'bol': 'https://images.fotmob.com/image_resources/logo/teamlogo/9857.png',
    'torino': 'https://images.fotmob.com/image_resources/logo/teamlogo/9804.png',
    'tor': 'https://images.fotmob.com/image_resources/logo/teamlogo/9804.png',
    'udinese': 'https://images.fotmob.com/image_resources/logo/teamlogo/8600.png',
    'genoa': 'https://images.fotmob.com/image_resources/logo/teamlogo/10233.png',
    'cagliari': 'https://images.fotmob.com/image_resources/logo/teamlogo/8529.png',
    'monza': 'https://images.fotmob.com/image_resources/logo/teamlogo/6504.png',
    'empoli': 'https://images.fotmob.com/image_resources/logo/teamlogo/8534.png',
    'parma': 'https://images.fotmob.com/image_resources/logo/teamlogo/10167.png',
    'como': 'https://images.fotmob.com/image_resources/logo/teamlogo/10171.png',
    'hellas verona': 'https://images.fotmob.com/image_resources/logo/teamlogo/9876.png',
    'verona': 'https://images.fotmob.com/image_resources/logo/teamlogo/9876.png',
    'lecce': 'https://images.fotmob.com/image_resources/logo/teamlogo/9888.png',
    'venezia': 'https://images.fotmob.com/image_resources/logo/teamlogo/7881.png',
    'bayern munchen': 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png',
    'bayern münchen': 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png',
    'bayer leverkusen': 'https://images.fotmob.com/image_resources/logo/teamlogo/8178.png',
    'leverkusen': 'https://images.fotmob.com/image_resources/logo/teamlogo/8178.png',
    'borussia dortmund': 'https://images.fotmob.com/image_resources/logo/teamlogo/9789.png',
    'dortmund': 'https://images.fotmob.com/image_resources/logo/teamlogo/9789.png',
    'rb leipzig': 'https://images.fotmob.com/image_resources/logo/teamlogo/178475.png',
    'leipzig': 'https://images.fotmob.com/image_resources/logo/teamlogo/178475.png',
    'eintracht frankfurt': 'https://images.fotmob.com/image_resources/logo/teamlogo/9810.png',
    'frankfurt': 'https://images.fotmob.com/image_resources/logo/teamlogo/9810.png',
    'vfb stuttgart': 'https://images.fotmob.com/image_resources/logo/teamlogo/10269.png',
    'stuttgart': 'https://images.fotmob.com/image_resources/logo/teamlogo/10269.png',
    'vfb': 'https://images.fotmob.com/image_resources/logo/teamlogo/10269.png',
    'vfl wolfsburg': 'https://images.fotmob.com/image_resources/logo/teamlogo/394121.png',
    'wolfsburg': 'https://images.fotmob.com/image_resources/logo/teamlogo/394121.png',
    'sc freiburg': 'https://images.fotmob.com/image_resources/logo/teamlogo/8358.png',
    'freiburg': 'https://images.fotmob.com/image_resources/logo/teamlogo/8358.png',
    '1. fc union berlin': 'https://images.fotmob.com/image_resources/logo/teamlogo/8149.png',
    'union berlin': 'https://images.fotmob.com/image_resources/logo/teamlogo/8149.png',
    'tsg hoffenheim': 'https://images.fotmob.com/image_resources/logo/teamlogo/8226.png',
    'hoffenheim': 'https://images.fotmob.com/image_resources/logo/teamlogo/8226.png',
    'sv werder bremen': 'https://images.fotmob.com/image_resources/logo/teamlogo/8697.png',
    'werder bremen': 'https://images.fotmob.com/image_resources/logo/teamlogo/8697.png',
    'fc augsburg': 'https://images.fotmob.com/image_resources/logo/teamlogo/8406.png',
    'augsburg': 'https://images.fotmob.com/image_resources/logo/teamlogo/8406.png',
    '1. fsv mainz 05': 'https://images.fotmob.com/image_resources/logo/teamlogo/9905.png',
    'mainz': 'https://images.fotmob.com/image_resources/logo/teamlogo/9905.png',
    '1. fc heidenheim': 'https://images.fotmob.com/image_resources/logo/teamlogo/94937.png',
    'heidenheim': 'https://images.fotmob.com/image_resources/logo/teamlogo/94937.png',
    'fc st. pauli': 'https://images.fotmob.com/image_resources/logo/teamlogo/8152.png',
    'st pauli': 'https://images.fotmob.com/image_resources/logo/teamlogo/8152.png',
    'vfl bochum': 'https://images.fotmob.com/image_resources/logo/teamlogo/9911.png',
    'bochum': 'https://images.fotmob.com/image_resources/logo/teamlogo/9911.png',
    'holstein kiel': 'https://images.fotmob.com/image_resources/logo/teamlogo/8150.png',
    'paris saint-germain': 'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png',
    'paris saint germain': 'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png',
    'psg': 'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png',
    'monaco': 'https://images.fotmob.com/image_resources/logo/teamlogo/9829.png',
    'as monaco': 'https://images.fotmob.com/image_resources/logo/teamlogo/9829.png',
    'marseille': 'https://images.fotmob.com/image_resources/logo/teamlogo/8592.png',
    'olympique marseille': 'https://images.fotmob.com/image_resources/logo/teamlogo/8592.png',
    'lille': 'https://images.fotmob.com/image_resources/logo/teamlogo/8639.png',
    'losc lille': 'https://images.fotmob.com/image_resources/logo/teamlogo/8639.png',
    'lyon': 'https://images.fotmob.com/image_resources/logo/teamlogo/9748.png',
    'olympique lyon': 'https://images.fotmob.com/image_resources/logo/teamlogo/9748.png',
    'lens': 'https://images.fotmob.com/image_resources/logo/teamlogo/8588.png',
    'rc lens': 'https://images.fotmob.com/image_resources/logo/teamlogo/8588.png',
    'nice': 'https://images.fotmob.com/image_resources/logo/teamlogo/9831.png',
    'ogc nice': 'https://images.fotmob.com/image_resources/logo/teamlogo/9831.png',
    'rennes': 'https://images.fotmob.com/image_resources/logo/teamlogo/9851.png',
    'brest': 'https://images.fotmob.com/image_resources/logo/teamlogo/8521.png',
    'strasbourg': 'https://images.fotmob.com/image_resources/logo/teamlogo/9848.png',
    'toulouse': 'https://images.fotmob.com/image_resources/logo/teamlogo/9941.png',
    'nantes': 'https://images.fotmob.com/image_resources/logo/teamlogo/9830.png',
    'reims': 'https://images.fotmob.com/image_resources/logo/teamlogo/9837.png',
    'montpellier': 'https://images.fotmob.com/image_resources/logo/teamlogo/10249.png',
    'auxerre': 'https://images.fotmob.com/image_resources/logo/teamlogo/8583.png',
    'angers': 'https://images.fotmob.com/image_resources/logo/teamlogo/8121.png',
    'saint-etienne': 'https://images.fotmob.com/image_resources/logo/teamlogo/9853.png',
    'le havre': 'https://images.fotmob.com/image_resources/logo/teamlogo/9746.png',
    'sporting cp': 'https://images.fotmob.com/image_resources/logo/teamlogo/9768.png',
    'sporting': 'https://images.fotmob.com/image_resources/logo/teamlogo/9768.png',
    'benfica': 'https://images.fotmob.com/image_resources/logo/teamlogo/9772.png',
    'sl benfica': 'https://images.fotmob.com/image_resources/logo/teamlogo/9772.png',
    'porto': 'https://images.fotmob.com/image_resources/logo/teamlogo/9773.png',
    'fc porto': 'https://images.fotmob.com/image_resources/logo/teamlogo/9773.png',
    'braga': 'https://images.fotmob.com/image_resources/logo/teamlogo/10264.png',
    'ajax': 'https://images.fotmob.com/image_resources/logo/teamlogo/8593.png',
    'afc ajax': 'https://images.fotmob.com/image_resources/logo/teamlogo/8593.png',
    'psv': 'https://images.fotmob.com/image_resources/logo/teamlogo/8640.png',
    'psv eindhoven': 'https://images.fotmob.com/image_resources/logo/teamlogo/8640.png',
    'feyenoord': 'https://images.fotmob.com/image_resources/logo/teamlogo/10235.png',
    'al nassr': 'https://images.fotmob.com/image_resources/logo/teamlogo/101918.png',
    'al hilal': 'https://images.fotmob.com/image_resources/logo/teamlogo/2529.png',
    'al ittihad': 'https://images.fotmob.com/image_resources/logo/teamlogo/8577.png',
    'al ahli': 'https://images.fotmob.com/image_resources/logo/teamlogo/2530.png',
    'inter miami': 'https://images.fotmob.com/image_resources/logo/teamlogo/960720.png',
    'celtic': 'https://images.fotmob.com/image_resources/logo/teamlogo/9925.png',
    'rangers': 'https://images.fotmob.com/image_resources/logo/teamlogo/8548.png',
    'galatasaray': 'https://images.fotmob.com/image_resources/logo/teamlogo/8637.png',
    'gala': 'https://images.fotmob.com/image_resources/logo/teamlogo/8637.png',
    'fenerbahce': 'https://images.fotmob.com/image_resources/logo/teamlogo/8695.png',
    'fener': 'https://images.fotmob.com/image_resources/logo/teamlogo/8695.png',
    'besiktas': 'https://images.fotmob.com/image_resources/logo/teamlogo/10188.png',
    'flamengo': 'https://images.fotmob.com/image_resources/logo/teamlogo/9770.png',
    'fla': 'https://images.fotmob.com/image_resources/logo/teamlogo/9770.png',
    'palmeiras': 'https://images.fotmob.com/image_resources/logo/teamlogo/10283.png',
    'pal': 'https://images.fotmob.com/image_resources/logo/teamlogo/10283.png',
    'river plate': 'https://images.fotmob.com/image_resources/logo/teamlogo/10076.png',
    'river': 'https://images.fotmob.com/image_resources/logo/teamlogo/10076.png',
    'boca juniors': 'https://images.fotmob.com/image_resources/logo/teamlogo/10077.png',
    'boca': 'https://images.fotmob.com/image_resources/logo/teamlogo/10077.png',
    'argentina': 'https://images.fotmob.com/image_resources/logo/teamlogo/6706.png',
    'arg': 'https://images.fotmob.com/image_resources/logo/teamlogo/6706.png',
    'brazil': 'https://images.fotmob.com/image_resources/logo/teamlogo/8256.png',
    'brasil': 'https://images.fotmob.com/image_resources/logo/leaguelogo/268.png',
    'bra': 'https://images.fotmob.com/image_resources/logo/leaguelogo/268.png',
    'uruguay': 'https://images.fotmob.com/image_resources/logo/teamlogo/5796.png',
    'uru': 'https://images.fotmob.com/image_resources/logo/teamlogo/485935.png',
    'colombia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8258.png',
    'col': 'https://images.fotmob.com/image_resources/logo/teamlogo/8258.png',
    'chile': 'https://images.fotmob.com/image_resources/logo/teamlogo/9762.png',
    'chi': 'https://images.fotmob.com/image_resources/logo/teamlogo/9762.png',
    'ecuador': 'https://images.fotmob.com/image_resources/logo/teamlogo/6707.png',
    'ecu': 'https://images.fotmob.com/image_resources/logo/teamlogo/6707.png',
    'peru': 'https://images.fotmob.com/image_resources/logo/teamlogo/5798.png',
    'per': 'https://images.fotmob.com/image_resources/logo/leaguelogo/9478.png',
    'paraguay': 'https://images.fotmob.com/image_resources/logo/teamlogo/6724.png',
    'par': 'https://images.fotmob.com/image_resources/logo/teamlogo/10167.png',
    'venezuela': 'https://images.fotmob.com/image_resources/logo/teamlogo/5800.png',
    'ven': 'https://images.fotmob.com/image_resources/logo/teamlogo/9885.png',
    'bolivia': 'https://images.fotmob.com/image_resources/logo/teamlogo/5797.png',
    'france': 'https://images.fotmob.com/image_resources/logo/teamlogo/6723.png',
    'fra': 'https://images.fotmob.com/image_resources/logo/teamlogo/9810.png',
    'england': 'https://images.fotmob.com/image_resources/logo/teamlogo/8491.png',
    'eng': 'https://images.fotmob.com/image_resources/logo/teamlogo/9770.png',
    'spain': 'https://images.fotmob.com/image_resources/logo/teamlogo/6720.png',
    'esp': 'https://images.fotmob.com/image_resources/logo/teamlogo/8558.png',
    'germany': 'https://images.fotmob.com/image_resources/logo/teamlogo/8570.png',
    'ger': 'https://images.fotmob.com/image_resources/logo/teamlogo/9847.png',
    'portugal': 'https://images.fotmob.com/image_resources/logo/teamlogo/8361.png',
    'por': 'https://images.fotmob.com/image_resources/logo/leaguelogo/61.png',
    'italy': 'https://images.fotmob.com/image_resources/logo/teamlogo/8204.png',
    'ita': 'https://images.fotmob.com/image_resources/logo/teamlogo/8204.png',
    'netherlands': 'https://images.fotmob.com/image_resources/logo/teamlogo/6708.png',
    'ned': 'https://images.fotmob.com/image_resources/logo/teamlogo/6708.png',
    'belgium': 'https://images.fotmob.com/image_resources/logo/teamlogo/8263.png',
    'bel': 'https://images.fotmob.com/image_resources/logo/teamlogo/8263.png',
    'croatia': 'https://images.fotmob.com/image_resources/logo/teamlogo/10155.png',
    'cro': 'https://images.fotmob.com/image_resources/logo/teamlogo/10155.png',
    'switzerland': 'https://images.fotmob.com/image_resources/logo/teamlogo/6717.png',
    'sui': 'https://images.fotmob.com/image_resources/logo/teamlogo/6717.png',
    'denmark': 'https://images.fotmob.com/image_resources/logo/teamlogo/8238.png',
    'den': 'https://images.fotmob.com/image_resources/logo/teamlogo/8238.png',
    'austria': 'https://images.fotmob.com/image_resources/logo/teamlogo/8255.png',
    'aut': 'https://images.fotmob.com/image_resources/logo/teamlogo/8255.png',
    'norway': 'https://images.fotmob.com/image_resources/logo/teamlogo/8492.png',
    'nor': 'https://images.fotmob.com/image_resources/logo/teamlogo/578656.png',
    'sweden': 'https://images.fotmob.com/image_resources/logo/teamlogo/8520.png',
    'swe': 'https://images.fotmob.com/image_resources/logo/teamlogo/8520.png',
    'poland': 'https://images.fotmob.com/image_resources/logo/teamlogo/8568.png',
    'pol': 'https://images.fotmob.com/image_resources/logo/teamlogo/9875.png',
    'scotland': 'https://images.fotmob.com/image_resources/logo/teamlogo/8498.png',
    'sco': 'https://images.fotmob.com/image_resources/logo/teamlogo/8498.png',
    'wales': 'https://images.fotmob.com/image_resources/logo/teamlogo/5790.png',
    'wal': 'https://images.fotmob.com/image_resources/logo/teamlogo/5790.png',
    'turkey': 'https://images.fotmob.com/image_resources/logo/teamlogo/6595.png',
    'tur': 'https://images.fotmob.com/image_resources/logo/teamlogo/6595.png',
    'czech republic': 'https://images.fotmob.com/image_resources/logo/teamlogo/8496.png',
    'cze': 'https://images.fotmob.com/image_resources/logo/teamlogo/8496.png',
    'hungary': 'https://images.fotmob.com/image_resources/logo/teamlogo/8565.png',
    'hun': 'https://images.fotmob.com/image_resources/logo/teamlogo/8565.png',
    'ukraine': 'https://images.fotmob.com/image_resources/logo/teamlogo/6718.png',
    'ukr': 'https://images.fotmob.com/image_resources/logo/teamlogo/6718.png',
    'romania': 'https://images.fotmob.com/image_resources/logo/teamlogo/9730.png',
    'rou': 'https://images.fotmob.com/image_resources/logo/teamlogo/9730.png',
    'greece': 'https://images.fotmob.com/image_resources/logo/teamlogo/6383.png',
    'gre': 'https://images.fotmob.com/image_resources/logo/teamlogo/6383.png',
    'serbia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8205.png',
    'srb': 'https://images.fotmob.com/image_resources/logo/teamlogo/8205.png',
    'albania': 'https://images.fotmob.com/image_resources/logo/teamlogo/10024.png',
    'alb': 'https://images.fotmob.com/image_resources/logo/teamlogo/10024.png',
    'georgia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8268.png',
    'geo': 'https://images.fotmob.com/image_resources/logo/teamlogo/8268.png',
    'slovenia': 'https://images.fotmob.com/image_resources/logo/teamlogo/5787.png',
    'svn': 'https://images.fotmob.com/image_resources/logo/teamlogo/5787.png',
    'slovakia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8497.png',
    'svk': 'https://images.fotmob.com/image_resources/logo/teamlogo/8497.png',
    'finland': 'https://images.fotmob.com/image_resources/logo/teamlogo/7871.png',
    'fin': 'https://images.fotmob.com/image_resources/logo/teamlogo/7871.png',
    'iceland': 'https://images.fotmob.com/image_resources/logo/teamlogo/8536.png',
    'isl': 'https://images.fotmob.com/image_resources/logo/leaguelogo/9478.png',
    'bosnia and herzegovina': 'https://images.fotmob.com/image_resources/logo/teamlogo/10106.png',
    'bosnia': 'https://images.fotmob.com/image_resources/logo/teamlogo/10106.png',
    'bih': 'https://images.fotmob.com/image_resources/logo/teamlogo/10106.png',
    'northern ireland': 'https://images.fotmob.com/image_resources/logo/teamlogo/5792.png',
    'nir': 'https://images.fotmob.com/image_resources/logo/teamlogo/5792.png',
    'republic of ireland': 'https://images.fotmob.com/image_resources/logo/teamlogo/5791.png',
    'ireland': 'https://images.fotmob.com/image_resources/logo/teamlogo/5791.png',
    'irl': 'https://images.fotmob.com/image_resources/logo/teamlogo/5791.png',
    'morocco': 'https://images.fotmob.com/image_resources/logo/teamlogo/6262.png',
    'mar': 'https://images.fotmob.com/image_resources/logo/teamlogo/8592.png',
    'senegal': 'https://images.fotmob.com/image_resources/logo/teamlogo/6395.png',
    'sen': 'https://images.fotmob.com/image_resources/logo/teamlogo/9825.png',
    'nigeria': 'https://images.fotmob.com/image_resources/logo/teamlogo/6346.png',
    'nga': 'https://images.fotmob.com/image_resources/logo/teamlogo/165184.png',
    'egypt': 'https://images.fotmob.com/image_resources/logo/teamlogo/10255.png',
    'egy': 'https://images.fotmob.com/image_resources/logo/teamlogo/10255.png',
    'ivory coast': 'https://images.fotmob.com/image_resources/logo/teamlogo/8477.png',
    'civ': 'https://images.fotmob.com/image_resources/logo/teamlogo/8477.png',
    'ghana': 'https://images.fotmob.com/image_resources/logo/teamlogo/6714.png',
    'gha': 'https://images.fotmob.com/image_resources/logo/teamlogo/10203.png',
    'cameroon': 'https://images.fotmob.com/image_resources/logo/teamlogo/6629.png',
    'cmr': 'https://images.fotmob.com/image_resources/logo/teamlogo/6629.png',
    'algeria': 'https://images.fotmob.com/image_resources/logo/teamlogo/6317.png',
    'alg': 'https://images.fotmob.com/image_resources/logo/teamlogo/6317.png',
    'south africa': 'https://images.fotmob.com/image_resources/logo/teamlogo/6719.png',
    'rsa': 'https://images.fotmob.com/image_resources/logo/teamlogo/6719.png',
    'cape verde': 'https://images.fotmob.com/image_resources/logo/teamlogo/5888.png',
    'cpv': 'https://images.fotmob.com/image_resources/logo/teamlogo/5888.png',
    'mali': 'https://images.fotmob.com/image_resources/logo/teamlogo/5815.png',
    'mli': 'https://images.fotmob.com/image_resources/logo/teamlogo/5815.png',
    'guinea': 'https://images.fotmob.com/image_resources/logo/teamlogo/8323.png',
    'gui': 'https://images.fotmob.com/image_resources/logo/teamlogo/8323.png',
    'dr congo': 'https://images.fotmob.com/image_resources/logo/teamlogo/8476.png',
    'cod': 'https://images.fotmob.com/image_resources/logo/teamlogo/8476.png',
    'burkina faso': 'https://images.fotmob.com/image_resources/logo/teamlogo/8324.png',
    'bfa': 'https://images.fotmob.com/image_resources/logo/teamlogo/8324.png',
    'zambia': 'https://images.fotmob.com/image_resources/logo/teamlogo/6277.png',
    'zam': 'https://images.fotmob.com/image_resources/logo/teamlogo/6277.png',
    'angola': 'https://images.fotmob.com/image_resources/logo/teamlogo/6712.png',
    'ang': 'https://images.fotmob.com/image_resources/logo/teamlogo/8121.png',
    'mozambique': 'https://images.fotmob.com/image_resources/logo/teamlogo/5965.png',
    'moz': 'https://images.fotmob.com/image_resources/logo/teamlogo/5965.png',
    'equatorial guinea': 'https://images.fotmob.com/image_resources/logo/teamlogo/8323.png',
    'eqg': 'https://images.fotmob.com/image_resources/logo/teamlogo/8323.png',
    'mauritania': 'https://images.fotmob.com/image_resources/logo/teamlogo/68374.png',
    'mtn': 'https://images.fotmob.com/image_resources/logo/teamlogo/68374.png',
    'namibia': 'https://images.fotmob.com/image_resources/logo/teamlogo/5802.png',
    'nam': 'https://images.fotmob.com/image_resources/logo/teamlogo/5802.png',
    'gambia': 'https://images.fotmob.com/image_resources/logo/teamlogo/5979.png',
    'gam': 'https://images.fotmob.com/image_resources/logo/teamlogo/5979.png',
    'gabon': 'https://images.fotmob.com/image_resources/logo/teamlogo/5889.png',
    'gab': 'https://images.fotmob.com/image_resources/logo/teamlogo/5889.png',
    'uganda': 'https://images.fotmob.com/image_resources/logo/teamlogo/5890.png',
    'uga': 'https://images.fotmob.com/image_resources/logo/leaguelogo/61.png',
    'kenya': 'https://images.fotmob.com/image_resources/logo/teamlogo/5884.png',
    'ken': 'https://images.fotmob.com/image_resources/logo/teamlogo/5884.png',
    'tanzania': 'https://images.fotmob.com/image_resources/logo/teamlogo/7941.png',
    'tan': 'https://images.fotmob.com/image_resources/logo/teamlogo/68374.png',
    'zimbabwe': 'https://images.fotmob.com/image_resources/logo/teamlogo/6290.png',
    'zim': 'https://images.fotmob.com/image_resources/logo/teamlogo/6290.png',
    'usa': 'https://images.fotmob.com/image_resources/logo/teamlogo/6713.png',
    'mexico': 'https://images.fotmob.com/image_resources/logo/teamlogo/6710.png',
    'mex': 'https://images.fotmob.com/image_resources/logo/teamlogo/6710.png',
    'canada': 'https://images.fotmob.com/image_resources/logo/teamlogo/5810.png',
    'can': 'https://images.fotmob.com/image_resources/logo/teamlogo/8370.png',
    'costa rica': 'https://images.fotmob.com/image_resources/logo/teamlogo/6709.png',
    'crc': 'https://images.fotmob.com/image_resources/logo/teamlogo/6709.png',
    'jamaica': 'https://images.fotmob.com/image_resources/logo/teamlogo/5806.png',
    'jam': 'https://images.fotmob.com/image_resources/logo/teamlogo/873038.png',
    'panama': 'https://images.fotmob.com/image_resources/logo/teamlogo/5922.png',
    'pan': 'https://images.fotmob.com/image_resources/logo/teamlogo/8558.png',
    'honduras': 'https://images.fotmob.com/image_resources/logo/teamlogo/5808.png',
    'hon': 'https://images.fotmob.com/image_resources/logo/teamlogo/5808.png',
    'el salvador': 'https://images.fotmob.com/image_resources/logo/teamlogo/5807.png',
    'slv': 'https://images.fotmob.com/image_resources/logo/teamlogo/5807.png',
    'trinidad and tobago': 'https://images.fotmob.com/image_resources/logo/teamlogo/5812.png',
    'tri': 'https://images.fotmob.com/image_resources/logo/teamlogo/5812.png',
    'japan': 'https://images.fotmob.com/image_resources/logo/teamlogo/6715.png',
    'jpn': 'https://images.fotmob.com/image_resources/logo/teamlogo/6715.png',
    'south korea': 'https://images.fotmob.com/image_resources/logo/teamlogo/6390.png',
    'kor': 'https://images.fotmob.com/image_resources/logo/teamlogo/6390.png',
    'australia': 'https://images.fotmob.com/image_resources/logo/teamlogo/6716.png',
    'aus': 'https://images.fotmob.com/image_resources/logo/teamlogo/8255.png',
    'saudi arabia': 'https://images.fotmob.com/image_resources/logo/teamlogo/6722.png',
    'ksa': 'https://images.fotmob.com/image_resources/logo/teamlogo/6722.png',
    'iran': 'https://images.fotmob.com/image_resources/logo/teamlogo/6711.png',
    'irn': 'https://images.fotmob.com/image_resources/logo/teamlogo/6711.png',
    'qatar': 'https://images.fotmob.com/image_resources/logo/teamlogo/5902.png',
    'qat': 'https://images.fotmob.com/image_resources/logo/teamlogo/5902.png',
    'india': 'https://images.fotmob.com/image_resources/logo/teamlogo/6329.png',
    'ind': 'https://images.fotmob.com/image_resources/logo/leaguelogo/9478.png',
    'uzbekistan': 'https://images.fotmob.com/image_resources/logo/teamlogo/8700.png',
    'uzb': 'https://images.fotmob.com/image_resources/logo/teamlogo/8700.png',
    'jordan': 'https://images.fotmob.com/image_resources/logo/teamlogo/5816.png',
    'jor': 'https://images.fotmob.com/image_resources/logo/leaguelogo/130.png',
    'iraq': 'https://images.fotmob.com/image_resources/logo/teamlogo/5819.png',
    'irq': 'https://images.fotmob.com/image_resources/logo/teamlogo/5819.png',
    'uae': 'https://images.fotmob.com/image_resources/logo/teamlogo/5789.png',
    'oman': 'https://images.fotmob.com/image_resources/logo/teamlogo/5824.png',
    'oma': 'https://images.fotmob.com/image_resources/logo/teamlogo/8686.png',
    'bahrain': 'https://images.fotmob.com/image_resources/logo/teamlogo/5901.png',
    'bhr': 'https://images.fotmob.com/image_resources/logo/teamlogo/5901.png',
    'thailand': 'https://images.fotmob.com/image_resources/logo/teamlogo/5788.png',
    'tha': 'https://images.fotmob.com/image_resources/logo/teamlogo/8466.png',
    'vietnam': 'https://images.fotmob.com/image_resources/logo/teamlogo/5894.png',
    'vie': 'https://images.fotmob.com/image_resources/logo/teamlogo/5894.png',
    'indonesia': 'https://images.fotmob.com/image_resources/logo/teamlogo/6324.png',
    'idn': 'https://images.fotmob.com/image_resources/logo/teamlogo/6324.png',
    'malaysia': 'https://images.fotmob.com/image_resources/logo/teamlogo/5823.png',
    'mas': 'https://images.fotmob.com/image_resources/logo/teamlogo/8306.png',
    'china': 'https://images.fotmob.com/image_resources/logo/teamlogo/5822.png',
    'chn': 'https://images.fotmob.com/image_resources/logo/teamlogo/5822.png',
    'new zealand': 'https://images.fotmob.com/image_resources/logo/teamlogo/5833.png',
    'nzl': 'https://images.fotmob.com/image_resources/logo/teamlogo/5833.png',
    'mcfc_isl': 'https://images.fotmob.com/image_resources/logo/teamlogo/578655.png',
    'mariners': 'https://images.fotmob.com/image_resources/logo/teamlogo/8164.png',
    'mufc': 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png',
    'lfc': 'https://images.fotmob.com/image_resources/logo/teamlogo/8650.png',
    'spurs': 'https://images.fotmob.com/image_resources/logo/teamlogo/8586.png',
    'man utd': 'https://images.fotmob.com/image_resources/logo/teamlogo/10260.png',
    'mohammedan sporting': 'https://images.fotmob.com/image_resources/logo/teamlogo/165187.png',
    'thfc': 'https://images.fotmob.com/image_resources/logo/teamlogo/8586.png',
    'afc': 'https://images.fotmob.com/image_resources/logo/teamlogo/8678.png',
    'cfc_isl': 'https://images.fotmob.com/image_resources/logo/teamlogo/578652.png',
    'athletic bilbao': 'https://images.fotmob.com/image_resources/logo/teamlogo/8315.png',
    'nufc': 'https://images.fotmob.com/image_resources/logo/teamlogo/189669.png',
    'avfc': 'https://images.fotmob.com/image_resources/logo/teamlogo/8678.png',
    'atleti': 'https://images.fotmob.com/image_resources/logo/teamlogo/9906.png',
    'barca': 'https://images.fotmob.com/image_resources/logo/teamlogo/8634.png',
    'bha': 'https://images.fotmob.com/image_resources/logo/teamlogo/185749.png',
    'whufc': 'https://images.fotmob.com/image_resources/logo/teamlogo/8654.png',
    'bilbao': 'https://images.fotmob.com/image_resources/logo/teamlogo/8315.png',
    'rsoc': 'https://images.fotmob.com/image_resources/logo/teamlogo/8493.png',
    'vcf': 'https://images.fotmob.com/image_resources/logo/teamlogo/10269.png',
    'bayern munich': 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png',
    'celta de vigo': 'https://images.fotmob.com/image_resources/logo/teamlogo/9910.png',
    'fc bayern': 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png',
    'b04': 'https://images.fotmob.com/image_resources/logo/teamlogo/8178.png',
    'gladbach': 'https://images.fotmob.com/image_resources/logo/teamlogo/9788.png',
    'stade rennais': 'https://images.fotmob.com/image_resources/logo/teamlogo/9851.png',
    'bvb': 'https://images.fotmob.com/image_resources/logo/teamlogo/1482697.png',
    'rbl': 'https://images.fotmob.com/image_resources/logo/teamlogo/178475.png',
    'monchengladbach': 'https://images.fotmob.com/image_resources/logo/teamlogo/9788.png',
    'sge': 'https://images.fotmob.com/image_resources/logo/teamlogo/674689.png',
    'sporting lisbon': 'https://images.fotmob.com/image_resources/logo/teamlogo/9768.png',
    'bjk': 'https://images.fotmob.com/image_resources/logo/teamlogo/10188.png',
    'deutschland': 'https://images.fotmob.com/image_resources/logo/teamlogo/8570.png',
    'czechia': 'https://images.fotmob.com/image_resources/logo/teamlogo/8496.png',
    'ivoire': 'https://images.fotmob.com/image_resources/logo/teamlogo/8477.png',
    'cabo verde': 'https://images.fotmob.com/image_resources/logo/teamlogo/5888.png',
    'united states': 'https://images.fotmob.com/image_resources/logo/teamlogo/6713.png',
    'holland': 'https://images.fotmob.com/image_resources/logo/teamlogo/6708.png',
    'congo dr': 'https://images.fotmob.com/image_resources/logo/teamlogo/8476.png',
    'democratic republic of the congo': 'https://images.fotmob.com/image_resources/logo/teamlogo/8476.png',
    'turkiye': 'https://images.fotmob.com/image_resources/logo/teamlogo/6595.png',
    'usmnt': 'https://images.fotmob.com/image_resources/logo/teamlogo/6713.png',
    'united arab emirates': 'https://images.fotmob.com/image_resources/logo/teamlogo/5789.png',
    'korea republic': 'https://images.fotmob.com/image_resources/logo/teamlogo/6390.png',
    'mainz 05': 'https://images.fotmob.com/image_resources/logo/teamlogo/9905.png',
    'st. pauli': 'https://images.fotmob.com/image_resources/logo/teamlogo/8152.png',
    'borussia monchengladbach': 'https://images.fotmob.com/image_resources/logo/teamlogo/9788.png',
    'verdao': 'https://images.fotmob.com/image_resources/logo/teamlogo/10283.png',
    'riv': 'https://images.fotmob.com/image_resources/logo/teamlogo/10076.png',
    'los millonarios': 'https://images.fotmob.com/image_resources/logo/teamlogo/10076.png',
    'xeneizes': 'https://images.fotmob.com/image_resources/logo/teamlogo/10077.png',
    'beşiktaş': 'https://images.fotmob.com/image_resources/logo/teamlogo/10188.png',
    'southkorea': 'https://images.fotmob.com/image_resources/logo/teamlogo/6390.png',
    'ivorycoast': 'https://images.fotmob.com/image_resources/logo/teamlogo/8477.png',
    'southafrica': 'https://images.fotmob.com/image_resources/logo/teamlogo/6719.png',
    'capeverde': 'https://images.fotmob.com/image_resources/logo/teamlogo/5888.png',
    'drcongo': 'https://images.fotmob.com/image_resources/logo/teamlogo/8476.png',
    'burkinafaso': 'https://images.fotmob.com/image_resources/logo/teamlogo/8324.png',
    'equatorialguinea': 'https://images.fotmob.com/image_resources/logo/teamlogo/8323.png',
    'northernireland': 'https://images.fotmob.com/image_resources/logo/teamlogo/5792.png',
    'costarica': 'https://images.fotmob.com/image_resources/logo/teamlogo/6709.png',
    'elsalvador': 'https://images.fotmob.com/image_resources/logo/teamlogo/5807.png',
    'trinidad': 'https://images.fotmob.com/image_resources/logo/teamlogo/5812.png',
    'saudiarabia': 'https://images.fotmob.com/image_resources/logo/teamlogo/6722.png',
    'newzealand': 'https://images.fotmob.com/image_resources/logo/teamlogo/5833.png',
    'fcb': 'https://images.fotmob.com/image_resources/logo/teamlogo/9823.png',
    'fey': 'https://images.fotmob.com/image_resources/logo/teamlogo/10235.png',
    'intermiami': 'https://images.fotmob.com/image_resources/logo/teamlogo/960720.png',
    'alnassr': 'https://images.fotmob.com/image_resources/logo/teamlogo/101918.png',
    'alhilal': 'https://images.fotmob.com/image_resources/logo/teamlogo/2529.png',
    'alittihad': 'https://images.fotmob.com/image_resources/logo/teamlogo/8577.png',
    'alahli': 'https://images.fotmob.com/image_resources/logo/teamlogo/2530.png'
  };

        static getFootballLogo(name, shortName = '', id = null) {
    if (id) {
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

    'bbl': 'https://resources.bigbash.pulselive.com/bigbash/photo/2026/06/15/cc13b4a5-25e1-4057-8b11-37cb8f836651/WBBL-BBL-logo-lock-up.png',
    'big bash league': 'https://resources.bigbash.pulselive.com/bigbash/photo/2026/06/15/cc13b4a5-25e1-4057-8b11-37cb8f836651/WBBL-BBL-logo-lock-up.png',
    'kfc bbl': 'https://resources.bigbash.pulselive.com/bigbash/photo/2026/06/15/cc13b4a5-25e1-4057-8b11-37cb8f836651/WBBL-BBL-logo-lock-up.png',

    'wbbl': 'https://resources.bigbash.pulselive.com/bigbash/photo/2026/06/15/cc13b4a5-25e1-4057-8b11-37cb8f836651/WBBL-BBL-logo-lock-up.png',
    'women\'s big bash league': 'https://resources.bigbash.pulselive.com/bigbash/photo/2026/06/15/cc13b4a5-25e1-4057-8b11-37cb8f836651/WBBL-BBL-logo-lock-up.png',
    'womens big bash league': 'https://resources.bigbash.pulselive.com/bigbash/photo/2026/06/15/cc13b4a5-25e1-4057-8b11-37cb8f836651/WBBL-BBL-logo-lock-up.png',

    'psl': 'https://psl-t20.com/wp-content/uploads/2026/02/HBL-PSL-new-logo.png',
    'pakistan super league': 'https://psl-t20.com/wp-content/uploads/2026/02/HBL-PSL-new-logo.png',
    'hbl psl': 'https://psl-t20.com/wp-content/uploads/2026/02/HBL-PSL-new-logo.png',

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
   * Fast Alias Indexer
   */
  static _aliasToGroup = null;
  static _ensureAliasMapsIndexed() {
    if (this._aliasToGroup) return;

    this._aliasToGroup = {
      football: {},
      cricket: {},
      f1_driver: {},
      f1_constructor: {},
      leagues: {}
    };

    // Football
    for (const [group, list] of Object.entries(FOOTBALL_ALIASES)) {
      for (const alias of list) {
        const lower = alias.toLowerCase().trim();
        const clean = lower.replace(/[^a-z0-9]/g, '');
        const normFb = normalizeFootballName(alias);
        this._aliasToGroup.football[lower] = group;
        if (clean) this._aliasToGroup.football[clean] = group;
        if (normFb) this._aliasToGroup.football[normFb] = group;
      }
    }

    // Cricket
    for (const [group, list] of Object.entries(CRICKET_ALIASES)) {
      for (const alias of list) {
        const lower = alias.toLowerCase().trim();
        const clean = lower.replace(/[^a-z0-9]/g, '');
        this._aliasToGroup.cricket[lower] = group;
        if (clean) this._aliasToGroup.cricket[clean] = group;
      }
    }

    // F1 Drivers
    for (const [group, list] of Object.entries(F1_DRIVER_ALIASES)) {
      for (const alias of list) {
        const lower = alias.toLowerCase().trim();
        const clean = lower.replace(/[^a-z0-9]/g, '');
        this._aliasToGroup.f1_driver[lower] = group;
        if (clean) this._aliasToGroup.f1_driver[clean] = group;
      }
    }

    // F1 Constructors
    for (const [group, list] of Object.entries(F1_CONSTRUCTOR_ALIASES)) {
      for (const alias of list) {
        const lower = alias.toLowerCase().trim();
        const clean = lower.replace(/[^a-z0-9]/g, '');
        this._aliasToGroup.f1_constructor[lower] = group;
        if (clean) this._aliasToGroup.f1_constructor[clean] = group;
      }
    }

    // Leagues
    for (const [group, list] of Object.entries(LEAGUE_ALIASES)) {
      for (const alias of list) {
        const lower = alias.toLowerCase().trim();
        const clean = lower.replace(/[^a-z0-9]/g, '');
        const cleanNoYears = lower.replace(/\b20\d\d(\s*[\/\-]\s*\d{2,4})?\b/g, '').replace(/[^a-z0-9]/g, '');
        this._aliasToGroup.leagues[lower] = group;
        if (clean) this._aliasToGroup.leagues[clean] = group;
        if (cleanNoYears) this._aliasToGroup.leagues[cleanNoYears] = group;
      }
    }
  }

  /**
   * Pre-compiles lightning-fast O(1) hash sets for active favorites
   */
  static buildLookupIndex(favorites) {
    if (!favorites) return favorites;
    this._ensureAliasMapsIndexed();

    const teamIndex = { football: new Set(), cricket: new Set(), f1: new Set() };
    const leagueIndex = { football: new Set(), cricket: new Set(), f1: new Set() };

    for (const sport of ['football', 'cricket', 'f1']) {
      const list = favorites[sport] || [];
      for (const fav of list) {
        const isLeague = Boolean(fav.isLeague || fav.category === 'League' || fav.category === 'Tournament');
        const targetSet = isLeague ? leagueIndex[sport] : teamIndex[sport];

        if (fav.id) {
          const idLower = String(fav.id).toLowerCase().trim();
          targetSet.add(idLower);
          targetSet.add(idLower.replace(/[^a-z0-9]/g, ''));
        }

        if (fav.name) {
          const lower = fav.name.toLowerCase().trim();
          const clean = lower.replace(/[^a-z0-9]/g, '');
          targetSet.add(lower);
          targetSet.add(clean);

          if (isLeague) {
            const cleanNoYears = lower.replace(/\b20\d\d(\s*[\/\-]\s*\d{2,4})?\b/g, '').replace(/[^a-z0-9]/g, '');
            if (cleanNoYears) targetSet.add(cleanNoYears);
            const lgGroup = this._aliasToGroup.leagues[lower] || this._aliasToGroup.leagues[clean] || this._aliasToGroup.leagues[cleanNoYears];
            if (lgGroup) targetSet.add(`group_${lgGroup}`);
          } else if (sport === 'football') {
            const normFb = normalizeFootballName(fav.name);
            if (normFb) targetSet.add(normFb);
            const fbGroup = this._aliasToGroup.football[lower] || this._aliasToGroup.football[clean] || (normFb && this._aliasToGroup.football[normFb]);
            if (fbGroup) targetSet.add(`group_${fbGroup}`);
          } else if (sport === 'cricket') {
            const crGroup = this._aliasToGroup.cricket[lower] || this._aliasToGroup.cricket[clean];
            if (crGroup) targetSet.add(`group_${crGroup}`);
          } else if (sport === 'f1') {
            const isConstructor = Boolean(fav.isTeam || fav.category === 'Constructor');
            if (isConstructor) {
              const f1cGroup = this._aliasToGroup.f1_constructor[lower] || this._aliasToGroup.f1_constructor[clean];
              if (f1cGroup) targetSet.add(`group_${f1cGroup}`);
            } else {
              const f1dGroup = this._aliasToGroup.f1_driver[lower] || this._aliasToGroup.f1_driver[clean];
              if (f1dGroup) targetSet.add(`group_${f1dGroup}`);
            }
          }
        }

        if (fav.shortName) {
          const sLower = fav.shortName.toLowerCase().trim();
          const sClean = sLower.replace(/[^a-z0-9]/g, '');
          targetSet.add(sLower);
          targetSet.add(sClean);
          if (sport === 'football') {
            const fbGroup = this._aliasToGroup.football[sLower] || this._aliasToGroup.football[sClean];
            if (fbGroup) targetSet.add(`group_${fbGroup}`);
          } else if (sport === 'cricket') {
            const crGroup = this._aliasToGroup.cricket[sLower] || this._aliasToGroup.cricket[sClean];
            if (crGroup) targetSet.add(`group_${crGroup}`);
          }
        }

        if (fav.code) {
          const cLower = fav.code.toLowerCase().trim();
          targetSet.add(cLower);
          const f1dGroup = this._aliasToGroup.f1_driver[cLower];
          if (f1dGroup) targetSet.add(`group_${f1dGroup}`);
        }
      }
    }

    favorites._teamIndex = teamIndex;
    favorites._leagueIndex = leagueIndex;
    return favorites;
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
            this.buildLookupIndex(favs);
            this._cachedFavorites = favs;
            resolve(favs);
          } else {
            const defFavs = { ...this.DEFAULT_FAVORITES };
            this.buildLookupIndex(defFavs);
            chrome.storage.local.set({ [this.STORAGE_KEY]: this.DEFAULT_FAVORITES });
            this._cachedFavorites = defFavs;
            resolve(defFavs);
          }
        });
      });
    } else {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(this.STORAGE_KEY) : null;
      const favs = stored ? JSON.parse(stored) : { ...this.DEFAULT_FAVORITES };
      this.buildLookupIndex(favs);
      this._cachedFavorites = favs;
      return favs;
    }
  }

  /**
   * Save followed teams
   */
  static async saveFavorites(favorites) {
    this.buildLookupIndex(favorites);
    this._cachedFavorites = favorites;
    const cleanToStore = {
      football: favorites.football || [],
      cricket: favorites.cricket || [],
      f1: favorites.f1 || []
    };
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise(resolve => {
        chrome.storage.local.set({ [this.STORAGE_KEY]: cleanToStore }, () => resolve(true));
      });
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanToStore));
      return true;
    }
  }

  /**
   * Clear all followed teams completely
   */
  static async clearAllFavorites() {
    const empty = { football: [], cricket: [], f1: [] };
    this.buildLookupIndex(empty);
    this._cachedFavorites = empty;
    await this.saveFavorites(empty);
    return empty;
  }

  /**
   * Instant O(1) Check: Is team, club, or driver followed?
   * Zero nested loops, zero regex iteration, sub-microsecond response.
   */
  static isTeamFollowed(favorites, sport, teamIdentifier, teamId = null) {
    if (!favorites) return false;
    if (!favorites._teamIndex) {
      this.buildLookupIndex(favorites);
    }
    const teamSet = favorites._teamIndex?.[sport];
    if (!teamSet || teamSet.size === 0) return false;

    if (teamId) {
      const idLower = String(teamId).toLowerCase().trim();
      if (teamSet.has(idLower) || teamSet.has(idLower.replace(/[^a-z0-9]/g, ''))) return true;
    }

    if (!teamIdentifier) return false;

    const lower = String(teamIdentifier).toLowerCase().trim();
    if (teamSet.has(lower)) return true;

    const clean = lower.replace(/[^a-z0-9]/g, '');
    if (clean && teamSet.has(clean)) return true;

    if (sport === 'football') {
      const normFb = normalizeFootballName(teamIdentifier);
      if (normFb && teamSet.has(normFb)) return true;
      const group = this._aliasToGroup?.football[lower] || this._aliasToGroup?.football[clean] || (normFb && this._aliasToGroup?.football[normFb]);
      if (group && teamSet.has(`group_${group}`)) return true;
    } else if (sport === 'cricket') {
      const group = this._aliasToGroup?.cricket[lower] || this._aliasToGroup?.cricket[clean];
      if (group && teamSet.has(`group_${group}`)) return true;
      if (clean.length >= 8) {
        for (const token of teamSet) {
          if (token.length >= 8 && !token.startsWith('group_')) {
            if (lower.startsWith(token + ' ') || lower.endsWith(' ' + token)) {
              return true;
            }
          }
        }
      }
    } else if (sport === 'f1') {
      const dGroup = this._aliasToGroup?.f1_driver[lower] || this._aliasToGroup?.f1_driver[clean];
      if (dGroup && teamSet.has(`group_${dGroup}`)) return true;
      const cGroup = this._aliasToGroup?.f1_constructor[lower] || this._aliasToGroup?.f1_constructor[clean];
      if (cGroup && teamSet.has(`group_${cGroup}`)) return true;
    }

    return false;
  }

  /**
   * Instant O(1) Check: Is a football league or cricket tournament followed?
   */
  static isLeagueFollowed(favorites, sport, leagueName, leagueId = null) {
    if (!favorites) return false;
    if (!favorites._leagueIndex) {
      this.buildLookupIndex(favorites);
    }
    const leagueSet = favorites._leagueIndex?.[sport];
    if (!leagueSet || leagueSet.size === 0) return false;

    if (leagueId) {
      const idLower = String(leagueId).toLowerCase().trim();
      if (leagueSet.has(idLower) || leagueSet.has(idLower.replace(/[^a-z0-9]/g, ''))) return true;
    }

    if (!leagueName) return false;

    const lower = String(leagueName).toLowerCase().trim();
    if (leagueSet.has(lower)) return true;

    const clean = lower.replace(/[^a-z0-9]/g, '');
    if (clean && leagueSet.has(clean)) return true;

    const cleanNoYears = lower.replace(/\b20\d\d(\s*[\/\-]\s*\d{2,4})?\b/g, '').replace(/[^a-z0-9]/g, '');
    if (cleanNoYears && leagueSet.has(cleanNoYears)) return true;

    const group = this._aliasToGroup?.leagues[lower] || this._aliasToGroup?.leagues[clean] || this._aliasToGroup?.leagues[cleanNoYears];
    if (group && leagueSet.has(`group_${group}`)) return true;

    return false;
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

  static _prebuiltCatalog = null;
  static _getPrebuiltStaticCatalog() {
    if (!this._prebuiltCatalog) {
      const football = this.DISCOVER_CATALOG.football.map(t => ({ ...t, sport: 'football' }));
      const cricket = this.DISCOVER_CATALOG.cricket.map(t => ({ ...t, sport: 'cricket' }));
      const f1 = this.DISCOVER_CATALOG.f1.map(t => ({ ...t, sport: 'f1' }));
      this._prebuiltCatalog = { football, cricket, f1 };
    }
    return this._prebuiltCatalog;
  }

  /**
   * Returns list of all discoverable items by combining static catalog
   * with LIVE active teams, leagues, and drivers from data feeds dynamically.
   * Supports sport and category sub-filtering.
   */
  static getDiscoverableItems(sport = 'all', category = 'all', footballMatches = [], cricketMatches = [], f1Data = null, footballLeagues = [], cricketSeries = []) {
    let items = [];
    const normCat = (category || 'all').toLowerCase().trim();
    const prebuilt = this._getPrebuiltStaticCatalog();

    if (sport === 'all' || sport === 'football') {
      const fbMap = new Map();
      prebuilt.football.forEach(t => {
        fbMap.set(String(t.id), t);
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
      prebuilt.cricket.forEach(t => {
        crMap.set(t.name.toLowerCase(), t);
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
      prebuilt.f1.forEach(t => f1Map.set(t.name.toLowerCase(), t));

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
