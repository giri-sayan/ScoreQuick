/**
 * ScoreQuick - Popup Controller (v1.4)
 * Features:
 * 1. Dedicated 🔍 Discover Tab: Sport filters, catalog search, 1-click follow clubs, drivers & constructors.
 * 2. 📰 Multi-Sport News Tab: Rich news from FotMob, CREX & F1 with ⭐ Followed vs All filters.
 * 3. F1 Teams & Constructors Following: Follow McLaren, Ferrari, Red Bull, etc., alongside drivers.
 * 4. Cricket Team Logos: Verified high-res crests for all 20 international & IPL teams.
 * 5. Midnight Purple / Electric Violet modern dashboard theme.
 */

import { FotMobService } from '../services/fotmob.js';
import { CrexService } from '../services/crex.js';
import { F1Service } from '../services/f1.js';
import { FavoritesService } from '../services/favorites.js';
import { NewsService } from '../services/news.js';

// State
let appState = {
  currentTab: 'discover',
  searchQuery: '',
  discoverSport: 'all',  // 'all' | 'leagues' | 'football' | 'cricket' | 'f1'
  discoverQuery: '',
  newsFilter: 'followed', // 'followed' | 'all' | 'football' | 'cricket' | 'f1'
  newsQuery: '',
  footballFilter: 'all', // 'all' | 'live'
  cricketFilter: 'all',  // 'all' | 'live'
  footballData: null,
  cricketData: null,
  f1Data: null,
  newsData: null,
  favorites: null,
  followedMatches: [],
  refreshSecondsLeft: 10,
  refreshIntervalTotal: 10,
  countdownTimer: null
};

/**
 * Safe Tab Opener for Chrome Extension Popup
 * Prioritizes chrome.tabs.create to prevent popup blocker suppression and ensure smooth navigation.
 */
function openTab(url) {
  if (!url) return;
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url });
      return;
    }
  } catch (err) {
    console.warn('chrome.tabs.create failed, falling back to window.open:', err);
  }
  window.open(url, '_blank');
}

// DOM Elements
const elements = {
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabViews: document.querySelectorAll('.tab-view'),
  searchInput: document.getElementById('search-input'),
  searchClear: document.getElementById('search-clear'),
  refreshBtn: document.getElementById('manual-refresh-btn'),
  refreshTimer: document.getElementById('refresh-timer'),
  globalLivePill: document.getElementById('global-live-pill'),
  globalLiveCount: document.getElementById('global-live-count'),
  badgeFollowed: document.getElementById('badge-followed'),
  loadingSpinner: document.getElementById('loading-spinner'),
  lastUpdatedText: document.getElementById('last-updated-text'),
  
  // Followed Tab
  followedList: document.getElementById('followed-list'),
  followedEmpty: document.getElementById('followed-empty'),
  goToDiscoverBtn: document.getElementById('go-to-discover-btn'),

  // Discover Tab
  discoverList: document.getElementById('discover-list'),
  discoverCountTag: document.getElementById('discover-count-tag'),
  discoverSearchInput: document.getElementById('discover-search-input'),

  // News Tab
  newsList: document.getElementById('news-list'),
  newsEmpty: document.getElementById('news-empty'),
  newsEmptyDesc: document.getElementById('news-empty-desc'),
  newsSwitchAllBtn: document.getElementById('news-switch-all-btn'),
  newsCountTag: document.getElementById('news-count-tag'),
  newsSearchInput: document.getElementById('news-search-input'),
  newsFilterBtns: document.querySelectorAll('[data-news-filter]'),

  // Football & Cricket
  footballList: document.getElementById('football-list'),
  footballEmpty: document.getElementById('football-empty'),
  cricketList: document.getElementById('cricket-list'),
  cricketEmpty: document.getElementById('cricket-empty'),

  // F1
  f1Content: document.getElementById('f1-content'),
  f1LastGpCard: document.getElementById('f1-last-gp-card'),
  f1UpcomingGpCard: document.getElementById('f1-upcoming-gp-card'),
  f1Empty: document.getElementById('f1-empty'),

  // Settings
  pollIntervalSelect: document.getElementById('poll-interval-select'),
  toggleNotifications: document.getElementById('toggle-notifications'),
  clearAllFavsBtn: document.getElementById('clear-all-favs-btn'),
  addTeamSport: document.getElementById('add-team-sport'),
  addTeamInput: document.getElementById('add-team-input'),
  addTeamBtn: document.getElementById('add-team-btn'),
  followedFbChips: document.getElementById('followed-fb-chips'),
  followedCrChips: document.getElementById('followed-cr-chips'),
  followedF1Chips: document.getElementById('followed-f1-chips')
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();

  // 1. Restore active tab and subtabs remembered from current browser session
  await restoreTabState();

  // 2. Fast load cached state for instant rendering (<10ms)
  await loadCachedData();

  // 3. Fresh background fetch across FotMob, CREX, and F1
  await fetchLiveScores(true);

  // 4. Start auto-refresh timer
  startAutoRefreshCountdown();
});

function setupEventListeners() {
  // Tabs
  elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      switchTab(tabName);
    });
  });

  // Jump to Discover button in empty following view
  if (elements.goToDiscoverBtn) {
    elements.goToDiscoverBtn.addEventListener('click', () => {
      switchTab('discover');
    });
  }

  // Global Search
  elements.searchInput.addEventListener('input', e => {
    appState.searchQuery = e.target.value.toLowerCase().trim();
    elements.searchClear.style.display = appState.searchQuery ? 'block' : 'none';
    renderAllViews();
  });

  elements.searchClear.addEventListener('click', () => {
    elements.searchInput.value = '';
    appState.searchQuery = '';
    elements.searchClear.style.display = 'none';
    renderAllViews();
  });

  // Discover Tab Search
  if (elements.discoverSearchInput) {
    elements.discoverSearchInput.addEventListener('input', e => {
      appState.discoverQuery = e.target.value.toLowerCase().trim();
      renderDiscoverView();
    });
  }

  // Discover Sport Filter Pills
  document.querySelectorAll('[data-disc-sport]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-disc-sport]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.discoverSport = btn.dataset.discSport;
      saveTabState();
      renderDiscoverView();
    });
  });

  // Manual Refresh
  elements.refreshBtn.addEventListener('click', async () => {
    triggerRefreshAnimation(true);
    const fetchTask = fetchLiveScores(true);
    await Promise.all([
      fetchTask,
      new Promise(r => setTimeout(r, 1700))
    ]);
    triggerRefreshAnimation(false);
    resetRefreshTimer();
  });

  // Sub-filters (Football All vs Live)
  document.querySelectorAll('[data-fb-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-fb-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.footballFilter = btn.dataset.fbFilter;
      saveTabState();
      renderFootballView();
    });
  });

  // Sub-filters (Cricket All vs Live)
  document.querySelectorAll('[data-cr-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-cr-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.cricketFilter = btn.dataset.crFilter;
      saveTabState();
      renderCricketView();
    });
  });

  // News Filter Pills
  elements.newsFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.newsFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.newsFilter = btn.dataset.newsFilter;
      saveTabState();
      renderNewsView();
    });
  });

  // News Search
  if (elements.newsSearchInput) {
    elements.newsSearchInput.addEventListener('input', e => {
      appState.newsQuery = e.target.value.toLowerCase().trim();
      renderNewsView();
    });
  }

  // News Switch to All Button
  if (elements.newsSwitchAllBtn) {
    elements.newsSwitchAllBtn.addEventListener('click', () => {
      elements.newsFilterBtns.forEach(b => {
        if (b.dataset.newsFilter === 'all') b.classList.add('active');
        else b.classList.remove('active');
      });
      appState.newsFilter = 'all';
      saveTabState();
      renderNewsView();
    });
  }

  // Clear All Favorites Button
  elements.clearAllFavsBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all followed teams, drivers, and constructors?')) {
      appState.favorites = await FavoritesService.clearAllFavorites();
      updateFollowedMatches();
      renderAllViews();
      renderSettingsChips();
    }
  });

  // Add custom team/driver button in Settings
  elements.addTeamBtn.addEventListener('click', async () => {
    const rawSport = elements.addTeamSport.value;
    const name = elements.addTeamInput.value.trim();
    if (!name) return;

    let targetSport = rawSport;
    let isTeam = false;
    let category = '';

    if (rawSport === 'f1_team') {
      targetSport = 'f1';
      isTeam = true;
      category = 'Constructor';
    } else if (rawSport === 'f1') {
      category = 'Driver';
    }

    await FavoritesService.toggleFollow(targetSport, { 
      name: name, 
      isTeam: isTeam,
      category: category,
      id: name.toLowerCase().replace(/\s+/g, '_') 
    });
    elements.addTeamInput.value = '';
    appState.favorites = await FavoritesService.getFavorites();
    updateFollowedMatches();
    renderAllViews();
    renderSettingsChips();
  });

  elements.addTeamInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') elements.addTeamBtn.click();
  });

  // Interval change
  elements.pollIntervalSelect.addEventListener('change', e => {
    const secs = parseInt(e.target.value);
    appState.refreshIntervalTotal = secs;
    resetRefreshTimer();
    chrome.storage?.local?.set({ scorequick_poll_interval: secs });
    if (chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'UPDATE_INTERVAL', minutes: Math.max(1, Math.round(secs / 60)) });
    }
  });

  // Notification toggle
  elements.toggleNotifications.addEventListener('change', e => {
    chrome.storage?.local?.set({ scorequick_notifications_enabled: e.target.checked });
  });
}

function switchTab(tabName) {
  appState.currentTab = tabName;
  elements.tabBtns.forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabName);
  });
  elements.tabViews.forEach(v => {
    v.classList.toggle('active', v.id === `tab-${tabName}`);
  });

  if (tabName === 'followed') {
    renderFollowedView();
  } else if (tabName === 'discover') {
    renderDiscoverView();
  } else if (tabName === 'news') {
    renderNewsView();
  } else if (tabName === 'football') {
    renderFootballView();
  } else if (tabName === 'cricket') {
    renderCricketView();
  } else if (tabName === 'f1') {
    renderF1View();
  } else if (tabName === 'settings') {
    renderSettingsChips();
  }

  saveTabState();
}

/**
 * Persist current tab + subtab filters to session storage so the popup
 * reopens on the same view within the same browser session.
 */
function saveTabState() {
  const stateObj = {
    currentTab: appState.currentTab,
    discoverSport: appState.discoverSport,
    newsFilter: appState.newsFilter,
    footballFilter: appState.footballFilter,
    cricketFilter: appState.cricketFilter
  };
  if (typeof chrome !== 'undefined' && chrome.storage?.session) {
    try {
      chrome.storage.session.set({ scorequick_tab_state: stateObj });
    } catch (_) {}
  }
  try {
    sessionStorage.setItem('scorequick_tab_state', JSON.stringify(stateObj));
  } catch (_) {}
}

/**
 * Restores tab and subtab filters from browser session storage on popup open.
 * Guarantees that opening for the first time in a browser session defaults to the Following tab,
 * while subsequent reclicks restore the specific tab and subtab opened in the current session.
 */
async function restoreTabState() {
  return new Promise(resolve => {
    const applySaved = (saved) => {
      if (saved && saved.currentTab) {
        appState.currentTab = saved.currentTab;
        elements.tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === saved.currentTab));
        elements.tabViews.forEach(v => v.classList.toggle('active', v.id === `tab-${saved.currentTab}`));

        if (saved.discoverSport) {
          appState.discoverSport = saved.discoverSport;
          document.querySelectorAll('[data-disc-sport]').forEach(b => b.classList.toggle('active', b.dataset.discSport === saved.discoverSport));
        }
        if (saved.newsFilter) {
          appState.newsFilter = saved.newsFilter;
          elements.newsFilterBtns.forEach(b => b.classList.toggle('active', b.dataset.newsFilter === saved.newsFilter));
        }
        if (saved.footballFilter) {
          appState.footballFilter = saved.footballFilter;
          document.querySelectorAll('[data-fb-filter]').forEach(b => b.classList.toggle('active', b.dataset.fbFilter === saved.footballFilter));
        }
        if (saved.cricketFilter) {
          appState.cricketFilter = saved.cricketFilter;
          document.querySelectorAll('[data-cr-filter]').forEach(b => b.classList.toggle('active', b.dataset.crFilter === saved.cricketFilter));
        }
      } else {
        // First time opening in browser session: Default to Discover tab!
        appState.currentTab = 'discover';
        elements.tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === 'discover'));
        elements.tabViews.forEach(v => v.classList.toggle('active', v.id === 'tab-discover'));
      }
      resolve();
    };

    if (typeof chrome !== 'undefined' && chrome.storage?.session) {
      chrome.storage.session.get(['scorequick_tab_state'], res => {
        applySaved(res?.scorequick_tab_state);
      });
    } else {
      applySaved(null);
    }
  });
}

/**
 * Load cached data immediately from local storage for 0ms delay
 */
async function loadCachedData() {
  appState.favorites = await FavoritesService.getFavorites();

  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.get(['scorequick_latest_data', 'scorequick_poll_interval', 'scorequick_notifications_enabled'], res => {
      if (res?.scorequick_poll_interval) {
        const clampedInterval = Math.min(Math.max(Number(res.scorequick_poll_interval) || 10, 10), 60);
        appState.refreshIntervalTotal = clampedInterval;
        elements.pollIntervalSelect.value = String(clampedInterval);
      } else {
        appState.refreshIntervalTotal = 10;
        elements.pollIntervalSelect.value = '10';
      }
      if (res?.scorequick_notifications_enabled !== undefined) {
        elements.toggleNotifications.checked = res.scorequick_notifications_enabled;
      }

      if (res?.scorequick_latest_data) {
        const cached = res.scorequick_latest_data;
        appState.footballData = cached.football;
        appState.cricketData = cached.cricket;
        appState.f1Data = cached.f1;
        updateFollowedMatches();
        renderAllViews();
        if (cached.timestamp) {
          const ago = Math.round((Date.now() - cached.timestamp) / 1000);
          elements.lastUpdatedText.textContent = `Updated ${ago < 5 ? 'just now' : ago + 's ago'}`;
        }
      }
    });

    // Also load cached news immediately
    NewsService.getCachedNews().then(cachedNews => {
      if (cachedNews && cachedNews.length > 0) {
        appState.newsData = {
          all: cachedNews,
          football: cachedNews.filter(n => n.sport === 'football'),
          cricket: cachedNews.filter(n => n.sport === 'cricket'),
          f1: cachedNews.filter(n => n.sport === 'f1')
        };
        renderNewsView();
      }
    });
  }
}

/**
 * Fresh live score fetch from FotMob, CREX, F1, and News
 */
async function fetchLiveScores(showLoader = false) {
  if (showLoader && !appState.footballData && !appState.f1Data) {
    elements.loadingSpinner.style.display = 'flex';
  }

  try {
    const [fbRes, crRes, f1Res, newsRes, favsRes] = await Promise.allSettled([
      FotMobService.fetchMatches(),
      CrexService.fetchMatches(),
      F1Service.fetchF1Data(),
      NewsService.fetchAllNews(),
      FavoritesService.getFavorites()
    ]);

    if (fbRes.status === 'fulfilled' && fbRes.value) appState.footballData = fbRes.value;
    if (crRes.status === 'fulfilled' && crRes.value) appState.cricketData = crRes.value;
    if (f1Res.status === 'fulfilled' && f1Res.value) appState.f1Data = f1Res.value;
    if (newsRes.status === 'fulfilled' && newsRes.value) appState.newsData = newsRes.value;
    if (favsRes.status === 'fulfilled' && favsRes.value) appState.favorites = favsRes.value;

    updateFollowedMatches();
    renderAllViews();

    elements.lastUpdatedText.textContent = `Updated just now (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`;
  } catch (err) {
    console.error('Error fetching live scores:', err);
    elements.lastUpdatedText.textContent = 'Displaying cached scores (reconnecting)';
  } finally {
    elements.loadingSpinner.style.display = 'none';
  }
}

function updateFollowedMatches() {
  const fbMatches = appState.footballData?.allMatches || [];
  const crMatches = appState.cricketData?.allMatches || [];
  appState.followedMatches = FavoritesService.filterFollowedMatches(
    fbMatches, 
    crMatches, 
    appState.f1Data, 
    appState.favorites
  );
}

function renderAllViews() {
  updateBadges();
  renderCurrentTabView();
}

function renderCurrentTabView() {
  if (appState.currentTab === 'followed') {
    renderFollowedView();
  } else if (appState.currentTab === 'discover') {
    renderDiscoverView();
  } else if (appState.currentTab === 'news') {
    renderNewsView();
  } else if (appState.currentTab === 'football') {
    renderFootballView();
  } else if (appState.currentTab === 'cricket') {
    renderCricketView();
  } else if (appState.currentTab === 'f1') {
    renderF1View();
  } else if (appState.currentTab === 'settings') {
    renderSettingsChips();
  }
}

function updateBadges() {
  const followedCount = (appState.followedMatches || []).length;
  const liveFollowed = (appState.followedMatches || []).filter(m => m && m.isLive).length;

  const totalFavsCount = 
    (appState.favorites?.football || []).length + 
    (appState.favorites?.cricket || []).length + 
    (appState.favorites?.f1 || []).length;

  // 1. Following Tab Badge: strictly for followed items
  if (elements.badgeFollowed) {
    if (totalFavsCount > 0 && followedCount > 0) {
      elements.badgeFollowed.textContent = String(followedCount);
      elements.badgeFollowed.style.display = 'inline-flex';
      elements.badgeFollowed.classList.toggle('live-alert', liveFollowed > 0);
    } else {
      elements.badgeFollowed.textContent = '';
      elements.badgeFollowed.style.display = 'none';
      elements.badgeFollowed.classList.remove('live-alert');
    }
  }

  // 2. Clear/hide badges for general sport tabs (Football, Cricket, F1)
  if (elements.badgeFootball) elements.badgeFootball.style.display = 'none';
  if (elements.badgeCricket) elements.badgeCricket.style.display = 'none';
  if (elements.badgeF1) elements.badgeF1.style.display = 'none';

  // 3. Global Live Pill in header: strictly for followed live matches only
  if (elements.globalLivePill) {
    if (totalFavsCount > 0 && liveFollowed > 0) {
      elements.globalLivePill.style.display = 'inline-flex';
      if (elements.globalLiveCount) {
        elements.globalLiveCount.textContent = `${liveFollowed} LIVE`;
      }
    } else {
      elements.globalLivePill.style.display = 'none';
    }
  }

  // 4. Update extension toolbar icon badge: strictly for followed live events
  const activeFollowedLive = totalFavsCount > 0 ? liveFollowed : 0;
  updateToolbarBadge(activeFollowedLive);
}

/**
 * Synchronizes the extension toolbar icon badge:
 * Strictly shows badge count ONLY if a live event is actively going on for followed items.
 * If 0 followed events are live, badge is cleared completely.
 */
function updateToolbarBadge(liveFollowedCount) {
  try {
    if (typeof chrome !== 'undefined' && chrome.action && chrome.action.setBadgeText) {
      if (liveFollowedCount > 0) {
        chrome.action.setBadgeText({ text: String(liveFollowedCount) });
        chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
        if (chrome.action.setBadgeTextColor) {
          chrome.action.setBadgeTextColor({ color: '#ffffff' });
        }
        chrome.action.setTitle({ 
          title: `ScoreQuick: ${liveFollowedCount} Followed Event${liveFollowedCount > 1 ? 's' : ''} LIVE!` 
        });
      } else {
        // Clear badge completely: NO badge displayed when followed teams are not live
        chrome.action.setBadgeText({ text: '' });
        chrome.action.setTitle({ title: 'ScoreQuick Live Scores' });
      }
    }
  } catch (e) {
    console.warn('[ScoreQuick] Failed to update toolbar badge from popup:', e);
  }
}

/**
 * Render ⭐ Followed Feed
 * STRICTLY displays matches of followed teams/drivers.
 * Lightweight, fast, zero lag.
 */
function renderFollowedView() {
  let items = appState.followedMatches || [];

  if (appState.searchQuery) {
    items = items.filter(m => matchMatchesQuery(m, appState.searchQuery));
  }

  elements.followedList.innerHTML = '';

  if (items.length === 0) {
    elements.followedEmpty.style.display = 'block';
  } else {
    elements.followedEmpty.style.display = 'none';
    items.forEach(item => {
      if (item.sport === 'football') {
        elements.followedList.appendChild(createFootballCard(item));
      } else if (item.sport === 'cricket') {
        elements.followedList.appendChild(createCricketCard(item));
      } else if (item.sport === 'f1') {
        elements.followedList.appendChild(createFollowedF1Card(item));
      }
    });
  }
}

/**
 * Render 🔍 Discover Tab
 * Choose Sport, Search, and 1-Click Follow
 */
function renderDiscoverView() {
  if (!elements.discoverList) return;

  const fbMatches = appState.footballData?.allMatches || [];
  const crMatches = appState.cricketData?.allMatches || [];
  const fbLeagues = appState.footballData?.leagues || [];
  const crSeries = appState.cricketData?.series || [];
  let catalog = FavoritesService.getDiscoverableItems(
    appState.discoverSport, 
    fbMatches, 
    crMatches, 
    appState.f1Data, 
    fbLeagues, 
    crSeries
  );

  // Apply in-tab or global search
  const query = appState.discoverQuery || appState.searchQuery;
  if (query) {
    catalog = catalog.filter(item => 
      (item.name || '').toLowerCase().includes(query) ||
      (item.shortName || '').toLowerCase().includes(query) ||
      (item.team || '').toLowerCase().includes(query) ||
      (item.league || '').toLowerCase().includes(query) ||
      (item.category || '').toLowerCase().includes(query) ||
      (item.code || '').toLowerCase().includes(query)
    );
  }

  elements.discoverCountTag.textContent = `${catalog.length} Available`;
  elements.discoverList.innerHTML = '';

  catalog.forEach(item => {
    const card = document.createElement('div');
    card.className = `discover-card ${item.isLeague ? 'is-league-card' : ''}`;

    const isFollowed = item.isLeague
      ? FavoritesService.isLeagueFollowed(appState.favorites, item.sport, item.name, item.id)
      : FavoritesService.isTeamFollowed(appState.favorites, item.sport, item.name, item.id);

    // Subtitle
    let subtitle = '';
    if (item.isLeague) {
      subtitle = item.sport === 'football' ? '🏆 Football League' : '🏆 Cricket Tournament';
    } else if (item.sport === 'football') {
      subtitle = item.league || 'Football Club';
    } else if (item.sport === 'cricket') {
      subtitle = item.category || 'Cricket Team';
    } else if (item.sport === 'f1') {
      if (item.category === 'Constructor' || item.isTeam) {
        subtitle = '🏁 F1 Constructor';
      } else {
        subtitle = item.team ? `${item.team} #${item.number || ''}` : 'F1 Driver';
      }
    }

    // Avatar/Logo
    let avatarHtml = '';
    if (item.isLeague) {
      const logoUrl = item.logo || FavoritesService.getLeagueLogo(item.sport, item.name, item.id);
      avatarHtml = renderLeagueAvatar(logoUrl, item.name, item.sport, 'discover-avatar-wrapper');
    } else if (item.sport === 'f1') {
      if (item.category === 'Constructor' || item.isTeam) {
        avatarHtml = `<span class="discover-avatar" style="background: ${item.color || '#8b5cf6'}; color: #fff; font-size: 11px;">🏁</span>`;
      } else {
        avatarHtml = `<span class="discover-avatar" style="background: ${item.color || '#334155'}; color: #fff; font-size: 10px;">${item.code || item.name.substring(0, 3).toUpperCase()}</span>`;
      }
    } else {
      const sportKey = item.sport === 'cricket' ? 'cr' : 'fb';
      const logoUrl = item.logo || (item.sport === 'cricket' ? FavoritesService.getCricketLogo(item.name, item.shortName) : '');
      avatarHtml = renderTeamAvatar(logoUrl, item.name, item.shortName, sportKey);
    }

    card.innerHTML = `
      <div class="discover-card-left">
        ${avatarHtml}
        <div class="discover-meta">
          <span class="discover-name">${item.name}</span>
          <span class="discover-sub">${subtitle}</span>
        </div>
      </div>
      <button class="follow-toggle-btn ${isFollowed ? 'is-following' : ''}">
        ${isFollowed ? '★ Following' : '+ Follow'}
      </button>
    `;

    // Follow toggle button listener
    const btn = card.querySelector('.follow-toggle-btn');
    btn.addEventListener('click', async () => {
      await FavoritesService.toggleFollow(item.sport, item);
      appState.favorites = await FavoritesService.getFavorites();
      updateFollowedMatches();
      renderAllViews();
      renderSettingsChips();
    });

    elements.discoverList.appendChild(card);
  });
}

/**
 * Render 📰 Sports News Feed (FotMob, CREX, Official F1)
 */
function renderNewsView() {
  if (!elements.newsList) return;

  const allArticles = appState.newsData?.all || [];
  let filtered = [];

  if (appState.newsFilter === 'followed') {
    filtered = NewsService.filterFollowedNews(allArticles, appState.favorites);
  } else if (appState.newsFilter === 'all') {
    filtered = allArticles;
  } else {
    filtered = allArticles.filter(a => a.sport === appState.newsFilter);
  }

  // Search filter
  const query = appState.newsQuery || appState.searchQuery;
  if (query) {
    filtered = filtered.filter(a =>
      (a.title || '').toLowerCase().includes(query) ||
      (a.lead || '').toLowerCase().includes(query) ||
      (a.source || '').toLowerCase().includes(query)
    );
  }

  elements.newsCountTag.textContent = `${filtered.length} Articles`;
  elements.newsList.innerHTML = '';

  if (filtered.length === 0) {
    elements.newsEmpty.style.display = 'block';
    if (appState.newsFilter === 'followed') {
      const favsCount = (appState.favorites?.football?.length || 0) + (appState.favorites?.cricket?.length || 0) + (appState.favorites?.f1?.length || 0);
      if (favsCount === 0) {
        elements.newsEmptyDesc.textContent = "You aren't following any teams yet. Follow clubs, teams, or drivers in Discover to get tailored sports news!";
      } else {
        elements.newsEmptyDesc.textContent = "No recent headlines mention your followed teams right now. Switch to 'All Sports' to browse top stories!";
      }
    } else {
      elements.newsEmptyDesc.textContent = "No sports stories match your current search query.";
    }
  } else {
    elements.newsEmpty.style.display = 'none';
    filtered.forEach(article => {
      elements.newsList.appendChild(createNewsCard(article));
    });
  }
}

function createNewsCard(article) {
  const card = document.createElement('div');
  card.className = 'news-card';

  let sourceClass = 'news-source-fb';
  let sourceIcon = '⚽';
  if (article.sport === 'cricket') {
    sourceClass = 'news-source-cr';
    sourceIcon = '🏏';
  } else if (article.sport === 'f1') {
    sourceClass = 'news-source-f1';
    sourceIcon = '🏎️';
  }

  const imgUrl = article.imageUrl ? article.imageUrl.replace(/"/g, '&quot;') : '';
  const thumbnailHtml = imgUrl 
    ? `<div class="news-thumbnail-wrap">
         <img class="news-thumbnail" src="${imgUrl}" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" loading="lazy" alt="">
         <div class="news-placeholder" style="display:none;"><span class="news-placeholder-icon">${sourceIcon}</span></div>
       </div>`
    : `<div class="news-thumbnail-wrap"><div class="news-placeholder"><span class="news-placeholder-icon">${sourceIcon}</span></div></div>`;

  card.innerHTML = `
    ${thumbnailHtml}
    <div class="news-content">
      <div class="news-meta">
        <span class="news-source-pill ${sourceClass}">${sourceIcon} ${article.source}</span>
        <span class="news-time">${article.timeDisplay}</span>
      </div>
      <div class="news-title">${article.title}</div>
      ${article.lead ? `<div class="news-lead">${article.lead}</div>` : ''}
    </div>
  `;

  card.addEventListener('click', () => {
    if (article.url) {
      openTab(article.url);
    }
  });

  return card;
}

/**
 * Strict 24-Hour Window Filter:
 * Only adds matches which are live, have happened within the past 24 hours,
 * or will happen within the next 24 hours in the football and cricket tabs.
 */
function isMatchWithin24Hours(m) {
  if (!m) return false;
  // 1. All currently live matches are always included
  if (m.isLive) return true;

  const now = Date.now();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  // 12-hour buffer for matches that started yesterday (accounting for start time + multi-hour match duration)
  const FINISHED_BUFFER_MS = 12 * 60 * 60 * 1000;

  if (m.startTime && m.startTime !== 'null') {
    const startMs = new Date(m.startTime).getTime();
    if (!isNaN(startMs)) {
      if (m.isFinished) {
        if (startMs >= (now - TWENTY_FOUR_HOURS_MS - FINISHED_BUFFER_MS) && startMs <= now) {
          return true;
        }
      }
      if (m.isUpcoming) {
        const diff = startMs - now;
        if (diff >= -3600000 && diff <= TWENTY_FOUR_HOURS_MS) {
          return true;
        }
      }
    }
  }

  // Fallback for date strings
  if (m.dateDisplay) {
    const dLower = String(m.dateDisplay).toLowerCase();
    if (dLower.includes('today')) return true;
    if (dLower.includes('yesterday') && m.isFinished) return true;
    if (dLower.includes('tomorrow') && m.isUpcoming) return true;
  }

  return false;
}

/**
 * Render ⚽ Football (FotMob) Feed
 * Priority order: LIVE first, then most popular leagues (Tier 1), then less popular leagues.
 * STRICT: Only matches that are live, happened within 24h, or will happen within 24h.
 */
function renderFootballView() {
  elements.footballList.innerHTML = '';
  const leagues = appState.footballData?.leagues || [];

  const activeLeagueGroups = [];

  for (const league of leagues) {
    let matches = league.matches || [];

    // STRICT: Only live, happened within 24h, or will happen within 24h
    matches = matches.filter(isMatchWithin24Hours);

    if (appState.footballFilter === 'live') {
      matches = matches.filter(m => m.isLive);
    }

    if (appState.searchQuery) {
      matches = matches.filter(m => matchMatchesQuery(m, appState.searchQuery));
    }

    if (matches.length === 0) continue;

    // Sort matches inside league: Live first, finished (most recent first), then upcoming (by start time)
    matches.sort((a, b) => {
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

    activeLeagueGroups.push({
      ...league,
      matches
    });
  }

  // Sort leagues: Popularity (live / finished / upcoming) -> Other Live -> Other Upcoming -> Other Finished
  activeLeagueGroups.sort((a, b) => {
    const aRank = FotMobService.getLeagueSortRank(a);
    const bRank = FotMobService.getLeagueSortRank(b);
    return bRank - aRank;
  });

  let totalMatchesShown = 0;
  const fragment = document.createDocumentFragment();

  for (const league of activeLeagueGroups) {
    const matches = league.matches;
    totalMatchesShown += matches.length;

    // League Header
    const isLeagueFollowed = FavoritesService.isLeagueFollowed(appState.favorites, 'football', league.leagueName, league.leagueId);
    const leagueLogoUrl = league.leagueLogo || FavoritesService.getFootballLeagueLogo(league.leagueName, league.leagueId);
    const header = document.createElement('div');
    const hasLive = matches.some(m => m.isLive);
    header.className = `league-group-header ${hasLive ? 'has-live' : ''}`;
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 7px; overflow: hidden;">
        ${renderLeagueAvatar(leagueLogoUrl, league.leagueName, 'football', 'header-league-logo')}
        <span class="league-group-name">${league.countryCode ? `[${league.countryCode}] ` : ''}${league.leagueName}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
        <span style="font-size: 9px; opacity: 0.85;">${hasLive ? '🔴 LIVE • ' : ''}${matches.length} match${matches.length > 1 ? 'es' : ''}</span>
        <button class="star-btn league-follow-btn ${isLeagueFollowed ? 'followed' : ''}" title="${isLeagueFollowed ? 'Unfollow League' : 'Follow Entire League'}">
          ${isLeagueFollowed ? '★' : '☆'}
        </button>
      </div>
    `;

    const leagueStarBtn = header.querySelector('.league-follow-btn');
    leagueStarBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await FavoritesService.toggleFollow('football', {
        id: league.leagueId,
        name: league.leagueName,
        isLeague: true,
        category: 'League',
        logo: leagueLogoUrl
      });
      appState.favorites = await FavoritesService.getFavorites();
      updateFollowedMatches();
      renderAllViews();
      renderSettingsChips();
    });
    fragment.appendChild(header);

    // Matches
    matches.forEach(m => {
      fragment.appendChild(createFootballCard(m));
    });
  }

  elements.footballList.appendChild(fragment);
  elements.footballEmpty.style.display = totalMatchesShown === 0 ? 'block' : 'none';
}

/**
 * Render 🏏 Cricket Feed
 * Priority order: Popularity (live / finished / upcoming) -> Other Live -> Other Upcoming -> Other Finished.
 * STRICT: Only matches that are live, happened within 24h, or will happen within 24h.
 */
function renderCricketView() {
  elements.cricketList.innerHTML = '';
  const seriesGroups = appState.cricketData?.series || [];

  const activeSeriesGroups = [];

  for (const group of seriesGroups) {
    let matches = group.matches || [];

    // STRICT: Only live, happened within 24h, or will happen within 24h
    matches = matches.filter(isMatchWithin24Hours);

    if (appState.cricketFilter === 'live') {
      matches = matches.filter(m => m.isLive);
    }

    if (appState.searchQuery) {
      matches = matches.filter(m => matchMatchesQuery(m, appState.searchQuery));
    }

    if (matches.length === 0) continue;

    // Sort matches inside series: Live first, finished (most recent first), then upcoming
    matches.sort((a, b) => {
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

    activeSeriesGroups.push({
      ...group,
      matches
    });
  }

  // Sort series: Popularity (live / finished / upcoming) -> Other Live -> Other Upcoming -> Other Finished
  activeSeriesGroups.sort((a, b) => {
    const aRank = CrexService.getSeriesSortRank(a);
    const bRank = CrexService.getSeriesSortRank(b);
    return bRank - aRank;
  });

  let totalMatchesShown = 0;
  const fragment = document.createDocumentFragment();

  for (const group of activeSeriesGroups) {
    const matches = group.matches;
    totalMatchesShown += matches.length;

    // Series Header
    const isSeriesFollowed = FavoritesService.isLeagueFollowed(appState.favorites, 'cricket', group.seriesName);
    const seriesLogoUrl = group.seriesLogo || (group.matches && group.matches[0]?.seriesLogo) || FavoritesService.getTournamentLogo(group.seriesName) || FavoritesService.getCricketLogo(group.seriesName);
    const header = document.createElement('div');
    const hasLive = matches.some(m => m.isLive);
    header.className = `league-group-header ${hasLive ? 'has-live' : ''}`;
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 7px; overflow: hidden;">
        ${renderLeagueAvatar(seriesLogoUrl, group.seriesName, 'cricket', 'header-league-logo')}
        <span class="league-group-name">${group.seriesName}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
        <span style="font-size: 9px; opacity: 0.85;">${hasLive ? '🔴 LIVE • ' : ''}${matches.length} match${matches.length > 1 ? 'es' : ''}</span>
        <button class="star-btn series-follow-btn ${isSeriesFollowed ? 'followed' : ''}" title="${isSeriesFollowed ? 'Unfollow Tournament' : 'Follow Tournament'}">
          ${isSeriesFollowed ? '★' : '☆'}
        </button>
      </div>
    `;

    const seriesStarBtn = header.querySelector('.series-follow-btn');
    seriesStarBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await FavoritesService.toggleFollow('cricket', {
        id: group.seriesName.toLowerCase().replace(/\s+/g, '_'),
        name: group.seriesName,
        isLeague: true,
        category: 'Tournament',
        logo: seriesLogoUrl
      });
      appState.favorites = await FavoritesService.getFavorites();
      updateFollowedMatches();
      renderAllViews();
      renderSettingsChips();
    });
    fragment.appendChild(header);

    // Matches
    matches.forEach(m => {
      fragment.appendChild(createCricketCard(m));
    });
  }

  elements.cricketList.appendChild(fragment);
  elements.cricketEmpty.style.display = totalMatchesShown === 0 ? 'block' : 'none';
}

/**
 * Render 🏎️ Formula 1 Feed
 * Strictly displays ONLY:
 * 1. Last Grand Prix (Date, Circuit, Podium P1/P2/P3, Pole Sitter & Sprint Results)
 * 2. Upcoming Grand Prix (Circuit, Countdown, Full Schedule: FP1/FP2/FP3, Sprint Quali, Sprint, Quali, Main Race)
 */
function renderF1View() {
  const f1 = appState.f1Data;
  if (!f1 || (!f1.lastGrandPrix && !f1.upcomingGrandPrix)) {
    elements.f1Content.style.display = 'none';
    elements.f1Empty.style.display = 'block';
    return;
  }

  elements.f1Content.style.display = 'flex';
  elements.f1Empty.style.display = 'none';

  const q = appState.searchQuery || '';

  // 1. Last Grand Prix Card
  const lastGp = f1.lastGrandPrix;
  const matchLast = !q || (lastGp && (
    lastGp.name.toLowerCase().includes(q) ||
    lastGp.circuit.toLowerCase().includes(q) ||
    lastGp.location.toLowerCase().includes(q) ||
    (lastGp.podium || []).some(p => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)) ||
    (lastGp.pole && (lastGp.pole.name.toLowerCase().includes(q) || lastGp.pole.team.toLowerCase().includes(q)))
  ));

  if (lastGp && matchLast) {
    elements.f1LastGpCard.style.display = 'flex';

    // Podium HTML
    const podiumHtml = (lastGp.podium || []).map(p => {
      const medal = p.position === 1 ? '🥇' : p.position === 2 ? '🥈' : '🥉';
      const rankClass = `p${p.position}`;
      const isDriverFav = FavoritesService.isTeamFollowed(appState.favorites, 'f1', p.name) ||
                          FavoritesService.isTeamFollowed(appState.favorites, 'f1', p.code);
      const isTeamFav = FavoritesService.isTeamFollowed(appState.favorites, 'f1', p.team);

      return `
        <div class="f1-podium-card ${rankClass}">
          <div class="podium-team-stripe" style="background-color: ${p.teamColor};"></div>
          <div class="podium-top">
            <span class="podium-medal">${medal} P${p.position}</span>
            <span class="podium-time">${p.time || ''}</span>
          </div>
          <div class="podium-driver-name ${isDriverFav ? 'is-fav' : ''}">${p.name}</div>
          <div class="podium-team-name ${isTeamFav ? 'is-fav' : ''}" style="color: ${p.teamColor};">${p.team}</div>
        </div>
      `;
    }).join('');

    // Pole position and sprint HTML
    let highlightsHtml = '';
    if (lastGp.pole) {
      highlightsHtml += `
        <div class="f1-highlight-chip">
          <span class="highlight-icon">⏱️</span>
          <span class="highlight-label">Pole Position:</span>
          <span class="highlight-val">${lastGp.pole.name} (${lastGp.pole.team}) • <strong>${lastGp.pole.time}</strong></span>
        </div>
      `;
    }
    if (lastGp.sprint && lastGp.sprint.winner) {
      highlightsHtml += `
        <div class="f1-highlight-chip sprint">
          <span class="highlight-icon">⚡</span>
          <span class="highlight-label">Sprint Winner:</span>
          <span class="highlight-val">${lastGp.sprint.winner.name} (${lastGp.sprint.winner.team})</span>
        </div>
      `;
    }

    elements.f1LastGpCard.innerHTML = `
      <div class="f1-card-header">
        <div class="f1-card-label-badge last-gp">
          <span>🏁</span>
          <span>Last Grand Prix • Round ${lastGp.round}</span>
        </div>
        <a href="${lastGp.url || 'https://www.formula1.com'}" target="_blank" class="f1-card-link-btn" title="View official F1 results">
          F1 Official ↗
        </a>
      </div>

      <div class="f1-gp-main-title">${lastGp.name}</div>
      <div class="f1-meta-row">
        <span>📅 ${lastGp.date}</span>
        <span>📍 ${lastGp.circuit} • ${lastGp.location}</span>
      </div>

      <div class="f1-section-subtitle">🏆 Podium Results</div>
      <div class="f1-podium-grid">
        ${podiumHtml}
      </div>

      ${highlightsHtml ? `<div class="f1-highlights-bar">${highlightsHtml}</div>` : ''}
    `;
  } else {
    elements.f1LastGpCard.style.display = 'none';
  }

  // 2. Upcoming Grand Prix Card
  const upcomingGp = f1.upcomingGrandPrix;
  const matchUpcoming = !q || (upcomingGp && (
    upcomingGp.name.toLowerCase().includes(q) ||
    upcomingGp.circuit.toLowerCase().includes(q) ||
    upcomingGp.location.toLowerCase().includes(q) ||
    (upcomingGp.sessions || []).some(s => s.name.toLowerCase().includes(q))
  ));

  if (upcomingGp && matchUpcoming) {
    elements.f1UpcomingGpCard.style.display = 'flex';

    // Sessions HTML
    const sessionsHtml = (upcomingGp.sessions || []).map(s => {
      let badgeClass = 'practice';
      if (s.type === 'race') badgeClass = 'race';
      else if (s.type === 'qualifying') badgeClass = 'qualifying';
      else if (s.type === 'sprint' || s.type === 'sprint_qualifying') badgeClass = 'sprint';

      let statusBadgeClass = 'upcoming';
      if (s.status === 'live') statusBadgeClass = 'live';
      else if (s.status === 'completed') statusBadgeClass = 'finished';

      return `
        <div class="f1-session-item ${s.status === 'live' ? 'is-live' : ''} ${s.status === 'completed' ? 'is-completed' : ''}">
          <div class="session-info-left">
            <span class="session-type-badge ${badgeClass}">${s.shortType}</span>
            <div class="session-title-block">
              <span class="session-name">${s.name}</span>
              <span class="session-date-time">${s.fullDisplay}</span>
            </div>
          </div>
          <div class="session-info-right">
            <span class="match-status-badge ${statusBadgeClass}">${s.statusText}</span>
          </div>
        </div>
      `;
    }).join('');

    elements.f1UpcomingGpCard.innerHTML = `
      <div class="f1-card-header">
        <div class="f1-card-label-badge upcoming-gp">
          <span>🏎️</span>
          <span>Upcoming Grand Prix • Round ${upcomingGp.round}</span>
        </div>
        <span class="f1-countdown-tag">${upcomingGp.countdownText}</span>
      </div>

      <div class="f1-gp-main-title">${upcomingGp.name}</div>
      <div class="f1-meta-row">
        <span>📅 ${upcomingGp.dateRange}</span>
        <span>📍 ${upcomingGp.circuit} • ${upcomingGp.location}</span>
      </div>

      <div class="f1-schedule-section">
        <div class="f1-schedule-header">
          <span>⏱️ Weekend Schedule &amp; Session Timings</span>
          <span class="f1-local-hint">Local Browser Time</span>
        </div>
        <div class="f1-sessions-list">
          ${sessionsHtml}
        </div>
      </div>
    `;
  } else {
    elements.f1UpcomingGpCard.style.display = 'none';
  }

  const noneShown = (!lastGp || !matchLast) && (!upcomingGp || !matchUpcoming);
  elements.f1Empty.style.display = noneShown ? 'block' : 'none';
}

/**
 * Universal Team Avatar & Fallback Badge Generator
 * If the CDN image loads, it is displayed.
 * If the CDN image 404s or fails, it seamlessly reveals a sport-themed initials badge.
 */
function renderTeamAvatar(logoUrl, name = '', shortName = '', sport = 'cricket') {
  const cleanAbbr = (shortName || name || '?')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase();

  if (!logoUrl) {
    return `<div class="team-logo-wrapper"><span class="team-avatar-fallback ${sport}">${cleanAbbr}</span></div>`;
  }

  return `
    <div class="team-logo-wrapper">
      <img class="team-logo" src="${logoUrl}" alt="" loading="lazy"
           onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline-flex';">
      <span class="team-avatar-fallback ${sport}" style="display: none;">${cleanAbbr}</span>
    </div>
  `;
}

/**
 * Universal League Avatar & Fallback Badge Generator
 * Renders verified high-res competition logos across headers, cards, and discover catalog.
 */
function renderLeagueAvatar(logoUrl, name = '', sport = 'football', extraClass = '') {
  const fallbackIcon = sport === 'cricket' ? '🏏' : (sport === 'f1' ? '🏎️' : '⚽');

  if (!logoUrl) {
    return `
      <div class="league-logo-wrapper ${extraClass}">
        <span class="league-avatar-fallback ${sport}" title="${name}">${fallbackIcon}</span>
      </div>
    `;
  }

  return `
    <div class="league-logo-wrapper ${extraClass}">
      <img class="league-logo-img" src="${logoUrl}" alt="${name}" loading="lazy"
           onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='inline-flex';">
      <span class="league-avatar-fallback ${sport}" style="display: none;" title="${name}">${fallbackIcon}</span>
    </div>
  `;
}

/**
 * Clean Overs Formatter (avoids duplicate 'ov ov' artifacts)
 */
function formatCricketOvers(ov) {
  if (!ov) return '';
  const clean = String(ov).replace(/\s*ov(ers)?/gi, '').trim();
  if (!clean || clean === '0' || clean === '0.0') return '';
  return `(${clean} ov)`;
}

/**
 * Football Match Card Factory - Clicking opens EXACT FotMob match center
 */
function createFootballCard(m) {
  const card = document.createElement('div');
  card.className = `match-card ${m.isLive ? 'is-live' : ''}`;

  const isHomeFollowed = FavoritesService.isTeamFollowed(appState.favorites, 'football', m.home.name, m.home.id);
  const isAwayFollowed = FavoritesService.isTeamFollowed(appState.favorites, 'football', m.away.name, m.away.id);
  const isLeagueFollowed = FavoritesService.isLeagueFollowed(appState.favorites, 'football', m.leagueName, m.leagueId);
  const isCardFollowed = isHomeFollowed || isAwayFollowed || isLeagueFollowed;

  const statusClass = m.isLive ? 'live' : (m.isFinished ? 'finished' : 'upcoming');

  const homeScoreText = (m.isLive || m.isFinished) && m.home.score !== null ? m.home.score : '-';
  const awayScoreText = (m.isLive || m.isFinished) && m.away.score !== null ? m.away.score : '-';
  const leagueLogoUrl = m.leagueLogo || FavoritesService.getFootballLeagueLogo(m.leagueName, m.leagueId);

  card.innerHTML = `
    <div class="card-top-bar">
      <div class="sport-badge">
        ${renderLeagueAvatar(leagueLogoUrl, m.leagueName, 'football', 'card-league-badge')}
        <span class="card-league-title">${m.leagueName || 'Football'}</span>
        ${m.dateDisplay ? `<span style="font-size: 10px; color: #c084fc; margin-left: 2px; font-weight: 500;">• ${m.dateDisplay}</span>` : ''}
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span class="match-status-badge ${statusClass}">${m.timeDisplay || 'Upcoming'}</span>
        <button class="star-btn ${isCardFollowed ? 'followed' : ''}" title="Follow Match Teams">
          ${isCardFollowed ? '★' : '☆'}
        </button>
      </div>
    </div>
    <div class="football-teams-row">
      <div class="team-entry">
        <div class="team-info">
          ${renderTeamAvatar(m.home.logo, m.home.name, '', 'fb')}
          <span class="team-name ${isHomeFollowed ? 'is-fav' : ''}">${m.home.name}</span>
        </div>
        <span class="team-score ${(m.isLive || m.isFinished) && m.home.score > m.away.score ? 'winning' : ''}">${homeScoreText}</span>
      </div>
      <div class="team-entry">
        <div class="team-info">
          ${renderTeamAvatar(m.away.logo, m.away.name, '', 'fb')}
          <span class="team-name ${isAwayFollowed ? 'is-fav' : ''}">${m.away.name}</span>
        </div>
        <span class="team-score ${(m.isLive || m.isFinished) && m.away.score > m.home.score ? 'winning' : ''}">${awayScoreText}</span>
      </div>
    </div>
  `;

  // Star button listener
  const starBtn = card.querySelector('.star-btn');
  starBtn.addEventListener('click', async e => {
    e.stopPropagation();
    if (isHomeFollowed) {
      await FavoritesService.toggleFollow('football', m.home);
    } else if (isAwayFollowed) {
      await FavoritesService.toggleFollow('football', m.away);
    } else if (isLeagueFollowed) {
      await FavoritesService.toggleFollow('football', { name: m.leagueName, id: m.leagueId, isLeague: true, category: 'League' });
    } else {
      await FavoritesService.toggleFollow('football', m.home);
    }
    appState.favorites = await FavoritesService.getFavorites();
    updateFollowedMatches();
    renderAllViews();
    renderSettingsChips();
  });

  // Card click opens the EXACT match page on FotMob
  card.addEventListener('click', () => {
    const targetUrl = m.matchUrl || m.fotmobUrl || `https://www.fotmob.com/match/${m.rawId}`;
    openTab(targetUrl);
  });

  return card;
}

/**
 * Cricket Match Card Factory - Clean title without badges, deep ball-to-ball & over telemetry
 */
function createCricketCard(m) {
  const card = document.createElement('div');
  card.className = `match-card ${m.isLive ? 'is-live' : ''}`;

  const isT1Followed = FavoritesService.isTeamFollowed(appState.favorites, 'cricket', m.team1.name) || FavoritesService.isTeamFollowed(appState.favorites, 'cricket', m.team1.shortName);
  const isT2Followed = FavoritesService.isTeamFollowed(appState.favorites, 'cricket', m.team2.name) || FavoritesService.isTeamFollowed(appState.favorites, 'cricket', m.team2.shortName);
  const isSeriesFollowed = FavoritesService.isLeagueFollowed(appState.favorites, 'cricket', m.seriesName);
  const isCardFollowed = isT1Followed || isT2Followed || isSeriesFollowed;

  const statusClass = m.isLive ? 'live' : (m.isFinished ? 'finished' : 'upcoming');

  // Build a human-readable time display for the status badge
  let cricketTimeDisplay = m.isLive ? 'LIVE' : (m.isFinished ? 'FT' : 'Upcoming');
  if (m.startTime && !m.isLive) {
    try {
      const d = new Date(m.startTime);
      if (!isNaN(d.getTime())) {
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = d.toDateString() === yesterday.toDateString();
        const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrow = d.toDateString() === tomorrow.toDateString();
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (m.isUpcoming) {
          if (isToday) cricketTimeDisplay = timeStr;
          else if (isTomorrow) cricketTimeDisplay = `Tom ${timeStr}`;
          else cricketTimeDisplay = `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })} ${timeStr}`;
        } else if (m.isFinished) {
          if (isToday) cricketTimeDisplay = 'FT';
          else if (isYesterday) cricketTimeDisplay = 'FT (Yesterday)';
          else cricketTimeDisplay = `FT (${d.toLocaleDateString([], { day: 'numeric', month: 'short' })})`;
        }
      }
    } catch (_) {}
  }

  // Target URL prioritizes exact match link on Cricinfo or CREX
  const targetUrl = m.cricinfoUrl || m.matchUrl || m.crexUrl || 'https://www.espncricinfo.com';

  const t1OversText = formatCricketOvers(m.team1.overs);
  const t2OversText = formatCricketOvers(m.team2.overs);

  // Ball-by-ball telemetry (both previous and current overs supported)
  const renderBallPill = (ball) => {
    const b = String(ball).trim();
    let pCls = 'dot';
    let label = b;
    const bLower = b.toLowerCase();
    if (b === '0' || b === '•' || b === '.' || b === '') {
      pCls = 'dot';
      label = '•';
    } else if (b === '4') {
      pCls = 'four';
      label = '4';
    } else if (b === '6') {
      pCls = 'six';
      label = '6';
    } else if (bLower.includes('w') || bLower === 'out') {
      pCls = 'wicket';
      label = 'W';
    } else if (bLower.includes('nb') || bLower.includes('wd') || bLower.includes('lb') || bLower.includes('b')) {
      pCls = 'extra';
      label = b.toUpperCase();
    } else {
      pCls = 'runs';
      label = b;
    }
    return `<span class="ball-pill ${pCls}">${label}</span>`;
  };

  let overPillsHtml = '';
  const hasCurrentBalls = m.currentOverBalls && Array.isArray(m.currentOverBalls) && m.currentOverBalls.length > 0;
  const hasPrevBalls = m.previousOverBalls && Array.isArray(m.previousOverBalls) && m.previousOverBalls.length > 0;

  if (m.isLive && (hasCurrentBalls || hasPrevBalls)) {
    const prevHtml = hasPrevBalls ? `
      <div class="over-group prev-over">
        <span class="over-label">${m.previousOverNumber || 'Prev Ov'}:</span>
        <div class="ball-pills">${m.previousOverBalls.map(renderBallPill).join('')}</div>
        ${m.previousOverTotal !== null && m.previousOverTotal !== undefined ? `<span class="over-total">${m.previousOverTotal}r</span>` : ''}
      </div>
    ` : '';

    const currentHtml = hasCurrentBalls ? `
      <div class="over-group current-over">
        <span class="over-label current">${m.currentOverNumber || 'This Over'}:</span>
        <div class="ball-pills">${m.currentOverBalls.map(renderBallPill).join('')}</div>
        ${m.currentOverTotal !== null && m.currentOverTotal !== undefined ? `<span class="over-total">${m.currentOverTotal}r</span>` : ''}
      </div>
    ` : '';

    overPillsHtml = `
      <div class="cricket-over-strip">
        ${prevHtml}
        ${hasPrevBalls && hasCurrentBalls ? '<div class="over-divider"></div>' : ''}
        ${currentHtml}
      </div>
    `;
  }

  // Active Batsmen & Bowler Crease Ticker
  let creaseHtml = '';
  if (m.isLive) {
    if (m.striker) {
      creaseHtml = `
        <div class="cricket-crease-strip">
          <div class="crease-batsmen">
            <span class="crease-bat-icon">🏏</span>
            <span class="striker">${m.striker.name} <strong>${m.striker.runs}</strong>${m.striker.balls ? `<span class="crease-balls">(${m.striker.balls})</span>` : ''}*</span>
            ${m.nonStriker ? `
              <span class="crease-sep">•</span>
              <span class="non-striker">${m.nonStriker.name} <strong>${m.nonStriker.runs}</strong>${m.nonStriker.balls ? `<span class="crease-balls">(${m.nonStriker.balls})</span>` : ''}</span>
            ` : ''}
            ${m.partnership ? `<span class="crease-partner">| Part: ${m.partnership.runs}${m.partnership.balls ? ` (${m.partnership.balls})` : ''}</span>` : ''}
          </div>
          ${m.bowler ? `
            <div class="crease-bowler">
              <span class="bowler-icon">⚾</span>
              <span class="bowler-name">${m.bowler.name}</span>
              <span class="bowler-figures">${m.bowler.figures || ''}${m.bowler.overs ? ` (${m.bowler.overs} ov)` : ''}</span>
              ${m.bowler.eco ? `<span class="bowler-eco">E: ${m.bowler.eco}</span>` : ''}
            </div>
          ` : ''}
        </div>
      `;
    } else if (m.liveDetail) {
      creaseHtml = `
        <div class="cricket-crease-strip">
          <div class="crease-batsmen">
            <span class="crease-bat-icon">🏏</span>
            <span class="striker">${m.liveDetail}</span>
          </div>
          ${m.liveOver ? `<div class="crease-bowler">${m.liveOver}</div>` : ''}
        </div>
      `;
    }
  }

  // Match Situation & Target
  let situationHtml = '';
  const sitText = m.situation || m.statusText || '';
  if (sitText) {
    situationHtml = `
      <div class="cricket-situation">
        ${m.target ? `<span class="situation-target">🎯 Target: ${m.target} •</span>` : ''}
        <span class="situation-text">${sitText}</span>
        ${(m.crr || m.rrr) ? `
          <span class="situation-rates">(CRR: <strong>${m.crr || '-'}</strong>${m.rrr ? ` • RRR: <strong>${m.rrr}</strong>` : ''})</span>
        ` : ''}
      </div>
    `;
  }

  const seriesLogoUrl = m.seriesLogo || FavoritesService.getTournamentLogo(m.seriesName) || FavoritesService.getCricketLogo(m.seriesName);

  card.innerHTML = `
    <div class="card-top-bar">
      <div class="sport-badge">
        ${renderLeagueAvatar(seriesLogoUrl, m.seriesName, 'cricket', 'card-league-badge')}
        <span class="card-league-title">[${m.format}] ${m.matchTitle}</span>
      </div>
      <div style="display: flex; align-items: center; gap: 6px;">
        <span class="match-status-badge ${statusClass}">${cricketTimeDisplay}</span>
        <button class="star-btn ${isCardFollowed ? 'followed' : ''}" title="Follow Cricket Teams">
          ${isCardFollowed ? '★' : '☆'}
        </button>
      </div>
    </div>
    <div class="cricket-card-body">
      <div class="cricket-series-title">${m.seriesName}${m.dateDisplay ? ' • ' + m.dateDisplay : ''}${m.venue ? ' • ' + m.venue : ''}</div>
      <div class="cricket-team-row">
        <div class="team-info">
          ${renderTeamAvatar(m.team1.flag, m.team1.name, m.team1.shortName, 'cr')}
          <span class="team-name ${isT1Followed ? 'is-fav' : ''}">${m.team1.name || m.team1.shortName}</span>
          ${m.team1.isBatting ? '<span class="batting-badge" title="Currently Batting">🏏 Batting</span>' : ''}
        </div>
        <div class="cricket-score-block">
          <span class="cricket-runs">${m.team1.score || '-'}</span>
          ${t1OversText ? `<span class="cricket-overs">${t1OversText}</span>` : ''}
        </div>
      </div>
      <div class="cricket-team-row">
        <div class="team-info">
          ${renderTeamAvatar(m.team2.flag, m.team2.name, m.team2.shortName, 'cr')}
          <span class="team-name ${isT2Followed ? 'is-fav' : ''}">${m.team2.name || m.team2.shortName}</span>
          ${m.team2.isBatting ? '<span class="batting-badge" title="Currently Batting">🏏 Batting</span>' : ''}
        </div>
        <div class="cricket-score-block">
          <span class="cricket-runs">${m.team2.score || '-'}</span>
          ${t2OversText ? `<span class="cricket-overs">${t2OversText}</span>` : ''}
        </div>
      </div>
      ${overPillsHtml}
      ${creaseHtml}
      ${situationHtml}
    </div>
  `;

  // Star button listener
  const starBtn = card.querySelector('.star-btn');
  starBtn.addEventListener('click', async e => {
    e.stopPropagation();
    if (isT1Followed) {
      await FavoritesService.toggleFollow('cricket', m.team1);
    } else if (isT2Followed) {
      await FavoritesService.toggleFollow('cricket', m.team2);
    } else if (isSeriesFollowed) {
      await FavoritesService.toggleFollow('cricket', { name: m.seriesName, isLeague: true, category: 'Tournament' });
    } else {
      await FavoritesService.toggleFollow('cricket', m.team1);
    }
    appState.favorites = await FavoritesService.getFavorites();
    updateFollowedMatches();
    renderAllViews();
    renderSettingsChips();
  });

  // Card click opens EXACT match
  card.addEventListener('click', () => {
    openTab(targetUrl);
  });

  return card;
}

/**
 * Followed F1 Card in the Following Feed
 */
function createFollowedF1Card(item) {
  const card = document.createElement('div');
  card.className = `match-card ${item.isLive ? 'is-live' : ''}`;

  card.innerHTML = `
    <div class="card-top-bar">
      <div class="sport-badge">
        <span>🏎️ F1 • ${item.grandPrix}</span>
      </div>
      <span class="match-status-badge ${item.isLive ? 'live' : 'finished'}">${item.statusText}</span>
    </div>
    <div style="font-size: 11px; color: var(--text-dim); margin-bottom: 6px;">
      ${item.officialName || item.sessionName}
    </div>
    <div class="f1-leaderboard-list">
      ${item.followedDrivers.map(d => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; background: rgba(255,255,255,0.025); border-radius: 4px; border-left: 3px solid ${d.teamColor}; margin-bottom: 3px;">
          <span style="font-weight: 600; color: #ffffff; font-size: 11.5px;">P${d.position} • ${d.name} <span style="color: var(--text-dim); font-size: 9.5px;">(${d.team})</span></span>
          <span style="font-family: monospace; font-weight: 700; color: #ffffff; font-size: 11px;">${d.gap}</span>
        </div>
      `).join('')}
    </div>
  `;

  card.addEventListener('click', () => {
    openTab('https://www.formula1.com/en/f1-live.html');
  });

  return card;
}

function matchMatchesQuery(match, query) {
  if (match.sport === 'football') {
    return (
      (match.home?.name || '').toLowerCase().includes(query) ||
      (match.away?.name || '').toLowerCase().includes(query) ||
      (match.leagueName || '').toLowerCase().includes(query)
    );
  } else if (match.sport === 'cricket') {
    return (
      (match.team1?.name || '').toLowerCase().includes(query) ||
      (match.team1?.shortName || '').toLowerCase().includes(query) ||
      (match.team2?.name || '').toLowerCase().includes(query) ||
      (match.team2?.shortName || '').toLowerCase().includes(query) ||
      (match.seriesName || '').toLowerCase().includes(query)
    );
  } else if (match.sport === 'f1') {
    return (
      (match.grandPrix || '').toLowerCase().includes(query) ||
      (match.officialName || '').toLowerCase().includes(query) ||
      (match.followedDrivers || []).some(d => d.name.toLowerCase().includes(query) || d.team.toLowerCase().includes(query))
    );
  }
  return false;
}

/**
 * Settings UI & Chips
 */
function renderSettingsChips() {
  if (!appState.favorites) return;

  // Football chips
  elements.followedFbChips.innerHTML = '';
  const fbFavs = appState.favorites.football || [];
  if (fbFavs.length === 0) {
    elements.followedFbChips.innerHTML = '<span class="no-chips-hint">None</span>';
  } else {
    fbFavs.forEach(team => {
      elements.followedFbChips.appendChild(createChip('football', team));
    });
  }

  // Cricket chips
  elements.followedCrChips.innerHTML = '';
  const crFavs = appState.favorites.cricket || [];
  if (crFavs.length === 0) {
    elements.followedCrChips.innerHTML = '<span class="no-chips-hint">None</span>';
  } else {
    crFavs.forEach(team => {
      elements.followedCrChips.appendChild(createChip('cricket', team));
    });
  }

  // F1 chips
  elements.followedF1Chips.innerHTML = '';
  const f1Favs = appState.favorites.f1 || [];
  if (f1Favs.length === 0) {
    elements.followedF1Chips.innerHTML = '<span class="no-chips-hint">None</span>';
  } else {
    f1Favs.forEach(team => {
      elements.followedF1Chips.appendChild(createChip('f1', team));
    });
  }
}

function createChip(sport, item) {
  const chip = document.createElement('span');
  chip.className = `team-chip ${item.isLeague ? 'league-chip' : ''}`;
  let tag = '';
  let logoUrl = item.logo || '';
  if (item.isLeague) {
    tag = sport === 'football' ? ' [League]' : ' [Tournament]';
    if (!logoUrl) {
      logoUrl = FavoritesService.getLeagueLogo(sport, item.name, item.id);
    }
  } else if (!logoUrl) {
    if (sport === 'cricket') logoUrl = FavoritesService.getCricketLogo(item.name, item.shortName);
  }

  const logoHtml = logoUrl ? `<img src="${logoUrl}" class="chip-logo" onerror="this.style.display='none'">` : '';

  chip.innerHTML = `
    ${logoHtml}
    <span>${item.name || item.shortName}${tag}</span>
    <button class="chip-remove-btn" title="Remove">&times;</button>
  `;
  chip.querySelector('button').addEventListener('click', async () => {
    await FavoritesService.toggleFollow(sport, item);
    appState.favorites = await FavoritesService.getFavorites();
    updateFollowedMatches();
    renderAllViews();
    renderSettingsChips();
  });
  return chip;
}

/**
 * Triggers smooth spinning animation on the reload button arrows
 */
function triggerRefreshAnimation(isRefreshing) {
  if (elements.refreshBtn) {
    if (isRefreshing) {
      elements.refreshBtn.classList.remove('rotating');
      void elements.refreshBtn.offsetWidth; // Force reflow so 2-spin animation reliably plays from 0deg
      elements.refreshBtn.classList.add('rotating');
    } else {
      elements.refreshBtn.classList.remove('rotating');
    }
  }
}

/**
 * Auto-refresh countdown timer
 * Only rotates the refresh arrows when refreshing without changing timer text or colors.
 */
function startAutoRefreshCountdown() {
  if (appState.countdownTimer) clearInterval(appState.countdownTimer);

  appState.refreshSecondsLeft = appState.refreshIntervalTotal;
  updateTimerBadge();

  appState.countdownTimer = setInterval(async () => {
    appState.refreshSecondsLeft--;
    if (appState.refreshSecondsLeft <= 0) {
      triggerRefreshAnimation(true);
      resetRefreshTimer();
      const fetchTask = fetchLiveScores(false);
      await Promise.all([
        fetchTask,
        new Promise(r => setTimeout(r, 1700))
      ]);
      triggerRefreshAnimation(false);
    } else {
      updateTimerBadge();
    }
  }, 1000);
}

function resetRefreshTimer() {
  appState.refreshSecondsLeft = appState.refreshIntervalTotal;
  updateTimerBadge();
}

function updateTimerBadge() {
  if (elements.refreshTimer) {
    elements.refreshTimer.textContent = `${appState.refreshSecondsLeft}s`;
  }
}
