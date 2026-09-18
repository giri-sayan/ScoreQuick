/**
 * ScoreQuick - Cricket Service (ESPNcricinfo & CREX)
 * Fetches real-time cricket matches, live ball-by-ball scores, overs, and series.
 * Enriches active matches with current over balls, previous over balls, batsmen on crease, bowler figures, and target situations.
 */

import { FavoritesService } from './favorites.js';

function cleanCricketText(str) {
  if (!str) return '';
  return String(str)
    .replace(/&l;[\s\S]*?&g;/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-zA-Z0-9#]+;/g, ' ')
    .replace(/^&[0-9a-zA-Z]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseScoreAndOvers(scoreField, overField) {
  let score = '';
  let overs = '';

  if (scoreField) {
    const sStr = String(scoreField).trim();
    const ovMatch = sStr.match(/\(([\d\.]+)\s*(?:ov|overs)?\)/i) || sStr.match(/([\d\.]+)\s*(?:ov|overs)/i);
    if (ovMatch) {
      overs = ovMatch[1];
      score = sStr.replace(ovMatch[0], '').replace(/[\(\)]/g, '').trim();
    } else {
      score = sStr.replace(/[\(\)]/g, '').trim();
    }
  }

  if (!overs && overField) {
    const oStr = String(overField).replace(/[\(\)]/g, '').replace(/\s*ov(ers)?/gi, '').trim();
    if (oStr && oStr !== '0' && oStr !== '0.0') {
      overs = oStr;
    }
  }

  return { score, overs };
}

export class CrexService {
  static async fetchMatches() {
    try {
      const [crexResult, espnResult] = await Promise.allSettled([
        this.fetchCrexState(),
        this.fetchEspnMultiDay()
      ]);

      const crexMatches = crexResult.status === 'fulfilled' ? crexResult.value : [];
      const espnMatches = espnResult.status === 'fulfilled' ? espnResult.value : [];

      const allMatches = this.mergeCricketMatches(crexMatches, espnMatches);

      // Parallel enrichment for active matches (ball feeds, current over, crease batsmen & bowler)
      const enrichList = allMatches.filter(m => m.isLive || (m.isFinished && m.id.startsWith('cr_crex_')));
      if (enrichList.length > 0) {
        await Promise.allSettled(
          enrichList.slice(0, 10).map(async m => {
            try {
              if (m.id.startsWith('cr_crex_')) {
                const en = await this.enrichCrexMatch(m.rawId);
                if (en) {
                  Object.assign(m, en);
                  if (en.team1Overs && !m.team1.overs) m.team1.overs = en.team1Overs;
                  if (en.team2Overs && !m.team2.overs) m.team2.overs = en.team2Overs;
                  if (en.team1Score && (!m.team1.score || m.team1.score === '-')) m.team1.score = en.team1Score;
                  if (en.team2Score && (!m.team2.score || m.team2.score === '-')) m.team2.score = en.team2Score;
                }
              } else if (m.id.startsWith('cr_espn_') && m.leagueId) {
                const en = await this.enrichEspnMatch(m.leagueId, m.rawId);
                if (en) Object.assign(m, en);
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
        const sLogo = (sMatches.find(m => m.seriesLogo && !m.seriesLogo.includes('8048.png'))?.seriesLogo) ||
                      FavoritesService.getTournamentLogo(sName) ||
                      (sMatches.find(m => m.seriesLogo)?.seriesLogo) ||
                      'https://a.espncdn.com/i/leaguelogos/cricket/500/8048.png';

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
      console.error('Error in CrexService.fetchMatches:', err);
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

  static async enrichCrexMatch(matchKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`https://crex.live/scoreboard/${matchKey}`, {
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

      // Clean encoded situation
      const cleanComment = cleanCricketText(sv3.B || sv3.comment1 || sv3.a || '');

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

      // Extract overs for both teams
      const t1OvParsed = parseScoreAndOvers(sv3.score2 || sv3.j, sv3.over2 || sv3.t1over);
      const t2OvParsed = parseScoreAndOvers(sv3.score1 || sv3.k, sv3.over1 || sv3.t2over);

      return {
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
        partnership,
        team1Overs: t1OvParsed.overs || null,
        team2Overs: t2OvParsed.overs || null,
        team1Score: t1OvParsed.score || null,
        team2Score: t2OvParsed.score || null
      };
    } catch (_) {
      return null;
    }
  }

  static async enrichEspnMatch(leagueId, eventId) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/cricket/${leagueId}/summary?event=${eventId}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) return null;
      const d = await res.json();
      const title = d.header?.title || '';
      let liveDetail = '';
      let liveOver = '';
      let striker = null;
      let nonStriker = null;
      let bowler = null;

      if (title.includes('(') && title.includes(')')) {
        const inside = title.split('(')[1].split(')')[0].trim();
        const parts = inside.split(',').map(p => p.trim());
        for (const p of parts) {
          if (p.includes('ov')) {
            liveOver = p;
          } else if (p.includes('*')) {
            const m = p.match(/^(.+?)\s+(\d+)\*?$/);
            if (m) {
              const bObj = { name: m[1].trim(), runs: m[2], balls: '', onStrike: p.endsWith('*') };
              if (!striker) striker = bObj;
              else if (!nonStriker) nonStriker = bObj;
            }
          } else if (/\d+\/\d+/.test(p)) {
            const m = p.match(/^(.+?)\s+(\d+\/\d+)$/);
            if (m) bowler = { name: m[1].trim(), figures: m[2] };
          } else {
            const m = p.match(/^(.+?)\s+(\d+)$/);
            if (m && !nonStriker) nonStriker = { name: m[1].trim(), runs: m[2], balls: '', onStrike: false };
          }
        }
        liveDetail = parts.slice(1).join(' • ');
      }

      return {
        liveTitle: title,
        liveDetail,
        liveOver,
        striker,
        nonStriker,
        bowler
      };
    } catch (_) {
      return null;
    }
  }

  static async fetchCrexState() {
    try {
      const res = await fetch('https://crex.live', {
        headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' }
      });
      if (!res.ok) return [];

      const html = await res.text();

      const matchHrefRegex = /href="(\/(?:cricket-live-score|scoreboard)\/[^"]+)"/g;
      const crexLinkMap = new Map();
      let matchLink;
      while ((matchLink = matchHrefRegex.exec(html)) !== null) {
        const link = matchLink[1];
        const keyMatch = link.match(/-([a-zA-Z0-9]+)$/) || link.match(/\/([a-zA-Z0-9]+)$/);
        if (keyMatch) {
          crexLinkMap.set(keyMatch[1], 'https://crex.live' + link);
        }
      }

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

        const team1Name = m.team1 || t1Info.n || m.t1Sname || t1Info.sn;
        const team2Name = m.team2 || t2Info.n || m.t2Sname || t2Info.sn;

        if (!team1Name && !team2Name) continue;

        const team1Short = m.t1Sname || t1Info.sn || team1Name || 'T1';
        const team2Short = m.t2Sname || t2Info.sn || team2Name || 'T2';

        // Dual score & overs extraction
        const t1ScoreParsed = parseScoreAndOvers(m.team1score || m.t1score || m.j, m.t1over || m.over2);
        const t2ScoreParsed = parseScoreAndOvers(m.team2score || m.t2score || m.k, m.t2over || m.over1);

        const team1Score = t1ScoreParsed.score || (m.j ? m.j.split('(')[0].trim() : '');
        let team1Overs = t1ScoreParsed.overs || (m.j && m.j.includes('(') ? m.j.split('(')[1].replace(')', '').trim() : '');
        team1Overs = team1Overs.replace(/\s*ov(ers)?/gi, '').trim();

        const team2Score = t2ScoreParsed.score || (m.k ? m.k.split('(')[0].trim() : '');
        let team2Overs = t2ScoreParsed.overs || (m.k && m.k.includes('(') ? m.k.split('(')[1].replace(')', '').trim() : '');
        team2Overs = team2Overs.replace(/\s*ov(ers)?/gi, '').trim();

        const finishedKeywords = ['won by', 'tied', 'match drawn', 'no result', 'abandoned', 'conceded', 'walkover'];
        const breakKeywords = ['break', 'stumps', 'lunch', 'tea', 'delay', 'opt to', 'need', 'trail by', 'lead by', 'target', 'innings'];

        const fullStatusText = `${m.res || ''} ${m.soResult || ''} ${m.a || ''}`.toLowerCase();
        
        let isFinished = Boolean(m.finishTime && m.finishTime > 0);
        if (!isFinished) {
          const hasFinishedKw = finishedKeywords.some(kw => fullStatusText.includes(kw));
          const hasBreakOrLiveKw = breakKeywords.some(kw => fullStatusText.includes(kw));
          if (hasFinishedKw && !hasBreakOrLiveKw) {
            isFinished = true;
          }
        }

        const isLive = !isFinished && Boolean(
          team1Score || team2Score || m.j || m.k || 
          (m.a && breakKeywords.some(kw => m.a.toLowerCase().includes(kw))) ||
          (m.res && breakKeywords.some(kw => m.res.toLowerCase().includes(kw)))
        );
        const isUpcoming = !isFinished && !isLive;

        let statusDisplay = '';
        if (isFinished) {
          statusDisplay = cleanCricketText(m.res || m.soResult || m.a) || 'Match Finished';
        } else if (isLive) {
          statusDisplay = cleanCricketText(m.res || m.a) || (team2Overs || team1Overs ? `Live • Over ${team2Overs || team1Overs}` : 'LIVE');
        } else {
          statusDisplay = m.time ? `Starts at ${m.time}` : 'Upcoming';
        }

        let dateDisplay = '';
        const rawStart = (m.starttime && m.starttime !== 'null') ? m.starttime :
                         (m.stime && m.stime !== 'null') ? m.stime :
                         (m.date && m.date !== 'null') ? m.date : null;
        let cleanStartTime = null;
        if (rawStart) {
          try {
            const d = new Date(rawStart);
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

        const crexUrl = crexLinkMap.get(matchKey) || `https://crex.live/scoreboard/${matchKey}`;
        const rawSName = m.sfullname || m.sname || sInfo.n || sInfo.sn || 'Cricket Tournament';
        const sName = decodeHtmlEntities(rawSName);
        const sVectorLogo = sInfo.f_key ? `https://cricketvectors.akamaized.net/Series/${sInfo.f_key}.png` : '';

        matches.push({
          id: `cr_crex_${matchKey}`,
          rawId: matchKey,
          sport: 'cricket',
          seriesName: sName,
          seriesLogo: sVectorLogo || FavoritesService.getTournamentLogo(sName) || FavoritesService.getCricketLogo(sName) || '',
          format: m.fo || m.format || 'Match',
          matchTitle: `${team1Short} vs ${team2Short}`,
          venue: m.vname || '',
          isLive: isLive,
          isFinished: isFinished,
          isUpcoming: isUpcoming,
          dateDisplay: dateDisplay,
          startTime: cleanStartTime || rawStart || null,
          statusText: statusDisplay,
          situation: m.a || statusDisplay,
          target: m.target || null,
          matchUrl: crexUrl,
          crexUrl: crexUrl,
          team1: {
            name: team1Name || 'Team 1',
            shortName: team1Short,
            score: team1Score,
            overs: team1Overs,
            isBatting: Boolean(m.inningFActive),
            flag: FavoritesService.getCricketLogo(team1Name, team1Short, sName) || m.team1flag || (m.b ? `https://cricketvectors.akamaized.net/Teams/${m.b}.png` : '')
          },
          team2: {
            name: team2Name || 'Team 2',
            shortName: team2Short,
            score: team2Score,
            overs: team2Overs,
            isBatting: Boolean(m.inningSActive),
            flag: FavoritesService.getCricketLogo(team2Name, team2Short, sName) || m.team2flag || (m.c ? `https://cricketvectors.akamaized.net/Teams/${m.c}.png` : '')
          }
        });
      }

      return matches;
    } catch (_) {
      return [];
    }
  }

  /**
   * Fetches matches across a 4-day cricket window:
   * yesterday (-24h finished), today (live/recent), tomorrow (+24h), and day-after (+48h).
   */
  static async fetchEspnMultiDay() {
    const fmt = dt => dt.toISOString().slice(0, 10).replace(/-/g, '');
    const now = new Date();
    const dates = [
      fmt(new Date(now.getTime() - 86400000)), // yesterday
      fmt(now),                                // today
      fmt(new Date(now.getTime() + 86400000)), // tomorrow
      fmt(new Date(now.getTime() + 172800000)) // day after (+48h)
    ];

    const settled = await Promise.allSettled(
      dates.map(d => this.fetchEspnScorepanel(d))
    );

    const allEspnMatches = [];
    const seenIds = new Set();
    for (const res of settled) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        for (const m of res.value) {
          if (!seenIds.has(m.id)) {
            seenIds.add(m.id);
            allEspnMatches.push(m);
          }
        }
      }
    }
    return allEspnMatches;
  }

  static async fetchEspnScorepanel(dateStr = null) {
    try {
      const url = dateStr
        ? `https://site.web.api.espn.com/apis/site/v2/sports/cricket/scorepanel?dates=${dateStr}`
        : 'https://site.web.api.espn.com/apis/site/v2/sports/cricket/scorepanel';
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) return [];

      const data = await res.json();
      const matches = [];

      for (const group of data.scores || []) {
        const leagueId = group.leagues?.[0]?.id || '';
        const rawLeagueName = group.leagues?.[0]?.name || 'Cricket Tournament';
        const leagueName = decodeHtmlEntities(rawLeagueName);

        for (const ev of group.events || []) {
          const comp = ev.competitions?.[0];
          if (!comp) continue;

          const competitors = comp.competitors || [];
          const t1 = competitors[0] || {};
          const t2 = competitors[1] || {};

          const state = ev.status?.type?.state;
          const isLive = state === 'in';
          const isFinished = state === 'post';
          const isUpcoming = state === 'pre';

          const t1Parsed = parseScoreAndOvers(t1.score, '');
          const t2Parsed = parseScoreAndOvers(t2.score, '');

          // Check linescores for exact overs
          let t1Overs = t1Parsed.overs;
          if (!t1Overs && t1.linescores && t1.linescores.length > 0) {
            const lastLine = t1.linescores[t1.linescores.length - 1];
            if (lastLine && lastLine.overs) {
              t1Overs = String(lastLine.overs);
            }
          }

          let t2Overs = t2Parsed.overs;
          if (!t2Overs && t2.linescores && t2.linescores.length > 0) {
            const lastLine = t2.linescores[t2.linescores.length - 1];
            if (lastLine && lastLine.overs) {
              t2Overs = String(lastLine.overs);
            }
          }

          const matchTarget = t2Parsed.target || t1Parsed.target || '';

          const isT1Batting = isLive && (t1.linescores || []).some(l => l.isBatting && l.isCurrent);
          const isT2Batting = isLive && (t2.linescores || []).some(l => l.isBatting && l.isCurrent);

          let statusText = '';
          if (isLive) {
            statusText = ev.status?.summary || ev.status?.type?.detail || ev.status?.type?.shortDetail || 'LIVE';
          } else if (isFinished) {
            statusText = ev.status?.type?.detail || ev.status?.summary || 'Match Finished';
          } else {
            try {
              const d = new Date(ev.date);
              statusText = `Starts at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            } catch (_) {
              statusText = 'Upcoming';
            }
          }

          let dateDisplay = '';
          if (ev.date) {
            try {
              const d = new Date(ev.date);
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
            } catch (_) {}
          }

          let cricinfoUrl = '';
          const summaryLink = ev.links?.find(l => l.rel?.includes('scorecard') || l.rel?.includes('summary') || l.rel?.includes('boxscore'))?.href || ev.links?.[0]?.href;
          if (summaryLink) {
            cricinfoUrl = summaryLink.replace(/www\.espn\.(?:in|com)/, 'www.espncricinfo.com');
          } else {
            cricinfoUrl = `https://www.espncricinfo.com/matches/engine/match/${ev.id}.html`;
          }

          const t1DisplayName = t1.team?.displayName || t1.team?.name || 'Team 1';
          const t1Abbr = t1.team?.abbreviation || t1.team?.shortDisplayName || 'T1';
          const t2DisplayName = t2.team?.displayName || t2.team?.name || 'Team 2';
          const t2Abbr = t2.team?.abbreviation || t2.team?.shortDisplayName || 'T2';

          matches.push({
            id: `cr_espn_${ev.id}`,
            rawId: ev.id,
            leagueId: leagueId,
            sport: 'cricket',
            seriesName: leagueName,
            seriesLogo: FavoritesService.getTournamentLogo(leagueName) || FavoritesService.getCricketLogo(leagueName) || '',
            format: comp.format?.type || 'Match',
            matchTitle: ev.name || `${t1Abbr} vs ${t2Abbr}`,
            venue: comp.venue?.fullName || '',
            isLive: isLive,
            isFinished: isFinished,
            isUpcoming: isUpcoming,
            dateDisplay: dateDisplay,
            startTime: ev.date || null,
            statusText: statusText,
            situation: ev.status?.summary || statusText,
            target: matchTarget,
            matchUrl: cricinfoUrl,
            crexUrl: 'https://crex.live',
            cricinfoUrl: cricinfoUrl,
            team1: {
              name: t1DisplayName,
              shortName: t1Abbr,
              score: t1Parsed.score,
              overs: t1Overs,
              isBatting: isT1Batting,
              flag: FavoritesService.getCricketLogo(t1DisplayName, t1Abbr, leagueName) ||
                    (FavoritesService.isVerifiedEspnLogo(t1.team?.logo) ? t1.team.logo : '')
            },
            team2: {
              name: t2DisplayName,
              shortName: t2Abbr,
              score: t2Parsed.score,
              overs: t2Overs,
              isBatting: isT2Batting,
              flag: FavoritesService.getCricketLogo(t2DisplayName, t2Abbr, leagueName) ||
                    (FavoritesService.isVerifiedEspnLogo(t2.team?.logo) ? t2.team.logo : '')
            }
          });
        }
      }

      return matches;
    } catch (_) {
      return [];
    }
  }

  static mergeCricketMatches(crexMatches, espnMatches) {
    const combined = [...crexMatches];
    const existingIndexMap = new Map();
    crexMatches.forEach((m, idx) => {
      const k1 = `${(m.team1.shortName || m.team1.name || '').toLowerCase()}_${(m.team2.shortName || m.team2.name || '').toLowerCase()}`;
      existingIndexMap.set(k1, idx);
    });

    for (const em of espnMatches) {
      const key1 = `${(em.team1.shortName || em.team1.name || '').toLowerCase()}_${(em.team2.shortName || em.team2.name || '').toLowerCase()}`;
      const key2 = `${(em.team2.shortName || em.team2.name || '').toLowerCase()}_${(em.team1.shortName || em.team1.name || '').toLowerCase()}`;

      if (existingIndexMap.has(key1)) {
        combined[existingIndexMap.get(key1)].cricinfoUrl = em.cricinfoUrl;
        if (em.leagueId) combined[existingIndexMap.get(key1)].leagueId = em.leagueId;
      } else if (existingIndexMap.has(key2)) {
        combined[existingIndexMap.get(key2)].cricinfoUrl = em.cricinfoUrl;
        if (em.leagueId) combined[existingIndexMap.get(key2)].leagueId = em.leagueId;
      } else {
        combined.push(em);
      }
    }

    return combined.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      if (a.isUpcoming && b.isFinished) return -1;
      if (a.isFinished && b.isUpcoming) return 1;
      return 0;
    });
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
    .replace(/&s;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

