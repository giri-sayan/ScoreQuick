/**
 * ScoreQuick - Cricket Service
 * Copyright (c) 2026 Giri Sayan. All Rights Reserved.
 * PROPRIETARY & CONFIDENTIAL. Unauthorized copying, modification, or distribution is prohibited.
 *
 * Fetches real-time cricket matches, live ball-by-ball scores, overs, and series.
 * Enriches active matches with current over balls, previous over balls, batsmen on crease, bowler figures, and target situations.
 */

import { FavoritesService } from './favorites.js';

export function cleanCricketText(str) {
  if (!str) return '';
  let s = String(str).trim();

  // Strip CREX tags &l;...&g; and standard HTML tags
  s = s.replace(/&l;[\s\S]*?&g;/gi, '')
       .replace(/<[^>]+>/g, '')
       .replace(/&nbsp;/gi, ' ')
       .replace(/&amp;/gi, '&')
       .replace(/&quot;/gi, '"')
       .replace(/&#39;|&apos;/gi, "'")
       .replace(/&[a-zA-Z0-9#]+;/g, ' ');

  // Strip leading/trailing internal tokens like &21HkA or &xxxx
  s = s.replace(/^[&]?[0-9a-zA-Z_-]{1,12}\s+/g, '');
  s = s.replace(/\s+[&]?[0-9a-zA-Z_-]{1,12}$/g, '');

  s = s.replace(/\s+/g, ' ').trim();

  // Check if what's left is just an internal hash/token (e.g. "&21HkA", "21HkA", "aB3_9")
  if (/^[&]?[0-9a-zA-Z_-]{1,15}$/.test(s)) {
    const validCricketWords = new Set([
      'live', 'finished', 'upcoming', 'stumps', 'tea', 'lunch', 'rain',
      'delayed', 'abandoned', 'toss', 'break', 'innings break', 'drinks',
      'drawn', 'tied', 'no result', 'scheduled', 'complete', 'completed', 'opted to bat', 'opted to bowl'
    ]);
    if (!validCricketWords.has(s.toLowerCase())) {
      return '';
    }
  }

  // Reject strings starting with & or random mixed-case alphanumeric tokens without spaces
  if (s.startsWith('&') || (/^[a-zA-Z0-9]{4,}$/.test(s) && /[0-9]/.test(s) && /[A-Z]/.test(s) && /[a-z]/.test(s))) {
    return '';
  }

  return s;
}

function parseScoreAndOvers(scoreField, overField) {
  let score = '';
  let overs = '';

  if (scoreField) {
    const sStr = String(scoreField).trim();
    if (sStr && sStr !== '-' && !sStr.toLowerCase().includes('yet to bat')) {
      const ovMatch = sStr.match(/\(([\d\.]+)\s*(?:ov|overs)?\)/i) || sStr.match(/([\d\.]+)\s*(?:ov|overs)/i);
      if (ovMatch) {
        overs = ovMatch[1];
        score = sStr.replace(ovMatch[0], '').replace(/[\(\)]/g, '').trim();
      } else {
        score = sStr.replace(/[\(\)]/g, '').trim();
      }
    }
  }

  if (!overs && overField) {
    const oStr = String(overField).replace(/[\(\)]/g, '').replace(/\s*ov(ers)?/gi, '').trim();
    if (oStr && /^\d+(\.\d+)?$/.test(oStr) && oStr !== '0' && oStr !== '0.0') {
      overs = oStr;
    }
  }

  if (!score || score.toLowerCase().includes('yet to bat') || score === '-') {
    score = '';
  }

  return { score, overs };
}

export class CricketService {
  static _crexLinkMap = new Map();
  static _crexHrefs = [];

  static getTeamVariants(name, shortName) {
    const variants = new Set();
    const add = s => {
      if (!s) return;
      const clean = String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean.length >= 2) variants.add(clean);
    };

    add(name);
    add(shortName);

    if (name) {
      String(name).toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 2 && !['and', 'the', 'cricket', 'club', 'team', 'men', 'mens', 'women', 'womens'].includes(w))
        .forEach(w => variants.add(w));
    }

    const raw = `${name || ''} ${shortName || ''}`.toLowerCase();
    if (raw.includes('india') || raw.includes('ind')) { variants.add('ind'); variants.add('india'); }
    if (raw.includes('west indies') || raw.includes('wi')) { variants.add('wi'); variants.add('west-indies'); }
    if (raw.includes('pakistan') || raw.includes('pak')) { variants.add('pak'); variants.add('pakistan'); }
    if (raw.includes('australia') || raw.includes('aus')) { variants.add('aus'); variants.add('australia'); }
    if (raw.includes('england') || raw.includes('eng')) { variants.add('eng'); variants.add('england'); }
    if (raw.includes('south africa') || raw.includes('sa')) { variants.add('sa'); variants.add('south-africa'); }
    if (raw.includes('sri lanka') || raw.includes('sl')) { variants.add('sl'); variants.add('sri-lanka'); }
    if (raw.includes('bangladesh') || raw.includes('ban')) { variants.add('ban'); variants.add('bangladesh'); }
    if (raw.includes('afghanistan') || raw.includes('afg')) { variants.add('afg'); variants.add('afghanistan'); }
    if (raw.includes('new zealand') || raw.includes('nz')) { variants.add('nz'); variants.add('new-zealand'); }
    if (raw.includes('zimbabwe') || raw.includes('zim')) { variants.add('zim'); variants.add('zimbabwe'); }
    if (raw.includes('ireland') || raw.includes('ire')) { variants.add('ire'); variants.add('ireland'); }
    if (raw.includes('jammu') || raw.includes('kashmir') || raw.includes('j & k') || raw.includes('jk')) { variants.add('jk'); variants.add('jammu'); }
    if (raw.includes('rest of india') || raw.includes('roi')) { variants.add('roi'); }
    if (raw.includes('brampton') || raw.includes('bbz') || raw.includes('brb')) { variants.add('bbz'); variants.add('brampton'); }
    if (raw.includes('montreal') || raw.includes('mrt')) { variants.add('mrt'); variants.add('montreal'); }
    if (raw.includes('toronto') || raw.includes('tts') || raw.includes('tss')) { variants.add('tts'); variants.add('toronto'); }
    if (raw.includes('mississauga') || raw.includes('mgm') || raw.includes('mim')) { variants.add('mgm'); variants.add('mississauga'); }
    if (raw.includes('vancouver') || raw.includes('vac') || raw.includes('vaa') || raw.includes('vaw')) { variants.add('vac'); variants.add('vancouver'); }
    if (raw.includes('white rock') || raw.includes('wrw')) { variants.add('wrw'); variants.add('white-rock'); }
    if (raw.includes('western province') || raw.includes('wp') || raw.includes('wpr')) { variants.add('wp'); variants.add('western-province'); }
    if (raw.includes('lions') || raw.includes('lio')) { variants.add('lio'); variants.add('lions'); }
    if (raw.includes('warriors') || raw.includes('war')) { variants.add('war'); variants.add('warriors'); }
    if (raw.includes('dolphins') || raw.includes('dol') || raw.includes('dolph')) { variants.add('dol'); variants.add('dolphins'); }
    if (raw.includes('limpopo') || raw.includes('lmp') || raw.includes('limpo')) { variants.add('lmp'); variants.add('limpopo'); }
    if (raw.includes('state bank') || raw.includes('sbp')) { variants.add('sbp'); }
    if (raw.includes('oil & gas') || raw.includes('ogd') || raw.includes('o&g')) { variants.add('ogd'); }
    if (raw.includes('emirates') || raw.includes('emr')) { variants.add('emr'); }
    if (raw.includes('ajman') || raw.includes('ajt')) { variants.add('ajt'); }
    if (raw.includes('sharjah') || raw.includes('sha')) { variants.add('sha'); }
    if (raw.includes('dubai') || raw.includes('dub')) { variants.add('dub'); }
    if (raw.includes('titans') || raw.includes('ttn')) { variants.add('titans'); }

    return Array.from(variants);
  }

  static resolveCrexUrl(match) {
    if (!match) return 'https://crex.com/cricket-live-score';

    // 1. Direct key match in _crexLinkMap
    if (match.rawId && this._crexLinkMap.has(match.rawId)) {
      return this._crexLinkMap.get(match.rawId);
    }

    // 2. Already authentic CREX match updates link
    if (match.matchUrl && match.matchUrl.startsWith('https://crex.com/cricket-live-score/') && match.matchUrl.includes('-updates-')) {
      return match.matchUrl;
    }

    const t1Name = match.team1?.name || '';
    const t1Short = match.team1?.shortName || '';
    const t2Name = match.team2?.name || '';
    const t2Short = match.team2?.shortName || '';
    const sName = match.seriesName || '';
    const format = (match.format || '').toLowerCase();

    const t1Vars = this.getTeamVariants(t1Name, t1Short);
    const t2Vars = this.getTeamVariants(t2Name, t2Short);

    // 3. Search scraped CREX hrefs for canonical slug match
    let bestHref = null;
    let bestScore = -1;

    for (const href of this._crexHrefs) {
      const hLower = href.toLowerCase();
      const t1Match = t1Vars.some(v => hLower.includes(v));
      const t2Match = t2Vars.some(v => hLower.includes(v));

      if (t1Match && t2Match) {
        let score = 100;

        if (format && (hLower.includes(format) || (format === 'odi' && hLower.includes('odi')) || (format.includes('t20') && hLower.includes('t20')) || (format.includes('test') && hLower.includes('test')))) {
          score += 30;
        }

        if (sName) {
          const sWords = sName.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 2);
          for (const sw of sWords) {
            if (hLower.includes(sw)) score += 10;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestHref = href;
        }
      }
    }

    if (bestHref) {
      return bestHref.startsWith('http') ? bestHref : `https://crex.com${bestHref}`;
    }

    // 4. Safe fallback for matches not present on CREX:
    // If the match has a valid ESPNcricinfo scorecard URL, use it (100% working live match details with zero 404)
    if (match.cricinfoUrl && typeof match.cricinfoUrl === 'string' && match.cricinfoUrl.startsWith('http')) {
      return match.cricinfoUrl;
    }

    // Default to official CREX live score overview (Status 200)
    return 'https://crex.com/cricket-live-score';
  }

  static async fetchMatches() {
    try {
      const allMatches = await this.fetchLiveState();

      // Parallel enrichment strictly for active LIVE matches (up to 4)
      const enrichList = allMatches.filter(m => m.isLive);
      if (enrichList.length > 0) {
        await Promise.allSettled(
          enrichList.slice(0, 4).map(async m => {
            try {
              if (m.id.startsWith('cr_crex_') || m.id.startsWith('cr_live_')) {
                await this.enrichMatch(m);
              }
            } catch (_) {}
          })
        );
      }
      const liveMatches = allMatches.filter(m => m.isLive);

      // Group by normalized series name
      const seriesGroupsMap = new Map();
      for (const m of allMatches) {
        const rawName = decodeHtmlEntities(m.seriesName || 'Cricket Series');
        const normKey = rawName.toLowerCase()
          .replace(/\b20\d\d(\s*[\/\-]\s*\d{2,4})?\b/g, '')
          .replace(/[^a-z0-9]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        const groupKey = normKey || rawName.toLowerCase();
        if (!seriesGroupsMap.has(groupKey)) {
          seriesGroupsMap.set(groupKey, {
            seriesName: rawName,
            matches: []
          });
        }
        seriesGroupsMap.get(groupKey).matches.push(m);
      }

      const seriesGroups = [];
      for (const [key, groupData] of seriesGroupsMap.entries()) {
        const sMatches = groupData.matches;
        const sName = groupData.seriesName;
        sMatches.sort((a, b) => {
          if (a.isLive && !b.isLive) return -1;
          if (!a.isLive && b.isLive) return 1;
          if (a.isFinished && b.isUpcoming) return -1;
          if (a.isUpcoming && b.isFinished) return 1;
          if (a.isFinished && b.isFinished) {
            if (a.startTime && b.startTime) {
              return new Date(b.startTime) - new Date(a.startTime);
            }
            return 0;
          }
          if (a.isUpcoming && b.isUpcoming && a.startTime && b.startTime) {
            return new Date(a.startTime) - new Date(b.startTime);
          }
          return 0;
        });

        // Find best logo across matches in this series or dedicated tournament map
        const sLogo = (sMatches.find(m => m.seriesLogo && !m.seriesLogo.includes('c7693') && !m.seriesLogo.includes('8048.png'))?.seriesLogo) ||
                      FavoritesService.getTournamentLogo(sName) ||
                      (sMatches.find(m => m.seriesLogo)?.seriesLogo) ||
                      'https://static.cricbuzz.com/a/img/v1/72x54/i1/c7693/series.jpg';

        // Normalize seriesLogo on all matches in this series
        sMatches.forEach(m => {
          if (!m.seriesLogo || m.seriesLogo.includes('8048.png')) {
            m.seriesLogo = sLogo;
          }
        });

        seriesGroups.push({
          seriesName: sName,
          seriesLogo: sLogo,
          matches: sMatches
        });
      }

      // Sort series groups: Popularity (live / finished / upcoming) -> Other Live -> Other Upcoming -> Other Finished
      seriesGroups.sort((a, b) => {
        const aRank = this.getSeriesSortRank(a);
        const bRank = this.getSeriesSortRank(b);
        return bRank - aRank;
      });

      return {
        sport: 'cricket',
        allMatches,
        liveMatches,
        series: seriesGroups,
        liveCount: liveMatches.length
      };
    } catch (err) {
      console.error('Error in CricketService.fetchMatches:', err);
      return { sport: 'cricket', allMatches: [], liveMatches: [], series: [], liveCount: 0 };
    }
  }

  /**
   * Comprehensive Cricket Series Sort Rank:
   * 1. Popular Series / Tournaments (ICC, IPL, Bilaterals, Tier 1 T20 leagues: popularity >= 750):
   *    - Live popular matches first (20000 + popularity)
   *    - Finished ("maybe already over") / Upcoming popular matches next (10000 + popularity)
   * 2. Other Non-Tier-1 Competitions with LIVE matches (5000 + popularity)
   * 3. Other Non-Tier-1 Competitions with UPCOMING matches (1000 + popularity)
   * 4. Other Non-Tier-1 Competitions with FINISHED matches (popularity)
   */
  static getSeriesSortRank(series) {
    const popularity = this.getSeriesPopularity(series);
    const matches = series.matches || [];
    const hasLive = matches.some(m => m.isLive);
    const hasUpcoming = matches.some(m => m.isUpcoming);

    const isPopular = popularity >= 750;

    if (isPopular) {
      if (hasLive) return 20000 + popularity;
      return 10000 + popularity;
    }

    if (hasLive) return 5000 + popularity;
    if (hasUpcoming) return 1000 + popularity;
    return popularity;
  }

  /**
   * Calculates popularity score for cricket series / tournaments
   */
  static getSeriesPopularity(series) {
    if (!series) return 0;
    const name = (typeof series === 'string' ? series : (series.seriesName || series.name || '')).toLowerCase();

    // ICC Tournaments & World Cups
    if (name.includes('world cup') || name.includes('t20 world cup') || name.includes('champions trophy') || name.includes('world test championship')) {
      return 1500;
    }
    // IPL
    if (name.includes('indian premier league') || name.includes('ipl')) {
      return 1400;
    }
    // Bilateral International / Ashes
    if (name.includes('ashes') || name.includes('border-gavaskar') || name.includes('test series') || name.includes('odi series') || name.includes('t20i series') || name.includes('tour of')) {
      return 1250;
    }
    // Top T20 Franchise Leagues
    if (name.includes('bbl') || name.includes('big bash') || name.includes('psl') || name.includes('pakistan super league') || name.includes('cpl') || name.includes('caribbean premier league') || name.includes('sa20') || name.includes('the hundred') || name.includes('wpl') || name.includes("women's premier league")) {
      return 1100;
    }
    // Other Franchise Leagues
    if (name.includes('ilt20') || name.includes('bpl') || name.includes('bangladesh premier league') || name.includes('super smash') || name.includes('major league cricket') || name.includes('mlc') || name.includes('lpl') || name.includes('lanka premier league')) {
      return 950;
    }
    // Top Domestic First-Class / List A
    if (name.includes('ranji trophy') || name.includes('county championship') || name.includes('sheffield shield') || name.includes('vitality blast') || name.includes('syed mushtaq') || name.includes('vijay hazare') || name.includes('marsh one-day')) {
      return 750;
    }
    // Check if any match in this series has international teams
    if (series.matches && Array.isArray(series.matches)) {
      const isIntl = series.matches.some(m => {
        const t1 = (m.team1?.name || '').toLowerCase();
        const t2 = (m.team2?.name || '').toLowerCase();
        const intlTeams = ['india', 'australia', 'england', 'south africa', 'pakistan', 'new zealand', 'west indies', 'sri lanka', 'bangladesh', 'afghanistan', 'ireland', 'zimbabwe'];
        return intlTeams.some(t => t1.includes(t) || t2.includes(t));
      });
      if (isIntl) return 1000;
    }

    return 500;
  }

  static async enrichMatch(matchObj) {
    try {
      const matchKey = typeof matchObj === 'string' ? matchObj : matchObj?.rawId;
      if (!matchKey) return null;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`https://crex.com/scoreboard/${matchKey}`, {
        headers: { 'Accept': 'text/html' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      const html = await res.text();
      const match = html.match(/<script id="app-root-state" type="application\/json">([\s\S]*?)<\/script>/);
      if (!match) return null;
      const jsonStr = match[1].replace(/&q;/g, '"').replace(/&a;/g, '&');
      const state = JSON.parse(jsonStr);
      const sv3 = state['https://api.goscorer.com/api/v3/getSV3'];
      if (!sv3) return null;

      let currentOverBalls = [];
      let currentOverNumber = '';
      let currentOverTotal = null;
      let previousOverBalls = [];
      let previousOverNumber = '';
      let previousOverTotal = null;
      let recentOvers = [];

      // 1. Primary: sv3.lastovers array
      if (sv3.lastovers && Array.isArray(sv3.lastovers) && sv3.lastovers.length > 0) {
        recentOvers = sv3.lastovers.map(o => ({
          over: o.over || '',
          balls: Array.isArray(o.overinfo) ? o.overinfo : [],
          total: o.total !== undefined ? o.total : null
        })).filter(o => o.balls.length > 0);

        if (recentOvers.length > 0) {
          const lastOverObj = recentOvers[recentOvers.length - 1];
          currentOverNumber = lastOverObj.over || 'This Over';
          currentOverBalls = lastOverObj.balls || [];
          currentOverTotal = lastOverObj.total !== undefined ? lastOverObj.total : null;

          if (recentOvers.length >= 2) {
            const prevOverObj = recentOvers[recentOvers.length - 2];
            previousOverNumber = prevOverObj.over || 'Prev Ov';
            previousOverBalls = prevOverObj.balls || [];
            previousOverTotal = prevOverObj.total !== undefined ? prevOverObj.total : null;
          }
        }
      }

      // 2. Fallback: sv3.rb array
      if (currentOverBalls.length === 0 && sv3.rb && Array.isArray(sv3.rb) && sv3.rb.length > 0) {
        const lastRb = sv3.rb[sv3.rb.length - 1];
        if (lastRb && lastRb.b && Array.isArray(lastRb.b)) {
          currentOverNumber = `Over ${lastRb.o || ''}`;
          currentOverBalls = lastRb.b.map(bObj => bObj.u || String(bObj.d || '0'));
          currentOverTotal = lastRb.r !== undefined ? lastRb.r : null;
        }
        if (sv3.rb.length >= 2) {
          const prevRb = sv3.rb[sv3.rb.length - 2];
          if (prevRb && prevRb.b && Array.isArray(prevRb.b)) {
            previousOverNumber = `Over ${prevRb.o || ''}`;
            previousOverBalls = prevRb.b.map(bObj => bObj.u || String(bObj.d || '0'));
            previousOverTotal = prevRb.r !== undefined ? prevRb.r : null;
          }
        }
      }

      // 3. Fallback: sv3.A or sv3.d ball strings
      if (currentOverBalls.length === 0 && sv3.A && typeof sv3.A === 'string') {
        const balls = sv3.A.split('.').filter(Boolean);
        if (balls.length > 0) {
          currentOverNumber = 'This Over';
          currentOverBalls = balls;
        }
      }

      // Extract latest ball result (e.g., '0', '1', '4', '6', 'W', 'WD', 'NB')
      let latestBall = '';
      if (currentOverBalls.length > 0) {
        latestBall = String(currentOverBalls[currentOverBalls.length - 1]).trim();
      }
      if (!latestBall && sv3.B && /^\d+$|^[w|wd|nb|lb|b]$/i.test(String(sv3.B).trim())) {
        latestBall = String(sv3.B).trim();
      }
      if (!latestBall && sv3.a && !String(sv3.a).includes('.') && String(sv3.a).length <= 4 && /^\d+$|^[w|wd|nb|lb|b]$/i.test(String(sv3.a).trim())) {
        latestBall = String(sv3.a).trim();
      }

      // Check match break / halt (Innings Break, Rain Delay, Tea, Lunch, Drinks, Stumps)
      let breakStatus = null;
      const bText = (sv3.B || '').toLowerCase();
      if (bText.includes('break') || bText.includes('rain') || bText.includes('tea') || bText.includes('lunch') || bText.includes('drinks') || bText.includes('delay') || bText.includes('stumps') || bText.includes('timeout')) {
        if (bText.includes('innings break') || bText.includes('inn break')) breakStatus = 'Innings Break';
        else if (bText.includes('rain') || bText.includes('delay')) breakStatus = 'Rain Delay';
        else if (bText.includes('tea')) breakStatus = 'Tea';
        else if (bText.includes('lunch')) breakStatus = 'Lunch';
        else if (bText.includes('drinks')) breakStatus = 'Drinks';
        else if (bText.includes('stumps')) breakStatus = 'Stumps';
        else if (bText.includes('timeout')) breakStatus = 'Timeout';
        else breakStatus = sv3.B;
      }

      // Extract genuine situation commentary (exclude if it's just the ball outcome)
      let rawComment = sv3.comment1 || sv3.decision || sv3.toss || '';
      if (!rawComment && sv3.B && !breakStatus && sv3.B !== latestBall) {
        rawComment = sv3.B;
      }
      let cleanComment = cleanCricketText(rawComment);
      if (cleanComment && (cleanComment.toLowerCase() === latestBall.toLowerCase() || /^([0-6]|w|wd|nb|bye|lb|\d)$/i.test(cleanComment.trim()))) {
        cleanComment = '';
      }

      const striker = sv3.pname1 ? {
        name: sv3.player_full_name1 || sv3.pname1,
        runs: sv3.run1 || '0',
        balls: (sv3.ball1 || '').replace(/[\(\)]/g, ''),
        onStrike: sv3.os1 === 1
      } : null;

      const nonStriker = sv3.pname2 ? {
        name: sv3.player_full_name2 || sv3.pname2,
        runs: sv3.run2 || '0',
        balls: (sv3.ball2 || '').replace(/[\(\)]/g, ''),
        onStrike: sv3.os2 === 1
      } : null;

      const bowler = sv3.bname ? {
        name: sv3.bowler_full_name || sv3.bname,
        figures: sv3.bwr || '',
        overs: sv3.bover || '',
        eco: sv3.beco || ''
      } : null;

      const partnership = (sv3.partnerruns !== undefined && sv3.partnerruns !== null) ? {
        runs: String(sv3.partnerruns),
        balls: sv3.partnerballs ? String(sv3.partnerballs) : ''
      } : null;

      // In sv3, score1/over1 is ALWAYS for the active batting / 2nd innings team (sv3.team1)
      // score2/over2 is ALWAYS for the other team (sv3.team2)
      const sv3T1ScoreParsed = parseScoreAndOvers(sv3.score1 || sv3.team1score || sv3.j, sv3.over1 || sv3.t1over);
      const sv3T2ScoreParsed = parseScoreAndOvers(sv3.score2 || sv3.team2score || sv3.k, sv3.over2 || sv3.t2over);

      // If matchObj is provided, align properly to matchObj.team1 and matchObj.team2
      if (typeof matchObj === 'object' && matchObj.team1 && matchObj.team2) {
        const sv3T1Name = (sv3.team1_f_n || sv3.team1 || '').toLowerCase().trim();
        const sv3T2Name = (sv3.team2_f_n || sv3.team2 || '').toLowerCase().trim();
        const sv3T1Code = (sv3.team1short || sv3.team1 || '').toLowerCase().trim();
        const sv3T2Code = (sv3.team2short || sv3.team2 || '').toLowerCase().trim();

        const m1Name = (matchObj.team1.name || '').toLowerCase().trim();
        const m1Short = (matchObj.team1.shortName || '').toLowerCase().trim();
        const m2Name = (matchObj.team2.name || '').toLowerCase().trim();
        const m2Short = (matchObj.team2.shortName || '').toLowerCase().trim();

        const matchesT1 = (sv3T1Name && (m1Name.includes(sv3T1Name) || sv3T1Name.includes(m1Name))) ||
                          (sv3T1Code && (m1Short.includes(sv3T1Code) || sv3T1Code.includes(m1Short))) ||
                          (sv3T2Name && (m2Name.includes(sv3T2Name) || sv3T2Name.includes(m2Name)));

        const matchesT2 = (sv3T1Name && (m2Name.includes(sv3T1Name) || sv3T1Name.includes(m2Name))) ||
                          (sv3T1Code && (m2Short.includes(sv3T1Code) || sv3T1Code.includes(m2Short))) ||
                          (sv3T2Name && (m1Name.includes(sv3T2Name) || sv3T2Name.includes(m1Name)));

        const isSv3Team2 = matchesT2 && !matchesT1;

        if (isSv3Team2) {
          if (sv3T1ScoreParsed.score) matchObj.team2.score = sv3T1ScoreParsed.score;
          if (sv3T1ScoreParsed.overs) matchObj.team2.overs = sv3T1ScoreParsed.overs;
          if (sv3T2ScoreParsed.score) matchObj.team1.score = sv3T2ScoreParsed.score;
          if (sv3T2ScoreParsed.overs) matchObj.team1.overs = sv3T2ScoreParsed.overs;
          matchObj.team2.isBatting = !breakStatus || breakStatus !== 'Innings Break';
          matchObj.team1.isBatting = false;
        } else {
          if (sv3T1ScoreParsed.score) matchObj.team1.score = sv3T1ScoreParsed.score;
          if (sv3T1ScoreParsed.overs) matchObj.team1.overs = sv3T1ScoreParsed.overs;
          if (sv3T2ScoreParsed.score) matchObj.team2.score = sv3T2ScoreParsed.score;
          if (sv3T2ScoreParsed.overs) matchObj.team2.overs = sv3T2ScoreParsed.overs;
          matchObj.team1.isBatting = !breakStatus || breakStatus !== 'Innings Break';
          matchObj.team2.isBatting = false;
        }

        if (breakStatus === 'Innings Break') {
          matchObj.team1.isBatting = false;
          matchObj.team2.isBatting = false;
        }

        matchObj.latestBall = latestBall;
        matchObj.breakStatus = breakStatus;
        matchObj.currentOverBalls = currentOverBalls;
        matchObj.currentOverNumber = currentOverNumber;
        matchObj.currentOverTotal = currentOverTotal;
        matchObj.previousOverBalls = previousOverBalls;
        matchObj.previousOverNumber = previousOverNumber;
        matchObj.previousOverTotal = previousOverTotal;
        matchObj.recentOvers = recentOvers;
        if (sv3.target) matchObj.target = sv3.target;
        if (sv3.crr) matchObj.crr = sv3.crr;
        if (sv3.rrr) matchObj.rrr = sv3.rrr;
        if (cleanComment) matchObj.situation = cleanComment;
        matchObj.striker = striker;
        matchObj.nonStriker = nonStriker;
        matchObj.bowler = bowler;
        matchObj.partnership = partnership;
      }

      return {
        latestBall,
        breakStatus,
        currentOverBalls,
        currentOverNumber,
        currentOverTotal,
        previousOverBalls,
        previousOverNumber,
        previousOverTotal,
        recentOvers,
        target: sv3.target || null,
        crr: sv3.crr || null,
        rrr: sv3.rrr || null,
        situation: cleanComment || null,
        striker,
        nonStriker,
        bowler,
        partnership
      };
    } catch (_) {
      return null;
    }
  }

  static async fetchLiveState() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch('https://crex.com', {
        headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) return [];

      const html = await res.text();

      const matchHrefRegex = /href="(\/(?:cricket-live-score|scoreboard)\/[^"]+)"/g;
      const liveLinkMap = new Map();
      const hrefsList = [];
      let matchLink;
      while ((matchLink = matchHrefRegex.exec(html)) !== null) {
        const link = matchLink[1];
        hrefsList.push(link);
        const keyMatch = link.match(/-([a-zA-Z0-9]+)$/) || link.match(/\/([a-zA-Z0-9]+)$/);
        if (keyMatch) {
          liveLinkMap.set(keyMatch[1], 'https://crex.com' + link);
        }
      }

      this._crexLinkMap = liveLinkMap;
      this._crexHrefs = hrefsList;

      const match = html.match(/<script id="app-root-state" type="application\/json">([\s\S]*?)<\/script>/);
      if (!match || !match[1]) return [];

      const jsonStr = match[1].replace(/&q;/g, '"').replace(/&a;/g, '&');
      const state = JSON.parse(jsonStr);

      const liveData = state['https://api.goscorer.com/api/v3/getLiveMatches'] || {};
      const mapData = state['https://oc.crickapi.com/mapping/getHomeMapDatahome'] || {};

      const teamsMap = {};
      if (mapData.t) {
        for (const key of Object.keys(mapData.t)) {
          const t = mapData.t[key];
          if (t && t.f_key) teamsMap[t.f_key] = t;
        }
      }

      const seriesMap = {};
      if (mapData.s) {
        for (const key of Object.keys(mapData.s)) {
          const s = mapData.s[key];
          if (s && s.f_key) seriesMap[s.f_key] = s;
        }
      }

      const matches = [];

      for (const [matchKey, m] of Object.entries(liveData)) {
        if (!m || typeof m !== 'object') continue;

        const t1Info = teamsMap[m.b] || {};
        const t2Info = teamsMap[m.c] || {};
        const sInfo = seriesMap[m.q] || {};

        const team1Name = t1Info.n || m.team1 || m.t1Sname || t1Info.sn;
        const team2Name = t2Info.n || m.team2 || m.t2Sname || t2Info.sn;

        if (!team1Name && !team2Name) continue;

        const team1Short = m.t1Sname || t1Info.sn || t1Info.n || team1Name || 'T1';
        const team2Short = m.t2Sname || t2Info.sn || t2Info.n || team2Name || 'T2';

        // Dual score & overs extraction (over1 for team 1, over2 for team 2)
        const t1ScoreParsed = parseScoreAndOvers(m.team1score || m.t1score || m.j, m.t1over || m.over1);
        const t2ScoreParsed = parseScoreAndOvers(m.team2score || m.t2score || m.k, m.t2over || m.over2);

        const team1Score = t1ScoreParsed.score || '';
        let team1Overs = t1ScoreParsed.overs || '';

        const team2Score = t2ScoreParsed.score || '';
        let team2Overs = t2ScoreParsed.overs || '';

        // Authentic status detection based on CREX s codes (s:2 = Finished, s:1 = Live, s:0 = Upcoming)
        let isFinished = false;
        let isLive = false;
        let isUpcoming = false;

        if (m.s === 2 || (m.finishTime && m.finishTime > 0)) {
          isFinished = true;
        } else if (m.s === 1) {
          isLive = true;
        } else if (m.s === 0) {
          isUpcoming = true;
        } else {
          const finishedKeywords = ['won by', 'tied', 'match drawn', 'no result', 'abandoned', 'conceded', 'walkover'];
          const fullStatusText = `${m.res || ''} ${m.soResult || ''} ${m.a || ''}`.toLowerCase();
          if (finishedKeywords.some(kw => fullStatusText.includes(kw))) {
            isFinished = true;
          } else if (team1Score || team2Score || m.j || m.k) {
            isLive = true;
          } else {
            isUpcoming = true;
          }
        }

        // Millisecond timestamp extraction from CREX live feed (tiMs, ti, finishTime)
        let rawTimestamp = null;
        if (typeof m.tiMs === 'number' && m.tiMs > 0) {
          rawTimestamp = m.tiMs;
        } else if (m.ti && !isNaN(Number(m.ti)) && Number(m.ti) > 100000000000) {
          rawTimestamp = Number(m.ti);
        } else if (typeof m.finishTime === 'number' && m.finishTime > 0) {
          rawTimestamp = m.finishTime;
        } else if (m.starttime || m.stime || m.date) {
          const raw = m.starttime || m.stime || m.date;
          if (typeof raw === 'number' || !isNaN(Number(raw))) {
            const num = Number(raw);
            rawTimestamp = num > 100000000000 ? num : num * 1000;
          } else if (typeof raw === 'string') {
            const parsed = new Date(raw).getTime();
            if (!isNaN(parsed)) rawTimestamp = parsed;
          }
        }

        let cleanStartTime = null;
        let dateDisplay = '';
        if (rawTimestamp) {
          try {
            const d = new Date(rawTimestamp);
            if (!isNaN(d.getTime())) {
              cleanStartTime = d.toISOString();
              const nowDate = new Date();
              const isToday = d.toDateString() === nowDate.toDateString();
              const yestDate = new Date(nowDate); yestDate.setDate(yestDate.getDate() - 1);
              const isYesterday = d.toDateString() === yestDate.toDateString();
              const tomDate = new Date(nowDate); tomDate.setDate(tomDate.getDate() + 1);
              const isTomorrow = d.toDateString() === tomDate.toDateString();
              if (isToday) dateDisplay = 'Today';
              else if (isYesterday) dateDisplay = 'Yesterday';
              else if (isTomorrow) dateDisplay = 'Tomorrow';
              else dateDisplay = d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
            }
          } catch (_) {}
        }

        if (!dateDisplay) {
          if (m.time === 'Tomorrow' || m.time === 'Today' || m.time === 'Yesterday') {
            dateDisplay = m.time;
          } else if (m.matchDay && (m.matchDay.includes('Today') || m.matchDay.includes('Yesterday') || m.matchDay.includes('Tomorrow'))) {
            dateDisplay = m.matchDay;
          }
        }

        let statusDisplay = '';
        if (isFinished) {
          statusDisplay = cleanCricketText(m.res || m.soResult || m.a) || 'Match Finished';
        } else if (isLive) {
          statusDisplay = cleanCricketText(m.res || m.a) || (team2Overs || team1Overs ? `Live • Over ${team2Overs || team1Overs}` : 'LIVE');
        } else {
          let timeText = '';
          if (cleanStartTime) {
            try {
              const d = new Date(cleanStartTime);
              timeText = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch (_) {}
          }
          if (!timeText && m.matchDay && /^\d{1,2}:\d{2}\s*(?:AM|PM)?$/i.test(m.matchDay.trim())) {
            timeText = m.matchDay.trim();
          }
          if (!timeText && m.time && /^\d{1,2}:\d{2}\s*(?:AM|PM)?$/i.test(m.time.trim())) {
            timeText = m.time.trim();
          }

          if (dateDisplay === 'Tomorrow' && timeText) {
            statusDisplay = `Tomorrow, ${timeText}`;
          } else if (dateDisplay === 'Today' && timeText) {
            statusDisplay = `Today, ${timeText}`;
          } else if (timeText) {
            statusDisplay = `Starts at ${timeText}`;
          } else {
            statusDisplay = m.time || 'Upcoming';
          }
        }

        const rawSName = m.sfullname || m.sname || sInfo.n || sInfo.sn || 'Cricket Tournament';
        const sName = decodeHtmlEntities(rawSName);

        const liveMatchUrl = this.resolveCrexUrl({
          rawId: matchKey,
          team1: { name: team1Name, shortName: team1Short },
          team2: { name: team2Name, shortName: team2Short },
          seriesName: sName,
          format: m.fo || m.format || ''
        });

        let latestBall = '';
        if (isLive && m.a && /^(\d[a-zA-Z]*|[a-zA-Z]{1,4}|\d)$/.test(String(m.a).trim()) && String(m.a).trim().length <= 4) {
          latestBall = String(m.a).trim();
        }

        let matchSituation = '';
        if (isLive) {
          const cleanA = cleanCricketText(m.a);
          if (cleanA && cleanA.toLowerCase() !== latestBall.toLowerCase() && !/^([0-6]|w|wd|nb|bye|lb|\d)$/i.test(cleanA.trim())) {
            matchSituation = cleanA;
          }
        } else if (isFinished) {
          matchSituation = cleanCricketText(m.res || m.soResult || m.a) || '';
        }

        let isT1Batting = false;
        let isT2Batting = false;
        if (isLive) {
          const t1OvVal = parseFloat(String(team1Overs).replace(/[^\d.]/g, '')) || 0;
          const t2OvVal = parseFloat(String(team2Overs).replace(/[^\d.]/g, '')) || 0;
          const t1HasScore = Boolean(team1Score && team1Score !== '-' && !team1Score.toLowerCase().includes('yet'));
          const t2HasScore = Boolean(team2Score && team2Score !== '-' && !team2Score.toLowerCase().includes('yet'));

          if (m.inningFActive) {
            if (t1HasScore && !t2HasScore) {
              isT1Batting = true;
            } else if (t2HasScore && !t1HasScore) {
              isT2Batting = true;
            } else {
              isT1Batting = true;
            }
          } else if (m.inningSActive) {
            if (t1OvVal >= 20.0 || (team1Score && team1Score.includes('/10'))) {
              isT2Batting = true;
            } else if (t2OvVal >= 20.0 || (team2Score && team2Score.includes('/10'))) {
              isT1Batting = true;
            } else if (t1HasScore && t2HasScore) {
              isT2Batting = (t2OvVal < t1OvVal);
              isT1Batting = !isT2Batting;
            } else {
              isT2Batting = true;
            }
          }
        }

        matches.push({
          id: `cr_live_${matchKey}`,
          rawId: matchKey,
          sport: 'cricket',
          seriesName: sName,
          seriesLogo: FavoritesService.getTournamentLogo(sName) || FavoritesService.getCricketLogo(sName) || 'https://static.cricbuzz.com/a/img/v1/72x54/i1/c7693/series.jpg',
          format: m.fo || m.format || 'Match',
          matchTitle: `${team1Short} vs ${team2Short}`,
          venue: decodeHtmlEntities(m.vname || ''),
          isLive: isLive,
          isFinished: isFinished,
          isUpcoming: isUpcoming,
          dateDisplay: dateDisplay,
          startTime: cleanStartTime || rawStart || null,
          statusText: statusDisplay,
          situation: matchSituation || null,
          latestBall: latestBall || null,
          target: m.target || null,
          matchUrl: liveMatchUrl,
          team1: {
            name: decodeHtmlEntities(team1Name || 'Team 1'),
            shortName: team1Short,
            score: team1Score,
            overs: team1Overs,
            isBatting: isT1Batting,
            flag: FavoritesService.getCricketLogo(team1Name, team1Short, sName) || m.team1flag || (m.b ? `https://cricketvectors.akamaized.net/Teams/${m.b}.png` : '')
          },
          team2: {
            name: decodeHtmlEntities(team2Name || 'Team 2'),
            shortName: team2Short,
            score: team2Score,
            overs: team2Overs,
            isBatting: isT2Batting,
            flag: FavoritesService.getCricketLogo(team2Name, team2Short, sName) || m.team2flag || (m.c ? `https://cricketvectors.akamaized.net/Teams/${m.c}.png` : '')
          }
        });
      }

      return matches;
    } catch (_) {
      return [];
    }
  }
}

function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&q;/g, '"')
    .replace(/&a;/g, '&')
    .replace(/&s;s\b/gi, "'s")
    .replace(/&s;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .trim();
}
