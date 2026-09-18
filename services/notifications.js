/**
 * ScoreQuick - Notifications & Live Alert Service
 * Compares match states and dispatches native browser notifications for goals, wickets, and match outcomes.
 */

export class NotificationService {
  static NOTIFICATION_CACHE_KEY = 'scorequick_match_cache';

  /**
   * Compare previous matches state with new matches state and trigger notifications for followed teams
   */
  static async checkAndNotify(currentFollowedMatches = []) {
    if (typeof chrome === 'undefined' || !chrome.notifications) return;

    // Retrieve previous cached state
    const cachedState = await this.getCachedMatches();
    const newCache = {};

    for (const match of currentFollowedMatches) {
      const matchId = match.id;
      newCache[matchId] = {
        sport: match.sport,
        isLive: match.isLive,
        isFinished: match.isFinished,
        homeScore: match.home?.score,
        awayScore: match.away?.score,
        team1Score: match.team1?.score,
        team2Score: match.team2?.score,
        statusText: match.statusText,
        title: match.sport === 'football' ? `${match.home?.name} vs ${match.away?.name}` : `${match.team1?.shortName || match.team1?.name} vs ${match.team2?.shortName || match.team2?.name}`
      };

      const prev = cachedState[matchId];
      if (!prev) continue; // First time seeing match, don't spam notification

      // Check Football Events
      if (match.sport === 'football') {
        // Goal scored
        const prevHome = prev.homeScore ?? 0;
        const prevAway = prev.awayScore ?? 0;
        const currHome = match.home?.score ?? 0;
        const currAway = match.away?.score ?? 0;

        if (currHome > prevHome) {
          this.sendNotification(
            `⚽ GOAL! ${match.home.name} Scored!`,
            `${match.home.name} ${currHome} - ${currAway} ${match.away.name} (${match.timeDisplay || 'Live'})`
          );
        } else if (currAway > prevAway) {
          this.sendNotification(
            `⚽ GOAL! ${match.away.name} Scored!`,
            `${match.home.name} ${currHome} - ${currAway} ${match.away.name} (${match.timeDisplay || 'Live'})`
          );
        }

        // Match Full Time
        if (!prev.isFinished && match.isFinished) {
          this.sendNotification(
            `⏱️ Full Time: ${match.home.name} vs ${match.away.name}`,
            `Final Score: ${currHome} - ${currAway}`
          );
        }
      }

      // Check Cricket Events
      if (match.sport === 'cricket') {
        const prevT1 = prev.team1Score || '';
        const prevT2 = prev.team2Score || '';
        const currT1 = match.team1?.score || '';
        const currT2 = match.team2?.score || '';

        // Check if wicket fell (e.g. 142/3 -> 142/4 or score string contains /)
        if (this.detectWicket(prevT1, currT1)) {
          this.sendNotification(
            `🏏 WICKET! (${match.team1.shortName || match.team1.name})`,
            `${match.team1.name}: ${currT1} | vs ${match.team2.name}`
          );
        } else if (this.detectWicket(prevT2, currT2)) {
          this.sendNotification(
            `🏏 WICKET! (${match.team2.shortName || match.team2.name})`,
            `${match.team2.name}: ${currT2} | vs ${match.team1.name}`
          );
        }

        // Match Concluded
        if (!prev.isFinished && match.isFinished) {
          this.sendNotification(
            `🏆 Match Concluded: ${match.matchTitle || match.seriesName}`,
            match.result || match.statusText || 'Match finished'
          );
        }
      }
    }

    // Update match cache
    await this.setCachedMatches(newCache);
  }

  static detectWicket(prevScore, currScore) {
    if (!prevScore || !currScore) return false;
    const prevW = this.extractWickets(prevScore);
    const currW = this.extractWickets(currScore);
    return currW !== null && prevW !== null && currW > prevW;
  }

  static extractWickets(scoreStr) {
    const m = scoreStr.match(/\/(\d+)/);
    return m ? parseInt(m[1]) : null;
  }

  static sendNotification(title, message) {
    try {
      if (typeof chrome !== 'undefined' && chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/icon128.png'),
          title: title,
          message: message,
          priority: 2
        });
      }
    } catch (e) {
      console.warn('Failed to dispatch notification:', e);
    }
  }

  static async getCachedMatches() {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get([this.NOTIFICATION_CACHE_KEY], res => {
          resolve(res?.[this.NOTIFICATION_CACHE_KEY] || {});
        });
      } else {
        resolve({});
      }
    });
  }

  static async setCachedMatches(cache) {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [this.NOTIFICATION_CACHE_KEY]: cache }, () => resolve());
      } else {
        resolve();
      }
    });
  }
}
