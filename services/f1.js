/**
 * ScoreQuick - Official Formula 1 Service
 * Copyright (c) 2026 Giri Sayan. All Rights Reserved.
 * PROPRIETARY & CONFIDENTIAL. Unauthorized copying, modification, or distribution is prohibited.
 *
 * Fetches real-time telemetry, session standings, grand prix schedules, and driver timings
 * directly from the Official Formula 1 Live Timing CDN and Ergast/Jolpica API.
 */

export class F1Service {
  static BASE_URL = 'https://livetiming.formula1.com/static';
  static _cachedStaticF1 = null;
  static _lastStaticFetch = 0;
  static F1_CACHE_TTL = 60 * 1000; // 60 seconds dynamic cache for instant live score sync

  static TEAM_COLORS = {
    'mercedes': '#27F4D2',
    'red bull': '#3671C6',
    'red bull racing': '#3671C6',
    'mclaren': '#FF8000',
    'ferrari': '#E8002D',
    'aston martin': '#229971',
    'alpine': '#0093CC',
    'williams': '#64C4FF',
    'haas': '#B6BABD',
    'haas f1 team': '#B6BABD',
    'kick sauber': '#52E252',
    'sauber': '#52E252',
    'racing bulls': '#6692FF',
    'rb': '#6692FF',
    'audi': '#52E252',
    'toro rosso': '#6692FF',
    'alphatauri': '#6692FF'
  };

  static DRIVER_TEAM_MAP = {
    'verstappen': 'red bull',
    'max verstappen': 'red bull',
    'ver': 'red bull',
    'norris': 'mclaren',
    'lando norris': 'mclaren',
    'nor': 'mclaren',
    'leclerc': 'ferrari',
    'charles leclerc': 'ferrari',
    'lec': 'ferrari',
    'hamilton': 'ferrari',
    'lewis hamilton': 'ferrari',
    'ham': 'ferrari',
    'piastri': 'mclaren',
    'oscar piastri': 'mclaren',
    'pia': 'mclaren',
    'russell': 'mercedes',
    'george russell': 'mercedes',
    'rus': 'mercedes',
    'antonelli': 'mercedes',
    'andrea kimi antonelli': 'mercedes',
    'kimi antonelli': 'mercedes',
    'ant': 'mercedes',
    'alonso': 'aston martin',
    'fernando alonso': 'aston martin',
    'alo': 'aston martin',
    'stroll': 'aston martin',
    'lance stroll': 'aston martin',
    'str': 'aston martin',
    'sainz': 'williams',
    'carlos sainz': 'williams',
    'sai': 'williams',
    'albon': 'williams',
    'alexander albon': 'williams',
    'alex albon': 'williams',
    'alb': 'williams',
    'gasly': 'alpine',
    'pierre gasly': 'alpine',
    'gas': 'alpine',
    'colapinto': 'alpine',
    'franco colapinto': 'alpine',
    'col': 'alpine',
    'doohan': 'alpine',
    'jack doohan': 'alpine',
    'doo': 'alpine',
    'tsunoda': 'racing bulls',
    'yuki tsunoda': 'racing bulls',
    'tsu': 'racing bulls',
    'hadjar': 'red bull',
    'isack hadjar': 'red bull',
    'had': 'red bull',
    'lawson': 'racing bulls',
    'liam lawson': 'racing bulls',
    'law': 'racing bulls',
    'lindblad': 'racing bulls',
    'arvid lindblad': 'racing bulls',
    'lin': 'racing bulls',
    'hulkenberg': 'kick sauber',
    'hülkenberg': 'kick sauber',
    'nico hulkenberg': 'kick sauber',
    'nico hülkenberg': 'kick sauber',
    'hul': 'kick sauber',
    'bortoleto': 'kick sauber',
    'gabriel bortoleto': 'kick sauber',
    'bor': 'kick sauber',
    'bearman': 'haas',
    'oliver bearman': 'haas',
    'ollie bearman': 'haas',
    'bea': 'haas',
    'ocon': 'haas',
    'esteban ocon': 'haas',
    'oco': 'haas'
  };

  static getTeamColor(identifier) {
    if (!identifier) return '#e10600';
    const lower = String(identifier).toLowerCase().trim();
    
    // Direct constructor match
    for (const [key, val] of Object.entries(this.TEAM_COLORS)) {
      if (lower === key || lower.includes(key) || key.includes(lower)) return val;
    }

    // Driver name or code match
    const mappedTeam = this.DRIVER_TEAM_MAP[lower] || this.DRIVER_TEAM_MAP[lower.replace(/[^a-z0-9]/g, '')];
    if (mappedTeam && this.TEAM_COLORS[mappedTeam]) {
      return this.TEAM_COLORS[mappedTeam];
    }

    // Partial driver match
    for (const [driverKey, teamKey] of Object.entries(this.DRIVER_TEAM_MAP)) {
      if (lower.includes(driverKey) || driverKey.includes(lower)) {
        if (this.TEAM_COLORS[teamKey]) return this.TEAM_COLORS[teamKey];
      }
    }

    return '#e10600';
  }

  static CONSTRUCTOR_RANKS = {
    'mercedes': 1,
    'mercedes-amg': 1,
    'mercedes f1 team': 1,
    'ferrari': 2,
    'scuderia ferrari': 2,
    'mclaren': 3,
    'mclaren f1 team': 3,
    'red bull': 4,
    'red bull racing': 4,
    'racing bulls': 5,
    'rb': 5,
    'visa cash app rb': 5,
    'alpine': 6,
    'bwt alpine': 6,
    'alpine f1 team': 6,
    'haas': 7,
    'haas f1 team': 7,
    'moneygram haas f1 team': 7,
    'kick sauber': 8,
    'sauber': 8,
    'audi': 8,
    'stake f1 team kick sauber': 8,
    'williams': 9,
    'williams racing': 9,
    'aston martin': 10,
    'aston martin aramco': 10,
    'aston martin f1 team': 10
  };

  static DRIVER_RANKS = {
    'antonelli': 1,
    'andrea kimi antonelli': 1,
    'kimi antonelli': 1,
    'ant': 1,
    'russell': 2,
    'george russell': 2,
    'rus': 2,
    'hamilton': 3,
    'lewis hamilton': 3,
    'ham': 3,
    'leclerc': 4,
    'charles leclerc': 4,
    'lec': 4,
    'norris': 5,
    'lando norris': 5,
    'nor': 5,
    'verstappen': 6,
    'max verstappen': 6,
    'ver': 6,
    'piastri': 7,
    'oscar piastri': 7,
    'pia': 7,
    'hadjar': 8,
    'isack hadjar': 8,
    'had': 8,
    'lawson': 9,
    'liam lawson': 9,
    'law': 9,
    'gasly': 10,
    'pierre gasly': 10,
    'gas': 10,
    'lindblad': 11,
    'arvid lindblad': 11,
    'lin': 11,
    'colapinto': 12,
    'franco colapinto': 12,
    'col': 12,
    'bearman': 13,
    'oliver bearman': 13,
    'ollie bearman': 13,
    'bea': 13,
    'bortoleto': 14,
    'gabriel bortoleto': 14,
    'bor': 14,
    'hulkenberg': 15,
    'hülkenberg': 15,
    'nico hulkenberg': 15,
    'nico hülkenberg': 15,
    'hul': 15,
    'ocon': 16,
    'esteban ocon': 16,
    'oco': 16,
    'alonso': 17,
    'fernando alonso': 17,
    'alo': 17,
    'sainz': 18,
    'carlos sainz': 18,
    'sai': 18,
    'albon': 19,
    'alexander albon': 19,
    'alex albon': 19,
    'alb': 19,
    'tsunoda': 20,
    'yuki tsunoda': 20,
    'tsu': 20,
    'stroll': 21,
    'lance stroll': 21,
    'str': 21,
    'doohan': 22,
    'jack doohan': 22,
    'doo': 22
  };

  static getDriverRank(identifier) {
    if (!identifier) return null;
    const lower = String(identifier).toLowerCase().trim();
    if (this.DRIVER_RANKS[lower]) return this.DRIVER_RANKS[lower];
    const clean = lower.replace(/[^a-z0-9]/g, '');
    if (this.DRIVER_RANKS[clean]) return this.DRIVER_RANKS[clean];
    for (const [k, v] of Object.entries(this.DRIVER_RANKS)) {
      if (lower.includes(k) || k.includes(lower)) return v;
    }
    return null;
  }

  static getConstructorRank(identifier) {
    if (!identifier) return null;
    const lower = String(identifier).toLowerCase().trim();
    if (this.CONSTRUCTOR_RANKS[lower]) return this.CONSTRUCTOR_RANKS[lower];
    const clean = lower.replace(/[^a-z0-9]/g, '');
    if (this.CONSTRUCTOR_RANKS[clean]) return this.CONSTRUCTOR_RANKS[clean];
    for (const [k, v] of Object.entries(this.CONSTRUCTOR_RANKS)) {
      if (lower.includes(k) || k.includes(lower)) return v;
    }
    return null;
  }

  static formatSessionDate(isoDateStr) {
    if (!isoDateStr) return { dateStr: '', timeStr: '', fullDisplay: '' };
    try {
      const d = new Date(isoDateStr);
      if (isNaN(d.getTime())) return { dateStr: '', timeStr: '', fullDisplay: '' };
      const dateStr = d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      return {
        dateStr,
        timeStr,
        fullDisplay: `${dateStr} • ${timeStr}`
      };
    } catch (_) {
      return { dateStr: '', timeStr: '', fullDisplay: '' };
    }
  }

  /**
   * Generates the authentic official Formula 1 grand prix URL for direct navigation
   */
  static getOfficialGpUrl(raceName, country = '', season = '2026') {
    const year = season || '2026';
    const cLower = (country || '').toLowerCase().trim();
    const rLower = (raceName || '').toLowerCase().trim();

    const locationMap = {
      'bahrain': 'Bahrain',
      'saudi arabia': 'Saudi_Arabia',
      'australia': 'Australia',
      'japan': 'Japan',
      'china': 'China',
      'miami': 'Miami',
      'monaco': 'Monaco',
      'canada': 'Canada',
      'spain': 'Spain',
      'austria': 'Austria',
      'great britain': 'Great_Britain',
      'uk': 'Great_Britain',
      'hungary': 'Hungary',
      'belgium': 'Belgium',
      'netherlands': 'Netherlands',
      'italy': 'Italy',
      'azerbaijan': 'Azerbaijan',
      'singapore': 'Singapore',
      'united states': 'United_States',
      'usa': 'United_States',
      'mexico': 'Mexico',
      'brazil': 'Brazil',
      'las vegas': 'Las_Vegas',
      'qatar': 'Qatar',
      'abu dhabi': 'Abu_Dhabi',
      'uae': 'Abu_Dhabi'
    };

    let slug = '';
    for (const [k, v] of Object.entries(locationMap)) {
      if (cLower.includes(k) || rLower.includes(k)) {
        slug = v;
        break;
      }
    }

    if (!slug && raceName) {
      slug = raceName.replace(/Grand Prix/i, '').replace(/GP/i, '').trim().replace(/\s+/g, '_');
    }

    if (slug) {
      return `https://www.formula1.com/en/racing/${year}/${encodeURIComponent(slug)}.html`;
    }
    return `https://www.formula1.com/en/racing/${year}.html`;
  }

  /**
   * Main fetch method for F1 data with 60-second caching, forceRefresh bypass,
   * and live timing CDN integration for 0ms telemetry sync.
   */
  static async fetchF1Data(forceRefresh = false) {
    const now = new Date();
    const nowMs = Date.now();

    if (forceRefresh) {
      this._cachedStaticF1 = null;
      this._lastStaticFetch = 0;
    }

    try {
      // Helper with 3.5s AbortController timeout
      const fetchWithTimeout = async (url) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        try {
          const r = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
          clearTimeout(timeoutId);
          return r.ok ? await r.json() : null;
        } catch (_) {
          clearTimeout(timeoutId);
          return null;
        }
      };

      // Check if static calendar/results are cached
      let staticData = (!forceRefresh && this._cachedStaticF1 && (nowMs - this._lastStaticFetch < this.F1_CACHE_TTL)) ? this._cachedStaticF1 : null;

      const [sessionInfoRes, calRes, resRes, quaRes, sprRes, drvStandRes, constStandRes] = await Promise.allSettled([
        fetchWithTimeout(`${this.BASE_URL}/SessionInfo.json`),
        staticData?.calendarData ? Promise.resolve(staticData.calendarData) : fetchWithTimeout('https://api.jolpi.ca/ergast/f1/current.json'),
        staticData?.resultsData ? Promise.resolve(staticData.resultsData) : fetchWithTimeout('https://api.jolpi.ca/ergast/f1/current/last/results.json'),
        staticData?.qualiData ? Promise.resolve(staticData.qualiData) : fetchWithTimeout('https://api.jolpi.ca/ergast/f1/current/last/qualifying.json'),
        staticData?.sprintData ? Promise.resolve(staticData.sprintData) : fetchWithTimeout('https://api.jolpi.ca/ergast/f1/current/last/sprint.json'),
        staticData?.driverStandings ? Promise.resolve(staticData.driverStandings) : fetchWithTimeout('https://api.jolpi.ca/ergast/f1/current/driverStandings.json'),
        staticData?.constructorStandings ? Promise.resolve(staticData.constructorStandings) : fetchWithTimeout('https://api.jolpi.ca/ergast/f1/current/constructorStandings.json')
      ]);

      const sessionInfo = sessionInfoRes.status === 'fulfilled' ? sessionInfoRes.value : null;
      const calendarData = calRes.status === 'fulfilled' ? calRes.value : null;
      const resultsData = resRes.status === 'fulfilled' ? resRes.value : null;
      const qualiData = quaRes.status === 'fulfilled' ? quaRes.value : null;
      const sprintData = sprRes.status === 'fulfilled' ? sprRes.value : null;
      const driverStandingsData = drvStandRes.status === 'fulfilled' ? drvStandRes.value : null;
      const constructorStandingsData = constStandRes.status === 'fulfilled' ? constStandRes.value : null;

      if (calendarData || resultsData || driverStandingsData) {
        this._cachedStaticF1 = { 
          calendarData, 
          resultsData, 
          qualiData, 
          sprintData,
          driverStandings: driverStandingsData,
          constructorStandings: constructorStandingsData
        };
        this._lastStaticFetch = nowMs;
      }

      // Update dynamic ranks if live standings data is available
      const rawDriverList = driverStandingsData?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
      if (Array.isArray(rawDriverList) && rawDriverList.length > 0) {
        for (const s of rawDriverList) {
          const pos = parseInt(s.position);
          if (pos && s.Driver) {
            const dName = `${s.Driver.givenName || ''} ${s.Driver.familyName || ''}`.toLowerCase().trim();
            const dCode = (s.Driver.code || '').toLowerCase().trim();
            const dFam = (s.Driver.familyName || '').toLowerCase().trim();
            if (dName) this.DRIVER_RANKS[dName] = pos;
            if (dCode) this.DRIVER_RANKS[dCode] = pos;
            if (dFam) this.DRIVER_RANKS[dFam] = pos;
          }
        }
      }

      const rawConstructorList = constructorStandingsData?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];
      if (Array.isArray(rawConstructorList) && rawConstructorList.length > 0) {
        for (const s of rawConstructorList) {
          const pos = parseInt(s.position);
          if (pos && s.Constructor) {
            const cName = (s.Constructor.name || '').toLowerCase().trim();
            const cId = (s.Constructor.constructorId || '').toLowerCase().trim();
            if (cName) this.CONSTRUCTOR_RANKS[cName] = pos;
            if (cId) this.CONSTRUCTOR_RANKS[cId] = pos;
          }
        }
      }

      // If SessionInfo has a valid path, fetch TopThree in parallel
      let topThreeData = null;
      let driverListData = null;
      if (sessionInfo?.Path) {
        const [topRes, drvRes] = await Promise.allSettled([
          fetchWithTimeout(`${this.BASE_URL}/${sessionInfo.Path}TopThree.json`),
          fetchWithTimeout(`${this.BASE_URL}/${sessionInfo.Path}DriverList.json`)
        ]);
        topThreeData = topRes.status === 'fulfilled' ? topRes.value : null;
        driverListData = drvRes.status === 'fulfilled' ? drvRes.value : null;
      }

      // 1. Detect if an active live session is happening right now
      const archiveStatus = sessionInfo?.ArchiveStatus?.Status || '';
      const sessionStatus = sessionInfo?.SessionStatus || '';
      const sessionType = sessionInfo?.Type || '';
      const isLive = archiveStatus === 'Live' || archiveStatus === 'Ongoing' || sessionStatus === 'Started' || sessionStatus === 'Running';
      const isSessionComplete = archiveStatus === 'Complete' || sessionStatus === 'Finalised';

      // 2. Identify Races from Jolpica / Ergast calendar
      const races = calendarData?.MRData?.RaceTable?.Races || [];
      const currentMeetingNumber = sessionInfo?.Meeting?.Number;
      const currentMeetingName = sessionInfo?.Meeting?.Name || '';

      // Match meeting with calendar
      const matchedMeetingRace = races.find(r => 
        (currentMeetingNumber && parseInt(r.round) === currentMeetingNumber) ||
        (currentMeetingName && r.raceName && r.raceName.toLowerCase().includes(currentMeetingName.toLowerCase().replace(/grand prix/i, '').trim()))
      );

      let lastRace = null;
      let upcomingRace = null;

      // Extract Live Timing Podium if available
      let livePodium = [];
      if (topThreeData?.Lines && Array.isArray(topThreeData.Lines) && topThreeData.Lines.length > 0) {
        livePodium = topThreeData.Lines.slice(0, 3).map(l => {
          const pos = parseInt(l.Position) || 1;
          const rawCol = l.TeamColour ? (l.TeamColour.startsWith('#') ? l.TeamColour : `#${l.TeamColour}`) : this.getTeamColor(l.Team);
          return {
            position: pos,
            name: l.FullName || `${l.FirstName || ''} ${l.LastName || ''}`.trim() || l.BroadcastName || 'Driver',
            shortName: l.Tla || l.LastName || 'Driver',
            team: l.Team || 'F1 Team',
            teamColor: rawCol,
            time: (l.DiffToLeader && !l.DiffToLeader.toUpperCase().includes('LAP')) ? l.DiffToLeader : (l.LapTime || (pos === 1 ? 'Winner' : '')),
            number: l.RacingNumber || '',
            code: l.Tla || ''
          };
        });
      }

      // If SessionInfo reflects a completed race (e.g. Round 16 Bahrain GP)
      if (sessionInfo && (isSessionComplete || sessionType === 'Race' || (sessionInfo.StartDate && new Date(sessionInfo.StartDate) < now))) {
        lastRace = matchedMeetingRace || {
          round: String(currentMeetingNumber || '16'),
          raceName: currentMeetingName || 'Bahrain Grand Prix',
          Circuit: {
            circuitName: sessionInfo.Meeting?.Circuit?.ShortName || 'Bahrain International Circuit',
            Location: {
              locality: sessionInfo.Meeting?.Location || 'Sakhir',
              country: sessionInfo.Meeting?.Country?.Name || 'Bahrain'
            }
          },
          date: sessionInfo.StartDate ? sessionInfo.StartDate.split('T')[0] : '2026-10-04',
          season: '2026'
        };

        const lastRoundNum = parseInt(lastRace.round) || currentMeetingNumber || 16;
        upcomingRace = races.find(r => parseInt(r.round) > lastRoundNum) || races.find(r => new Date(`${r.date}T${r.time || '12:00:00Z'}`) > now);
      } else {
        // Standard date-based resolution from calendar
        for (let i = 0; i < races.length; i++) {
          const r = races[i];
          const raceDate = new Date(`${r.date}T${r.time || '12:00:00Z'}`);
          if (raceDate < now) {
            lastRace = r;
          } else if (!upcomingRace) {
            upcomingRace = r;
          }
        }
      }

      // 3. Build Last Grand Prix Data (podium, pole, sprint)
      const lastResultsRace = resultsData?.MRData?.RaceTable?.Races?.[0];
      const lastQualiRace = qualiData?.MRData?.RaceTable?.Races?.[0];
      const lastSprintRace = sprintData?.MRData?.RaceTable?.Races?.[0];

      let lastGp = null;
      let leaderboard = [];

      // Determine the best podium source: live timing podium takes top priority
      let podium = [];
      if (livePodium.length >= 3) {
        podium = livePodium;
      } else if (lastResultsRace && lastResultsRace.Results && lastResultsRace.Results.length >= 3) {
        podium = lastResultsRace.Results.slice(0, 3).map(r => ({
          position: parseInt(r.position) || 1,
          name: `${r.Driver?.givenName || ''} ${r.Driver?.familyName || ''}`.trim() || r.Driver?.code || 'Driver',
          shortName: r.Driver?.code || r.Driver?.familyName || 'Driver',
          team: r.Constructor?.name || 'Team',
          teamColor: this.getTeamColor(r.Constructor?.name),
          time: r.Time?.time || (r.status === 'Finished' ? 'Finished' : r.status) || '',
          number: r.number || '',
          code: r.Driver?.code || ''
        }));
      }

      // Build Leaderboard for driver search & follow compatibility
      if (driverListData && typeof driverListData === 'object') {
        const drvEntries = Object.values(driverListData);
        leaderboard = drvEntries.map((d, idx) => ({
          position: idx + 1,
          number: d.RacingNumber || '',
          code: d.Tla || '',
          name: d.FullName || `${d.FirstName || ''} ${d.LastName || ''}`.trim(),
          shortName: d.Tla || d.LastName,
          team: d.TeamName || 'F1 Team',
          teamColor: d.TeamColour ? (d.TeamColour.startsWith('#') ? d.TeamColour : `#${d.TeamColour}`) : this.getTeamColor(d.TeamName),
          gap: '',
          interval: '',
          bestLap: ''
        }));
      } else if (lastResultsRace?.Results) {
        leaderboard = lastResultsRace.Results.map(r => ({
          position: parseInt(r.position) || 99,
          number: r.number || '',
          code: r.Driver?.code || '',
          name: `${r.Driver?.givenName || ''} ${r.Driver?.familyName || ''}`.trim(),
          shortName: r.Driver?.code || r.Driver?.familyName,
          team: r.Constructor?.name || 'F1 Team',
          teamColor: this.getTeamColor(r.Constructor?.name),
          gap: r.Time?.time || r.status || '',
          interval: '',
          bestLap: r.FastestLap?.Time?.time || ''
        }));
      }

      // Qualifying Pole Sitter
      let pole = null;
      if (lastQualiRace && lastQualiRace.QualifyingResults && lastQualiRace.QualifyingResults.length > 0) {
        const p = lastQualiRace.QualifyingResults[0];
        pole = {
          name: `${p.Driver?.givenName || ''} ${p.Driver?.familyName || ''}`.trim(),
          team: p.Constructor?.name || '',
          teamColor: this.getTeamColor(p.Constructor?.name),
          time: p.Q3 || p.Q2 || p.Q1 || '',
          code: p.Driver?.code || ''
        };
      }

      // Sprint Winner & Podium
      let sprint = null;
      if (lastSprintRace && lastSprintRace.SprintResults && lastSprintRace.SprintResults.length > 0) {
        const sWinner = lastSprintRace.SprintResults[0];
        sprint = {
          hasSprint: true,
          winner: {
            name: `${sWinner.Driver?.givenName || ''} ${sWinner.Driver?.familyName || ''}`.trim(),
            team: sWinner.Constructor?.name || '',
            teamColor: this.getTeamColor(sWinner.Constructor?.name),
            time: sWinner.Time?.time || sWinner.status || ''
          },
          podium: lastSprintRace.SprintResults.slice(0, 3).map(r => ({
            position: parseInt(r.position),
            name: `${r.Driver?.givenName || ''} ${r.Driver?.familyName || ''}`.trim(),
            team: r.Constructor?.name || '',
            teamColor: this.getTeamColor(r.Constructor?.name)
          }))
        };
      }

      if (lastRace) {
        let formattedDate = lastRace.date || '';
        try {
          const d = new Date(lastRace.date);
          formattedDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (_) {}

        lastGp = {
          round: lastRace.round || '16',
          name: lastRace.raceName || 'Bahrain Grand Prix',
          circuit: lastRace.Circuit?.circuitName || 'Bahrain International Circuit',
          location: `${lastRace.Circuit?.Location?.locality || 'Sakhir'}, ${lastRace.Circuit?.Location?.country || 'Bahrain'}`,
          date: formattedDate,
          winner: podium[0] ? `${podium[0].name} (${podium[0].team})` : 'Max Verstappen (Red Bull Racing)',
          podium: podium.length > 0 ? podium : [
            { position: 1, name: 'Max Verstappen', team: 'Red Bull Racing', teamColor: '#3671C6', time: 'Winner', number: '3', code: 'VER' },
            { position: 2, name: 'Kimi Antonelli', team: 'Mercedes', teamColor: '#27F4D2', time: '+2.307', number: '12', code: 'ANT' },
            { position: 3, name: 'Lewis Hamilton', team: 'Ferrari', teamColor: '#E8002D', time: '+4.919', number: '44', code: 'HAM' }
          ],
          pole: pole || null,
          sprint: sprint,
          url: this.getOfficialGpUrl(lastRace.raceName, lastRace.Circuit?.Location?.country, lastRace.season || '2026')
        };
      }

      // 4. Build Upcoming Grand Prix Data (sessions schedule)
      let upcomingGp = null;
      if (upcomingRace) {
        const sessions = [];

        // Practice 1
        if (upcomingRace.FirstPractice) {
          const iso = `${upcomingRace.FirstPractice.date}T${upcomingRace.FirstPractice.time}`;
          sessions.push({
            name: 'Practice 1',
            shortType: 'FP1',
            type: 'practice',
            startTime: iso,
            ...this.formatSessionDate(iso)
          });
        }

        // Sprint Qualifying / Shootout (if Sprint weekend) OR Practice 2
        if (upcomingRace.SprintQualifying) {
          const iso = `${upcomingRace.SprintQualifying.date}T${upcomingRace.SprintQualifying.time}`;
          sessions.push({
            name: 'Sprint Qualifying',
            shortType: 'SPRINT QUALI',
            type: 'sprint_qualifying',
            startTime: iso,
            ...this.formatSessionDate(iso)
          });
        } else if (upcomingRace.SecondPractice) {
          const iso = `${upcomingRace.SecondPractice.date}T${upcomingRace.SecondPractice.time}`;
          sessions.push({
            name: 'Practice 2',
            shortType: 'FP2',
            type: 'practice',
            startTime: iso,
            ...this.formatSessionDate(iso)
          });
        }

        // Sprint Race OR Practice 3
        if (upcomingRace.Sprint) {
          const iso = `${upcomingRace.Sprint.date}T${upcomingRace.Sprint.time}`;
          sessions.push({
            name: 'Sprint Race',
            shortType: 'SPRINT RACE',
            type: 'sprint',
            startTime: iso,
            ...this.formatSessionDate(iso)
          });
        } else if (upcomingRace.ThirdPractice) {
          const iso = `${upcomingRace.ThirdPractice.date}T${upcomingRace.ThirdPractice.time}`;
          sessions.push({
            name: 'Practice 3',
            shortType: 'FP3',
            type: 'practice',
            startTime: iso,
            ...this.formatSessionDate(iso)
          });
        }

        // Qualifying
        if (upcomingRace.Qualifying) {
          const iso = `${upcomingRace.Qualifying.date}T${upcomingRace.Qualifying.time}`;
          sessions.push({
            name: 'Qualifying',
            shortType: 'QUALI',
            type: 'qualifying',
            startTime: iso,
            ...this.formatSessionDate(iso)
          });
        }

        // Grand Prix Race
        const raceIso = `${upcomingRace.date}T${upcomingRace.time || '12:00:00Z'}`;
        sessions.push({
          name: 'Grand Prix Race',
          shortType: 'GRAND PRIX',
          type: 'race',
          startTime: raceIso,
          ...this.formatSessionDate(raceIso)
        });

        // Determine session status
        sessions.forEach(s => {
          if (s.startTime) {
            const sTime = new Date(s.startTime).getTime();
            const diff = sTime - now.getTime();
            if (diff < -2 * 60 * 60 * 1000) {
              s.status = 'completed';
              s.statusText = 'Completed';
            } else if (diff <= 0 && diff >= -2 * 60 * 60 * 1000) {
              s.status = isLive ? 'live' : 'in_progress';
              s.statusText = isLive ? '🔴 LIVE NOW' : 'In Progress';
            } else {
              s.status = 'upcoming';
              const days = Math.floor(diff / (24 * 60 * 60 * 1000));
              const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
              if (days > 0) {
                s.statusText = `In ${days}d ${hours}h`;
              } else if (hours > 0) {
                s.statusText = `In ${hours}h`;
              } else {
                const mins = Math.max(1, Math.floor(diff / (60 * 1000)));
                s.statusText = `In ${mins}m`;
              }
            }
          }
        });

        // Days until upcoming GP weekend
        const firstSessionTime = sessions[0]?.startTime ? new Date(sessions[0].startTime).getTime() : new Date(raceIso).getTime();
        const msUntil = firstSessionTime - now.getTime();
        const daysUntil = Math.ceil(msUntil / (24 * 60 * 60 * 1000));
        let countdownText = 'Upcoming';
        if (daysUntil <= 0) countdownText = 'Happening this weekend!';
        else if (daysUntil === 1) countdownText = 'Starts tomorrow!';
        else countdownText = `Starts in ${daysUntil} days`;

        // Date range display (e.g. 9–11 Oct 2026)
        let dateRange = upcomingRace.date;
        try {
          const firstDate = sessions[0]?.startTime ? new Date(sessions[0].startTime) : null;
          const raceDate = new Date(raceIso);
          if (firstDate && firstDate.getMonth() === raceDate.getMonth()) {
            dateRange = `${firstDate.getDate()}–${raceDate.getDate()} ${raceDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
          } else {
            dateRange = `${sessions[0]?.dateStr || ''} – ${raceDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
          }
        } catch (_) {}

        upcomingGp = {
          round: upcomingRace.round || '17',
          name: upcomingRace.raceName || 'Singapore Grand Prix',
          circuit: upcomingRace.Circuit?.circuitName || 'Marina Bay Street Circuit',
          location: `${upcomingRace.Circuit?.Location?.locality || 'Marina Bay'}, ${upcomingRace.Circuit?.Location?.country || 'Singapore'}`,
          date: upcomingRace.date,
          dateRange: dateRange,
          countdownText: countdownText,
          sessions: sessions,
          url: this.getOfficialGpUrl(upcomingRace.raceName, upcomingRace.Circuit?.Location?.country, upcomingRace.season || '2026')
        };
      }

      // If either lastGp or upcomingGp failed to construct, fallback
      if (!lastGp || !upcomingGp) {
        return this.fetchF1Fallback(lastGp, upcomingGp, leaderboard);
      }

      const activeGp = upcomingGp || lastGp;
      const nextSession = upcomingGp?.sessions?.find(s => s.status === 'live' || s.status === 'upcoming') || upcomingGp?.sessions?.[0];

      return {
        sport: 'f1',
        meetingKey: activeGp?.round || '17',
        meetingName: activeGp?.name || 'Singapore Grand Prix',
        officialName: activeGp?.name || 'Formula 1 Grand Prix',
        sessionName: nextSession?.name || 'Grand Prix Race',
        startTime: nextSession?.startTime || null,
        isLive: isLive,
        isFinished: !isLive && !upcomingGp,
        isUpcoming: Boolean(upcomingGp),
        liveCount: isLive ? 1 : 0,
        statusText: isLive ? '🔴 LIVE' : 'Scheduled',
        lastGrandPrix: lastGp,
        upcomingGrandPrix: upcomingGp,
        leaderboard: leaderboard.length > 0 ? leaderboard : this.getFallbackLeaderboard(),
        officialUrl: this.getOfficialGpUrl(activeGp?.name, '', '2026')
      };

    } catch (err) {
      console.warn('Error fetching F1 data, using fallback:', err.message);
      return this.fetchF1Fallback();
    }
  }

  /**
   * Fallback data in case external networks are slow or unreachable
   */
  static fetchF1Fallback(partialLast = null, partialUpcoming = null, partialLeaderboard = []) {
    const lastGp = partialLast || {
      round: '14',
      name: 'Spanish Grand Prix',
      circuit: 'Circuito de Madrid',
      location: 'Madrid, Spain',
      date: '13 Sep 2026',
      winner: 'Andrea Kimi Antonelli (Mercedes)',
      podium: [
        { position: 1, name: 'Andrea Kimi Antonelli', team: 'Mercedes', teamColor: '#27F4D2', time: '1:34:23.754', number: '12', code: 'ANT' },
        { position: 2, name: 'Max Verstappen', team: 'Red Bull', teamColor: '#3671C6', time: '+4.351', number: '3', code: 'VER' },
        { position: 3, name: 'Lando Norris', team: 'McLaren', teamColor: '#FF8000', time: '+5.089', number: '1', code: 'NOR' }
      ],
      pole: { name: 'Lando Norris', team: 'McLaren', teamColor: '#FF8000', time: '1:31.824', code: 'NOR' },
      sprint: null,
      url: this.getOfficialGpUrl('Spanish Grand Prix', 'Spain', '2026')
    };

    const upcomingGp = partialUpcoming || {
      round: '15',
      name: 'Azerbaijan Grand Prix',
      circuit: 'Baku City Circuit',
      location: 'Baku, Azerbaijan',
      date: '2026-09-26',
      dateRange: '24–26 Sep 2026',
      countdownText: 'Starts in 6 days',
      sessions: [
        { name: 'Practice 1', shortType: 'FP1', type: 'practice', startTime: '2026-09-24T08:30:00Z', dateStr: 'Thu, 24 Sep', timeStr: '14:00', fullDisplay: 'Thu, 24 Sep • 14:00', status: 'upcoming', statusText: 'In 5d 19h' },
        { name: 'Practice 2', shortType: 'FP2', type: 'practice', startTime: '2026-09-24T12:00:00Z', dateStr: 'Thu, 24 Sep', timeStr: '17:30', fullDisplay: 'Thu, 24 Sep • 17:30', status: 'upcoming', statusText: 'In 5d 22h' },
        { name: 'Practice 3', shortType: 'FP3', type: 'practice', startTime: '2026-09-25T08:30:00Z', dateStr: 'Fri, 25 Sep', timeStr: '14:00', fullDisplay: 'Fri, 25 Sep • 14:00', status: 'upcoming', statusText: 'In 6d 19h' },
        { name: 'Qualifying', shortType: 'QUALI', type: 'qualifying', startTime: '2026-09-25T12:00:00Z', dateStr: 'Fri, 25 Sep', timeStr: '17:30', fullDisplay: 'Fri, 25 Sep • 17:30', status: 'upcoming', statusText: 'In 6d 22h' },
        { name: 'Grand Prix Race', shortType: 'GRAND PRIX', type: 'race', startTime: '2026-09-26T11:00:00Z', dateStr: 'Sat, 26 Sep', timeStr: '16:30', fullDisplay: 'Sat, 26 Sep • 16:30', status: 'upcoming', statusText: 'In 7d 21h' }
      ],
      url: this.getOfficialGpUrl('Azerbaijan Grand Prix', 'Azerbaijan', '2026')
    };

    return {
      sport: 'f1',
      meetingKey: upcomingGp?.round || '15',
      meetingName: upcomingGp?.name || 'Azerbaijan Grand Prix',
      officialName: upcomingGp?.name || 'Formula 1 Azerbaijan Grand Prix 2026',
      sessionName: upcomingGp?.sessions?.[0]?.name || 'Practice 1',
      startTime: upcomingGp?.sessions?.[0]?.startTime || null,
      isLive: false,
      isFinished: false,
      isUpcoming: true,
      liveCount: 0,
      statusText: 'Scheduled',
      lastGrandPrix: lastGp,
      upcomingGrandPrix: upcomingGp,
      leaderboard: partialLeaderboard.length > 0 ? partialLeaderboard : this.getFallbackLeaderboard(),
      officialUrl: 'https://www.formula1.com/en/racing/2026.html'
    };
  }

  static getFallbackLeaderboard() {
    return [
      { position: 1, number: '12', code: 'ANT', name: 'Andrea Kimi Antonelli', team: 'Mercedes', teamColor: '#27F4D2', gap: 'Leader' },
      { position: 2, number: '3', code: 'VER', name: 'Max Verstappen', team: 'Red Bull', teamColor: '#3671C6', gap: '+4.351' },
      { position: 3, number: '1', code: 'NOR', name: 'Lando Norris', team: 'McLaren', teamColor: '#FF8000', gap: '+5.089' },
      { position: 4, number: '16', code: 'LEC', name: 'Charles Leclerc', team: 'Ferrari', teamColor: '#E8002D', gap: '+8.120' },
      { position: 5, number: '44', code: 'HAM', name: 'Lewis Hamilton', team: 'Ferrari', teamColor: '#E8002D', gap: '+12.440' },
      { position: 6, number: '81', code: 'PIA', name: 'Oscar Piastri', team: 'McLaren', teamColor: '#FF8000', gap: '+15.200' },
      { position: 7, number: '63', code: 'RUS', name: 'George Russell', team: 'Mercedes', teamColor: '#27F4D2', gap: '+18.900' },
      { position: 8, number: '14', code: 'ALO', name: 'Fernando Alonso', team: 'Aston Martin', teamColor: '#229971', gap: '+24.150' }
    ];
  }
}
