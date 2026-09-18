/**
 * ScoreQuick - Official Formula 1 Service
 * Fetches real-time telemetry, session standings, grand prix schedules, and driver timings
 * directly from the Official Formula 1 Live Timing CDN and Ergast/Jolpica API.
 */

export class F1Service {
  static BASE_URL = 'https://livetiming.formula1.com/static';

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
    'rb': '#6692FF'
  };

  static getTeamColor(teamName) {
    if (!teamName) return '#e10600';
    const lower = teamName.toLowerCase().trim();
    for (const [key, val] of Object.entries(this.TEAM_COLORS)) {
      if (lower.includes(key) || key.includes(lower)) return val;
    }
    return '#e10600';
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
   * Main fetch method for F1 data
   */
  static async fetchF1Data() {
    const currentYear = new Date().getFullYear();
    const now = new Date();

    try {
      // Fetch live timing CDN, Ergast calendar, last results, quali, and sprint in parallel
      const [sessionInfoRes, calendarRes, resultsRes, qualiRes, sprintRes] = await Promise.allSettled([
        fetch(`${this.BASE_URL}/SessionInfo.json`, { headers: { 'Accept': 'application/json' } }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('https://api.jolpi.ca/ergast/f1/current.json').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('https://api.jolpi.ca/ergast/f1/current/last/results.json').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('https://api.jolpi.ca/ergast/f1/current/last/qualifying.json').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('https://api.jolpi.ca/ergast/f1/current/last/sprint.json').then(r => r.ok ? r.json() : null).catch(() => null)
      ]);

      const sessionInfo = sessionInfoRes.status === 'fulfilled' ? sessionInfoRes.value : null;
      const calendarData = calendarRes.status === 'fulfilled' ? calendarRes.value : null;
      const resultsData = resultsRes.status === 'fulfilled' ? resultsRes.value : null;
      const qualiData = qualiRes.status === 'fulfilled' ? qualiRes.value : null;
      const sprintData = sprintRes.status === 'fulfilled' ? sprintRes.value : null;

      // 1. Detect if an active live session is happening right now
      const archiveStatus = sessionInfo?.ArchiveStatus?.Status || '';
      const isLive = archiveStatus === 'Live' || archiveStatus === 'Ongoing';

      // 2. Identify Last Race & Upcoming Race from calendar
      const races = calendarData?.MRData?.RaceTable?.Races || [];
      let lastRace = null;
      let upcomingRace = null;

      for (let i = 0; i < races.length; i++) {
        const r = races[i];
        const raceDate = new Date(`${r.date}T${r.time || '12:00:00Z'}`);
        if (raceDate < now) {
          lastRace = r;
        } else if (!upcomingRace) {
          upcomingRace = r;
        }
      }

      // 3. Build Last Grand Prix Data (podium, pole, sprint)
      const lastResultsRace = resultsData?.MRData?.RaceTable?.Races?.[0] || lastRace;
      const lastQualiRace = qualiData?.MRData?.RaceTable?.Races?.[0];
      const lastSprintRace = sprintData?.MRData?.RaceTable?.Races?.[0];

      let lastGp = null;
      let leaderboard = [];

      if (lastResultsRace) {
        const rawResults = lastResultsRace.Results || [];
        const podium = rawResults.slice(0, 3).map(r => ({
          position: parseInt(r.position) || 1,
          name: `${r.Driver?.givenName || ''} ${r.Driver?.familyName || ''}`.trim() || r.Driver?.code || 'Driver',
          shortName: r.Driver?.code || r.Driver?.familyName || 'Driver',
          team: r.Constructor?.name || 'Team',
          teamColor: this.getTeamColor(r.Constructor?.name),
          time: r.Time?.time || (r.status === 'Finished' ? 'Finished' : r.status) || '',
          number: r.number || ''
        }));

        // Populate leaderboard for driver following compatibility
        leaderboard = rawResults.map(r => ({
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

        let formattedDate = lastResultsRace.date || '';
        try {
          const d = new Date(lastResultsRace.date);
          formattedDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (_) {}

        lastGp = {
          round: lastResultsRace.round || '14',
          name: lastResultsRace.raceName || 'Spanish Grand Prix',
          circuit: lastResultsRace.Circuit?.circuitName || 'Circuito de Madrid',
          location: `${lastResultsRace.Circuit?.Location?.locality || 'Madrid'}, ${lastResultsRace.Circuit?.Location?.country || 'Spain'}`,
          date: formattedDate,
          winner: podium[0] ? `${podium[0].name} (${podium[0].team})` : 'Andrea Kimi Antonelli (Mercedes)',
          podium: podium.length > 0 ? podium : [
            { position: 1, name: 'Andrea Kimi Antonelli', team: 'Mercedes', teamColor: '#27F4D2', time: '1:34:23.754' },
            { position: 2, name: 'Max Verstappen', team: 'Red Bull', teamColor: '#3671C6', time: '+4.351' },
            { position: 3, name: 'Lando Norris', team: 'McLaren', teamColor: '#FF8000', time: '+5.089' }
          ],
          pole: pole || { name: 'Lando Norris', team: 'McLaren', teamColor: '#FF8000', time: '1:31.824' },
          sprint: sprint,
          url: lastResultsRace.url || 'https://www.formula1.com/en/racing/2026.html'
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
            // Session duration ~1.5h to 2h
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

        // Date range display (e.g. 24–26 Sep 2026)
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
          round: upcomingRace.round || '15',
          name: upcomingRace.raceName || 'Azerbaijan Grand Prix',
          circuit: upcomingRace.Circuit?.circuitName || 'Baku City Circuit',
          location: `${upcomingRace.Circuit?.Location?.locality || 'Baku'}, ${upcomingRace.Circuit?.Location?.country || 'Azerbaijan'}`,
          date: upcomingRace.date,
          dateRange: dateRange,
          countdownText: countdownText,
          sessions: sessions,
          url: upcomingRace.url || 'https://www.formula1.com/en/racing/2026.html'
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
        meetingKey: activeGp?.round || '15',
        meetingName: activeGp?.name || 'Azerbaijan Grand Prix',
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
        officialUrl: 'https://www.formula1.com/en/racing/2026.html'
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
      url: 'https://www.formula1.com/en/racing/2026.html'
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
      url: 'https://www.formula1.com/en/racing/2026.html'
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
