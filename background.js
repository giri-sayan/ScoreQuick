/**
 * ScoreQuick - Background Service Worker (Manifest V3)
 * Copyright (c) 2026 Giri Sayan. All Rights Reserved.
 * PROPRIETARY & CONFIDENTIAL. Unauthorized copying, modification, or distribution is prohibited.
 *
 * Handles background polling, toolbar badge counts for followed live events,
 * and desktop notifications strictly for followed teams and drivers.
 */

import { FootballService } from './services/football.js';
import { CricketService } from './services/cricket.js';
import { F1Service } from './services/f1.js';
import { FavoritesService } from './services/favorites.js';
import { NotificationService } from './services/notifications.js';

const ALARM_NAME = 'scorequick_poll';
const DEFAULT_POLL_INTERVAL_MINUTES = 1;

// Immediately clear any old/cached badge on service worker initialization
try {
  if (typeof chrome !== 'undefined' && chrome.action && chrome.action.setBadgeText) {
    chrome.action.setBadgeText({ text: '' });
  }
} catch (_) {}

// Initialize on extension installation or browser startup
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[ScoreQuick] Extension installed/updated.');
  try {
    if (chrome.action && chrome.action.setBadgeText) {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (_) {}
  if (typeof chrome !== 'undefined' && chrome.storage?.session) {
    chrome.storage.session.remove('scorequick_tab_state').catch(() => {});
  }
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.get(['scorequick_poll_interval', 'scorequick_notifications_enabled'], res => {
      const updates = {};
      if (!res || !res.scorequick_poll_interval) {
        updates.scorequick_poll_interval = 10;
      }
      if (!res || res.scorequick_notifications_enabled === undefined) {
        updates.scorequick_notifications_enabled = true;
      }
      if (Object.keys(updates).length > 0) {
        chrome.storage.local.set(updates);
      }
    });
  }
  await setupAlarm();
  await refreshScores(true);
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('[ScoreQuick] Browser started.');
  try {
    if (chrome.action && chrome.action.setBadgeText) {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch (_) {}
  if (typeof chrome !== 'undefined' && chrome.storage?.session) {
    chrome.storage.session.remove('scorequick_tab_state').catch(() => {});
  }
  await setupAlarm();
  await refreshScores();
});

// Setup background alarm
async function setupAlarm() {
  chrome.alarms.clear(ALARM_NAME, () => {
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: DEFAULT_POLL_INTERVAL_MINUTES
    });
    console.log(`[ScoreQuick] Background polling alarm set (${DEFAULT_POLL_INTERVAL_MINUTES} min)`);
  });
}

// Listen to alarms
chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === ALARM_NAME) {
    await refreshScores();
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'REFRESH_NOW') {
    refreshScores(true)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  if (request.type === 'UPDATE_INTERVAL') {
    const mins = request.minutes || 1;
    chrome.alarms.clear(ALARM_NAME, () => {
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: mins });
      sendResponse({ success: true });
    });
    return true;
  }
  if (request.type === 'UPDATE_BADGE') {
    updateBadge(request.liveFollowedCount || 0);
    sendResponse({ success: true });
    return true;
  }
});

/**
 * Main score update routine
 */
async function refreshScores(forceBroadcast = false) {
  try {
    const [fbResult, crResult, f1Result, favsResult] = await Promise.allSettled([
      FootballService.fetchMatches(),
      CricketService.fetchMatches(),
      F1Service.fetchF1Data(forceBroadcast),
      FavoritesService.getFavorites()
    ]);

    const footballData = fbResult.status === 'fulfilled' ? fbResult.value : null;
    const cricketData = crResult.status === 'fulfilled' ? crResult.value : null;
    const f1Data = f1Result.status === 'fulfilled' ? f1Result.value : null;
    const favorites = favsResult.status === 'fulfilled' ? favsResult.value : {};

    const totalFavsCount = 
      (favorites?.football || []).length + 
      (favorites?.cricket || []).length + 
      (favorites?.f1 || []).length;

    const filterResult = FavoritesService.filterFollowedMatches(
      footballData?.allMatches || [],
      cricketData?.allMatches || [],
      f1Data,
      favorites || {}
    );

    const followedMatches = Array.isArray(filterResult) ? filterResult : (filterResult?.items || []);

    // Number mark on the extension toolbar icon:
    // Strictly show badge mark ONLY if a live event is actively going on for followed teams or drivers!
    let liveFollowedCount = 0;
    if (totalFavsCount > 0 && Array.isArray(followedMatches)) {
      liveFollowedCount = followedMatches.filter(m => m && m.isLive).length;
    }

    // Update toolbar icon badge: visible ONLY if followed live count > 0, completely hidden otherwise
    updateBadge(liveFollowedCount);

    // Desktop notifications:
    // Send alerts strictly for followed teams/drivers only when enabled by user in settings! Never when unchecked or favorites is 0.
    const notifEnabled = await NotificationService.isNotificationsEnabled();
    if (notifEnabled && totalFavsCount > 0 && followedMatches.length > 0) {
      await NotificationService.checkAndNotify(followedMatches);
    }

    // 2-Week Desktop Notification Reminder for "Buy Us A Tea"
    await NotificationService.checkAndSendDonationReminder();

    // Cache latest data into chrome.storage.local for instantaneous popup loading
    const payload = {
      timestamp: Date.now(),
      football: footballData,
      cricket: cricketData,
      f1: f1Data,
      followed: followedMatches,
      liveFollowedCount,
      totalFavsCount
    };

    await chrome.storage.local.set({ scorequick_latest_data: payload });

    return payload;
  } catch (error) {
    console.error('[ScoreQuick] Error refreshing scores:', error);
  }
}

/**
 * Updates extension toolbar icon badge text:
 * ONLY shows badge count when user's followed teams/drivers have an active live event!
 * When 0 followed teams are live, badge is cleared completely.
 */
function updateBadge(liveFollowedCount) {
  try {
    if (liveFollowedCount > 0) {
      chrome.action.setBadgeText({ text: String(liveFollowedCount) });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' }); // Vivid red alert badge
      if (chrome.action.setBadgeTextColor) {
        chrome.action.setBadgeTextColor({ color: '#ffffff' }); // Clean white text
      }
      chrome.action.setTitle({ 
        title: `ScoreQuick: ${liveFollowedCount} Followed Event${liveFollowedCount > 1 ? 's' : ''} LIVE!` 
      });
    } else {
      // Clear badge completely: NO badge displayed when followed teams are not live
      chrome.action.setBadgeText({ text: '' });
      chrome.action.setTitle({ title: 'ScoreQuick - Fastest Live Stats' });
    }
  } catch (e) {
    console.warn('[ScoreQuick] Failed to update badge:', e);
  }
}

// Handle desktop notification clicks (e.g. 2-week donation reminder)
try {
  if (typeof chrome !== 'undefined' && chrome.notifications) {
    chrome.notifications.onButtonClicked?.addListener((notificationId, buttonIndex) => {
      if (notificationId === 'scorequick_donation_reminder') {
        if (buttonIndex === 0) {
          chrome.tabs.create({ url: 'https://buymeacoffee.com/scorequick' });
        }
        chrome.storage.local.set({ scorequick_last_donation_notif: Date.now() });
        chrome.notifications.clear(notificationId);
      }
    });

    chrome.notifications.onClicked?.addListener((notificationId) => {
      if (notificationId === 'scorequick_donation_reminder') {
        chrome.tabs.create({ url: 'https://buymeacoffee.com/scorequick' });
        chrome.storage.local.set({ scorequick_last_donation_notif: Date.now() });
        chrome.notifications.clear(notificationId);
      }
    });
  }
} catch (_) {}
