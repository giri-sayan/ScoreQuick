/**
 * ScoreQuick - Notifications & Live Alert Service
 * Copyright (c) 2026 Giri Sayan. All Rights Reserved.
 * PROPRIETARY & CONFIDENTIAL. Unauthorized copying, modification, or distribution is prohibited.
 *
 * Compares match states and dispatches native browser notifications for goals, wickets, and match outcomes.
 */

import { FootballService } from './football.js';

export class NotificationService {
  static NOTIFICATION_CACHE_KEY = 'scorequick_match_cache';
  static NOTIFICATION_ENABLED_KEY = 'scorequick_notifications_enabled';

  /**
   * Check whether desktop notifications are enabled by the user in settings.
   * Defaults to true if not explicitly set to false.
   */
  static async isNotificationsEnabled() {
    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get([this.NOTIFICATION_ENABLED_KEY], res => {
          resolve(res?.[this.NOTIFICATION_ENABLED_KEY] !== false);
        });
      } else {
        resolve(true);
      }
    });
  }

  /**
   * Compare previous matches state with new matches state and trigger notifications for followed teams
   */
  static async checkAndNotify(currentFollowedMatches = []) {
    if (typeof chrome === 'undefined' || !chrome.notifications) return;

    // Strictly check if notifications are enabled by the user
    const isEnabled = await this.isNotificationsEnabled();

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

      // If user has unchecked notifications in settings, do NOT dispatch any alert
      if (!isEnabled) continue;

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
          const goalInfo = await FootballService.getGoalScorerInfo(match.rawId || match.id, true);
          let title = `⚽ GOAL! ${match.home.name} scores!`;
          if (goalInfo && goalInfo.scorer) {
            if (goalInfo.isOwnGoal) {
              title = `⚽ OWN GOAL! ${goalInfo.scorer} (OG) scores for ${match.home.name}!`;
            } else {
              title = `⚽ GOAL! ${goalInfo.scorer} scores for ${match.home.name}!`;
            }
          }
          const timeInfo = goalInfo?.minute || match.timeDisplay || 'Live';
          this.sendNotification(
            title,
            `${match.home.name} ${currHome} - ${currAway} ${match.away.name} (${timeInfo})`,
            match.id
          );
        } else if (currAway > prevAway) {
          const goalInfo = await FootballService.getGoalScorerInfo(match.rawId || match.id, false);
          let title = `⚽ GOAL! ${match.away.name} scores!`;
          if (goalInfo && goalInfo.scorer) {
            if (goalInfo.isOwnGoal) {
              title = `⚽ OWN GOAL! ${goalInfo.scorer} (OG) scores for ${match.away.name}!`;
            } else {
              title = `⚽ GOAL! ${goalInfo.scorer} scores for ${match.away.name}!`;
            }
          }
          const timeInfo = goalInfo?.minute || match.timeDisplay || 'Live';
          this.sendNotification(
            title,
            `${match.home.name} ${currHome} - ${currAway} ${match.away.name} (${timeInfo})`,
            match.id
          );
        }

        // Match Full Time
        if (!prev.isFinished && match.isFinished) {
          this.sendNotification(
            `⏱️ Full Time: ${match.home.name} vs ${match.away.name}`,
            `Final Score: ${currHome} - ${currAway}`,
            match.id
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
            `${match.team1.name}: ${currT1} | vs ${match.team2.name}`,
            match.id
          );
        } else if (this.detectWicket(prevT2, currT2)) {
          this.sendNotification(
            `🏏 WICKET! (${match.team2.shortName || match.team2.name})`,
            `${match.team2.name}: ${currT2} | vs ${match.team1.name}`,
            match.id
          );
        }

        // Match Concluded
        if (!prev.isFinished && match.isFinished) {
          this.sendNotification(
            `🏆 Match Concluded: ${match.matchTitle || match.seriesName}`,
            match.result || match.statusText || 'Match finished',
            match.id
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

  static async sendNotification(title, message, matchId = null) {
    const isEnabled = await this.isNotificationsEnabled();
    if (!isEnabled) return;

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
      console.warn('[ScoreQuick] Failed to dispatch match notification:', e);
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

  static DONATION_LAST_NOTIF_KEY = 'scorequick_last_donation_notif';
  static TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000; // 14 Days

  /**
   * Dispatches a native desktop notification on the bottom-right of the user's screen
   * strictly once every 2 weeks to support the project.
   */
  static async checkAndSendDonationReminder() {
    if (typeof chrome === 'undefined' || !chrome.notifications) return;

    return new Promise(resolve => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get([this.DONATION_LAST_NOTIF_KEY], res => {
          const lastNotifTime = res?.[this.DONATION_LAST_NOTIF_KEY];
          const now = Date.now();

          // On first install, set the timestamp so it doesn't pop up immediately on day 1
          if (!lastNotifTime) {
            chrome.storage.local.set({ [this.DONATION_LAST_NOTIF_KEY]: now });
            resolve();
            return;
          }

          if (now - Number(lastNotifTime) >= this.TWO_WEEKS_MS) {
            try {
              chrome.notifications.create('scorequick_donation_reminder', {
                type: 'basic',
                iconUrl: chrome.runtime.getURL('icons/icon128.png'),
                title: '☕ ScoreQuick: Buy Us A Tea!',
                message: 'Enjoying fastest live sports stats? Buy us a tea to support us!',
                priority: 2,
                buttons: [
                  { title: '☕ Buy Us A Tea' },
                  { title: 'Remind Later' }
                ]
              });
              chrome.storage.local.set({ [this.DONATION_LAST_NOTIF_KEY]: now });
            } catch (e) {
              console.warn('[ScoreQuick] Failed to dispatch donation desktop notification:', e);
            }
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
