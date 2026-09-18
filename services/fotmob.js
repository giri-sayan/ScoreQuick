/**
 * ScoreQuick - FotMob Football Service
 * Fetches real-time scores, live match minutes, and league tables from FotMob.
 */

export class FotMobService {
  /**
   * Fetches matches directly from FotMob across a 4-day window:
   * yesterday (-24h finished), today (live/recent), tomorrow (+24h), and day-after (+48h).
   * Guarantees all followed teams have their latest and upcoming matches up to date.
   */
  static async fetchMatches(dateStr = null) {
    if (dateStr) {
      return await this.fetchSingleDate(dateStr);
    }

    try {
      const fmt = dt => dt.toISOString().slice(0, 10).replace(/-/g, '');
      const now = new Date();
      const dates = [
        fmt(new Date(now.getTime() - 86400000)), // yesterday
        fmt(now),                                // today
        fmt(new Date(now.getTime() + 86400000)), // tomorrow
        fmt(new Date(now.getTime() + 172800000)) // day after (+48h)
      ];

      // Fetch today and upcoming dates concurrently
      const settled = await Promise.allSettled(dates.map(d => this.fetchSingleDateRaw(d)));
      const rawDays = settled
        .filter(s => s.status === 'fulfilled' && s.value && s.value.leagues)
        .map(s => s.value);

      if (rawDays.length === 0) {
        throw new Error('All FotMob date fetches failed');
      }

      // Merge raw days into unified leagues & match collections
      return this.mergeMultiDayMatches(rawDays);
    } catch (err) {
      console.warn('Primary FotMob multi-day fetch failed, attempting ESPN soccer fallback:', err.message);
      return await this.fetchEspnFallback();
    }
  }

  static async fetchSingleDateRaw(dateStr) {
    const url = `https://www.fotmob.com/api/data/matches?date=${dateStr}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!response.ok) throw new Error(`FotMob HTTP ${response.status}`);
    return await response.json();
  }

  static async fetchSingleDate(dateStr) {
    try {
      const data = await this.fetchSingleDateRaw(dateStr);
      return this.normalizeMatches(data);
    } catch (e) {
      return await this.fetchEspnFallback();
    }
  }

  /**
   * Merges multiple FotMob day payloads, deduplicating matches by match ID.
   */
  static mergeMultiDayMatches(daysPayloads) {
    const leagueMap = new Map();
    const seenMatchIds = new Set();

    for (const day of daysPayloads) {
      for (const league of day.leagues || []) {
        const lId = league.id || league.primaryId || league.name;
        if (!leagueMap.has(lId)) {
          leagueMap.set(lId, {
            ...league,
            matches: []
          });
        }
        const existingLeague = leagueMap.get(lId);
        for (const m of league.matches || []) {
          if (!seenMatchIds.has(m.id)) {
            seenMatchIds.add(m.id);
            existingLeague.matches.push(m);
          }
        }
      }
    }

    return this.normalizeMatches({ leagues: Array.from(leagueMap.values()) });
  }

  /**
   * Normalizes FotMob response into a clean, uniform match array and league groups.
   */
  static normalizeMatches(data) {
    const leagues = data.leagues || [];
    const allMatches = [];
    const liveMatches = [];
    const leagueGroups = [];

    for (const league of leagues) {
      if (!league.matches || league.matches.length === 0) continue;

      const leagueId = league.id || league.primaryId;
      const group = {
        leagueId: leagueId,
        leagueName: league.name,
        countryCode: league.ccode || '',
        parentLeagueName: league.parentLeagueName || '',
        leagueLogo: leagueId ? `https://images.fotmob.com/image_resources/logo/leaguelogo/${leagueId}.png` : '',
        matches: []
      };

      for (const m of league.matches) {
        const isStarted = Boolean(m.status?.started);
        const isFinished = Boolean(m.status?.finished);
        const isCancelled = Boolean(m.status?.cancelled);
        const isLive = isStarted && !isFinished && !isCancelled;
        const isUpcoming = !isStarted && !isCancelled;

        let homeScore = null;
        let awayScore = null;

        if (isStarted || isFinished) {
          if (m.home?.score !== undefined && m.home?.score !== null) {
            homeScore = m.home.score;
          } else if (m.status?.scoreStr) {
            homeScore = parseInt(m.status.scoreStr.split('-')[0].trim());
          }

          if (m.away?.score !== undefined && m.away?.score !== null) {
            awayScore = m.away.score;
          } else if (m.status?.scoreStr) {
            awayScore = parseInt(m.status.scoreStr.split('-')[1].trim());
          }
        }

        // Format live clock or match time with date context
        let timeDisplay = m.time || '';
        let dateDisplay = '';
        let matchDateObj = null;

        if (m.status?.utcTime) {
          try {
            matchDateObj = new Date(m.status.utcTime);
          } catch (_) {}
        }

        if (matchDateObj && !isNaN(matchDateObj.getTime())) {
          const nowDate = new Date();
          const isToday = matchDateObj.toDateString() === nowDate.toDateString();
          const yestDate = new Date(nowDate); yestDate.setDate(yestDate.getDate() - 1);
          const isYesterday = matchDateObj.toDateString() === yestDate.toDateString();
          const tomDate = new Date(nowDate); tomDate.setDate(tomDate.getDate() + 1);
          const isTomorrow = matchDateObj.toDateString() === tomDate.toDateString();
          const timeFormatted = matchDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          if (isToday) dateDisplay = 'Today';
          else if (isYesterday) dateDisplay = 'Yesterday';
          else if (isTomorrow) dateDisplay = 'Tomorrow';
          else dateDisplay = matchDateObj.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });

          if (isLive) {
            timeDisplay = m.status?.liveTime?.short || 'LIVE';
          } else if (isFinished) {
            if (isToday) timeDisplay = 'FT';
            else if (isYesterday) timeDisplay = 'FT (Yesterday)';
            else timeDisplay = `FT (${matchDateObj.toLocaleDateString([], { day: 'numeric', month: 'short' })})`;
          } else if (isCancelled) {
            timeDisplay = 'Canc.';
          } else {
            if (isToday) timeDisplay = timeFormatted;
            else if (isTomorrow) timeDisplay = `Tom ${timeFormatted}`;
            else timeDisplay = `${matchDateObj.toLocaleDateString([], { day: 'numeric', month: 'short' })} ${timeFormatted}`;
          }
        } else {
          if (isLive) timeDisplay = m.status?.liveTime?.short || 'LIVE';
          else if (isFinished) timeDisplay = 'FT';
          else if (isCancelled) timeDisplay = 'Canc.';
        }

        const matchObj = {
          id: `fb_${m.id}`,
          rawId: m.id,
          sport: 'football',
          leagueId: leagueId,
          leagueName: league.name,
          leagueLogo: group.leagueLogo,
          countryCode: league.ccode,
          dateDisplay: dateDisplay,
          timeDisplay: timeDisplay,
          startTime: m.status?.utcTime || (matchDateObj ? matchDateObj.toISOString() : m.time),
          isLive: isLive,
          isFinished: isFinished,
          isUpcoming: isUpcoming,
          home: {
            id: m.home?.id,
            name: m.home?.name || 'Home',
            longName: m.home?.longName || m.home?.name || 'Home',
            score: homeScore,
            logo: m.home?.id ? `https://images.fotmob.com/image_resources/logo/teamlogo/${m.home.id}.png` : ''
          },
          away: {
            id: m.away?.id,
            name: m.away?.name || 'Away',
            longName: m.away?.longName || m.away?.name || 'Away',
            score: awayScore,
            logo: m.away?.id ? `https://images.fotmob.com/image_resources/logo/teamlogo/${m.away.id}.png` : ''
          },
          statusText: isLive ? timeDisplay : (isFinished ? (dateDisplay ? `Full Time (${dateDisplay})` : 'Full Time') : `Starts at ${timeDisplay}`),
          matchUrl: `https://www.fotmob.com/match/${m.id}`,
          fotmobUrl: `https://www.fotmob.com/match/${m.id}`
        };

        group.matches.push(matchObj);
        allMatches.push(matchObj);
        if (isLive) {
          liveMatches.push(matchObj);
        }
      }

      if (group.matches.length > 0) {
        // Sort matches in each league: Live first, then upcoming (by start time), then finished
        group.matches.sort((a, b) => {
          if (a.isLive && !b.isLive) return -1;
          if (!a.isLive && b.isLive) return 1;
          if (a.isUpcoming && b.isFinished) return -1;
          if (a.isFinished && b.isUpcoming) return 1;
          if (a.isUpcoming && b.isUpcoming && a.startTime && b.startTime) {
            return new Date(a.startTime) - new Date(b.startTime);
          }
          return 0;
        });
        leagueGroups.push(group);
      }
    }

    // Sort league groups: LIVE first, then most popular leagues, then less popular
    leagueGroups.sort((a, b) => {
      const aLive = a.matches.some(m => m.isLive);
      const bLive = b.matches.some(m => m.isLive);
      const aRank = (aLive ? 100000 : 0) + this.getLeaguePopularity(a);
      const bRank = (bLive ? 100000 : 0) + this.getLeaguePopularity(b);
      return bRank - aRank;
    });

    return {
      sport: 'football',
      allMatches: allMatches,
      liveMatches: liveMatches,
      leagues: leagueGroups,
      liveCount: liveMatches.length
    };
  }

  /**
   * Calculates popularity score for football leagues
   * Prioritizes Elite European & International competitions, then top national leagues, down to lower tiers.
   */
  static getLeaguePopularity(league) {
    const name = (league.leagueName || league.name || '').toLowerCase();
    const ccode = (league.countryCode || league.ccode || '').toUpperCase();
    const id = Number(league.leagueId || league.id || league.primaryId || 0);

    // Demote youth / reserve / minor competitions explicitly
    const isReserveOrYouth = name.includes('u21') || name.includes('u19') || name.includes('u23') || 
                             name.includes('premier league 2') || name.includes('reserve') || 
                             name.includes('youth') || name.includes('torneo proyeccion');
    if (isReserveOrYouth) return 120;

    const isSecondTier = name.includes('2. bundesliga') || name.includes('segunda') || 
                         name.includes('serie b') || name.includes('ligue 2') || 
                         name.includes('first division') || (name.includes('championship') && ccode !== 'ENG');

    // Elite Top Tier (1100 - 1500)
    if (id === 42 || (name.includes('champions league') && !name.includes('women'))) return 1400;
    if ((id === 47 || name === 'premier league') && ccode === 'ENG') return 1300;
    if (id === 87 || name === 'laliga' || name === 'la liga' || (name.includes('laliga') && !name.includes('2') && !name.includes('hypermotion'))) return 1250;
    if (id === 55 || (name === 'serie a' && ccode === 'ITA')) return 1200;
    if (id === 54 || (name === 'bundesliga' && ccode === 'GER' && !name.includes('2.'))) return 1200;
    if (id === 53 || (name === 'ligue 1' && ccode === 'FRA')) return 1100;
    if (id === 73 || (name.includes('europa league') && !name.includes('conference'))) return 1100;
    if (name.includes('world cup') || name.includes('euro 20') || name.includes('copa america')) return 1350;

    // Major Tier 2 (700 - 999)
    if (id === 10216 || name.includes('conference league')) return 950;
    if (name.includes('nations league')) return 950;
    if (id === 130 || name === 'major league soccer' || name.includes('mls')) return 900;
    if (id === 9080 || (name.includes('pro league') && ccode === 'SAU') || name.includes('roshn')) return 900;
    if (id === 132 || (name === 'fa cup' && ccode === 'ENG')) return 900;
    if (name.includes('copa del rey') || name.includes('coppa italia') || name.includes('dfb-pokal')) return 850;
    if (id === 133 || name.includes('efl cup') || name.includes('carabao')) return 850;
    if (id === 48 || (name === 'championship' && ccode === 'ENG')) return 800;
    if (id === 61 || (name.includes('liga portugal') || name.includes('primeira liga'))) return 850;
    if (id === 57 || (name.includes('eredivisie') && ccode === 'NED')) return 850;
    if (id === 45 || name.includes('copa libertadores')) return 850;
    if (ccode === 'BRA' && (name === 'serie a' || name.includes('brasileir'))) return 800;
    if (ccode === 'ARG' && (name.includes('primera división') || name === 'primera division' || name.includes('liga profesional'))) return 800;
    if (id === 65 || (name.includes('premiership') && ccode === 'SCO')) return 750;
    if (id === 40 || (name.includes('pro league') && ccode === 'BEL')) return 750;
    if (name.includes('süper lig') || (name.includes('super lig') && ccode === 'TUR')) return 750;
    if (id === 230 || (name.includes('liga mx') || (name.includes('primera división') && ccode === 'MEX'))) return 750;

    // Tier 3: National Top Flights (400 - 699)
    if (name.includes('bundesliga') && ccode === 'AUT') return 550;
    if (name.includes('super league') && (ccode === 'SUI' || ccode === 'GRE')) return 550;
    if (name.includes('superliga') && ccode === 'DEN') return 550;
    if (name.includes('eliteserien') && ccode === 'NOR') return 550;
    if (name.includes('allsvenskan') && ccode === 'SWE') return 550;
    if (name.includes('ekstraklasa') && ccode === 'POL') return 500;
    if (name.includes('j1 league') || (name.includes('j-league') && ccode === 'JPN')) return 500;
    if (name.includes('k league') && ccode === 'KOR') return 500;
    if (name.includes('a-league') && ccode === 'AUS') return 500;
    if (name.includes('indian super league') || name.includes('isl')) return 500;

    // Tier 4: Second Divisions / Sub-cups (200 - 399)
    if (isSecondTier) return 300;
    if (name.includes('league one') || name.includes('league two')) return 250;
    if (name.includes('1. division') || name.includes('2. liga')) return 220;

    // Tier 5: Minor / Youth / Regional (50 - 149)
    if (name.includes('3. division') || name.includes('3. liga') || name.includes('cfl')) return 90;

    return 180;
  }

  /**
   * ESPN Fallback if FotMob API is unreachable
   */
  static async fetchEspnFallback() {
    try {
      const topLeagues = [
        { code: 'eng.1', name: 'Premier League' },
        { code: 'esp.1', name: 'La Liga' },
        { code: 'uefa.champions', name: 'UEFA Champions League' },
        { code: 'ita.1', name: 'Serie A' },
        { code: 'ger.1', name: 'Bundesliga' }
      ];

      const matches = [];
      const liveMatches = [];
      const leagueGroups = [];

      for (const lg of topLeagues) {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${lg.code}/scoreboard`);
        if (!res.ok) continue;
        const data = await res.json();
        const events = data.events || [];
        if (events.length === 0) continue;

        const group = {
          leagueId: lg.code,
          leagueName: lg.name,
          countryCode: '',
          matches: []
        };

        for (const ev of events) {
          const comp = ev.competitions?.[0];
          if (!comp) continue;
          const home = comp.competitors?.find(c => c.homeAway === 'home') || comp.competitors?.[0];
          const away = comp.competitors?.find(c => c.homeAway === 'away') || comp.competitors?.[1];

          const isLive = ev.status?.type?.state === 'in';
          const isFinished = ev.status?.type?.state === 'post';
          const isUpcoming = ev.status?.type?.state === 'pre';

          const homeScore = isUpcoming ? null : (home?.score ? parseInt(home.score) : 0);
          const awayScore = isUpcoming ? null : (away?.score ? parseInt(away.score) : 0);

          const matchObj = {
            id: `fb_${ev.id}`,
            rawId: ev.id,
            sport: 'football',
            leagueId: lg.code,
            leagueName: lg.name,
            countryCode: '',
            timeDisplay: isLive ? ev.status?.type?.shortDetail || 'LIVE' : (isFinished ? 'FT' : ev.status?.type?.shortDetail || ''),
            startTime: ev.date,
            isLive: isLive,
            isFinished: isFinished,
            isUpcoming: isUpcoming,
            home: {
              id: home?.id,
              name: home?.team?.shortDisplayName || home?.team?.name || 'Home',
              longName: home?.team?.displayName || home?.team?.name,
              score: homeScore,
              logo: home?.team?.logo || ''
            },
            away: {
              id: away?.id,
              name: away?.team?.shortDisplayName || away?.team?.name || 'Away',
              longName: away?.team?.displayName || away?.team?.name,
              score: awayScore,
              logo: away?.team?.logo || ''
            },
            statusText: ev.status?.type?.shortDetail || '',
            fotmobUrl: `https://www.google.com/search?q=${encodeURIComponent(ev.name + ' soccer score')}`
          };

          group.matches.push(matchObj);
          matches.push(matchObj);
          if (isLive) liveMatches.push(matchObj);
        }

        if (group.matches.length > 0) {
          leagueGroups.push(group);
        }
      }

      return {
        sport: 'football',
        allMatches: matches,
        liveMatches: liveMatches,
        leagues: leagueGroups,
        liveCount: liveMatches.length
      };
    } catch (e) {
      console.error('ESPN fallback error:', e);
      return { sport: 'football', allMatches: [], liveMatches: [], leagues: [], liveCount: 0 };
    }
  }
}
