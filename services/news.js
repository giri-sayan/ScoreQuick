/**
 * ScoreQuick - Sports News Aggregator Service
 * Copyright (c) 2026 Giri Sayan. All Rights Reserved.
 * PROPRIETARY & CONFIDENTIAL. Unauthorized copying, modification, or distribution is prohibited.
 *
 * Aggregates rich sports news across Football, Cricket, and Formula 1.
 */

async function fetchWithTimeout(url, options = {}, timeoutMs = 3000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export class NewsService {
  static STORAGE_KEY = 'scorequick_cached_news';
  static CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache for news
  static _memoryCache = null;
  static _lastFetchTime = 0;

  /**
   * Fetch all news across Football, Cricket, and F1.
   * Throttled with 5-minute memory and storage cache so fast 10s score polling never stalls.
   */
  static async fetchAllNews(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this._memoryCache && (now - this._lastFetchTime < this.CACHE_TTL_MS)) {
      return this._memoryCache;
    }

    try {
      const [footballResult, cricketResult, f1Result] = await Promise.allSettled([
        this.fetchFootballNews(),
        this.fetchCricketNews(),
        this.fetchF1News()
      ]);

      const footballNews = footballResult.status === 'fulfilled' ? footballResult.value : [];
      const cricketNews = cricketResult.status === 'fulfilled' ? cricketResult.value : [];
      const f1News = f1Result.status === 'fulfilled' ? f1Result.value : [];

      // Combine and sort by timestamp
      const allNews = [...footballNews, ...cricketNews, ...f1News].sort((a, b) => {
        return (b.timestamp || 0) - (a.timestamp || 0);
      });

      const result = {
        all: allNews,
        football: footballNews,
        cricket: cricketNews,
        f1: f1News
      };

      this._memoryCache = result;
      this._lastFetchTime = now;

      // Cache for instant popup startup
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [this.STORAGE_KEY]: allNews, scorequick_news_last_fetch: now });
      }

      return result;
    } catch (err) {
      console.error('Error in NewsService.fetchAllNews:', err);
      const cached = await this.getCachedNews();
      const result = {
        all: cached,
        football: cached.filter(n => n.sport === 'football'),
        cricket: cached.filter(n => n.sport === 'cricket'),
        f1: cached.filter(n => n.sport === 'f1')
      };
      this._memoryCache = result;
      return result;
    }
  }

  /**
   * Fast load cached news from local storage
   */
  static async getCachedNews() {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      return new Promise(resolve => {
        chrome.storage.local.get([this.STORAGE_KEY], res => {
          resolve(res?.[this.STORAGE_KEY] || []);
        });
      });
    }
    return [];
  }

  /**
   * 1. ⚽ Football World News
   */
  static async fetchFootballNews() {
    try {
      const res = await fetchWithTimeout('https://www.fotmob.com/api/worldnews', {}, 3000);
      if (!res.ok) return [];

      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.articles || data.news || []);

      return items.slice(0, 15).map(item => {
        const timeMs = item.gmtTime ? new Date(item.gmtTime).getTime() : Date.now();
        const articleUrl = item.page?.url 
          ? (item.page.url.startsWith('http') ? item.page.url : `https://www.fotmob.com${item.page.url}`)
          : 'https://www.fotmob.com';

        return {
          id: `fb_news_${item.id || Math.random()}`,
          sport: 'football',
          source: item.sourceStr || 'Football Hub',
          title: decodeHtmlEntities(item.title || 'Football News'),
          lead: decodeHtmlEntities(item.lead || ''),
          url: articleUrl,
          imageUrl: cleanImageUrl(item.imageUrl),
          timestamp: timeMs,
          timeDisplay: this.formatTimeAgo(timeMs)
        };
      });
    } catch (err) {
      console.warn('Football news fetch error:', err.message);
      return [];
    }
  }

  /**
   * 2. 🏏 Cricket News Aggregator (Powered by CREX)
   */
  static async fetchCricketNews() {
    try {
      const liveNews = await this.fetchLiveCricketNews();
      return liveNews;
    } catch (err) {
      console.warn('[ScoreQuick] Cricket news fetch error:', err.message);
      return [];
    }
  }

  /**
   * 2a. 🏏 Live Cricket News from CREX
   */
  static async fetchLiveCricketNews() {
    try {
      const res = await fetchWithTimeout('https://crex.com/news', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      }, 3500);
      if (!res.ok) return [];

      const html = await res.text();
      const m = html.match(/<script id="app-root-state" type="application\/json">([\s\S]*?)<\/script>/);
      if (!m || !m[1]) return [];

      const jsonStr = m[1].replace(/&q;/g, '"').replace(/&a;/g, '&');
      const state = JSON.parse(jsonStr);
      const homeData = state['https://crexweb.crickapi.com//api/home?content_lang=en'] || {};

      const rawArticles = [
        ...(homeData.topStories || []),
        ...(homeData.latest || []),
        ...(homeData.cricketNews || [])
      ];

      const seen = new Set();
      const articles = [];

      for (const item of rawArticles) {
        if (!item || !item.title || seen.has(item.id || item.title)) continue;
        seen.add(item.id || item.title);

        const timeMs = item.clsOn ? Number(item.clsOn) : Date.now();
        const articleUrl = item.newsUrl 
          ? (item.newsUrl.startsWith('http') ? item.newsUrl : `https://crex.com${item.newsUrl}`)
          : 'https://crex.com/news';

        const img = cleanImageUrl(item.img);

        articles.push({
          id: `cr_crex_${item.id || Math.random()}`,
          sport: 'cricket',
          source: 'CREX',
          title: decodeHtmlEntities(item.title),
          lead: decodeHtmlEntities(item.author ? `Reporting by ${item.author}` : (item.desc || item.subTitle || '')),
          url: articleUrl,
          imageUrl: img,
          timestamp: timeMs,
          timeDisplay: this.formatTimeAgo(timeMs)
        });

        if (articles.length >= 25) break;
      }

      return articles;
    } catch (err) {
      console.warn('[ScoreQuick] CREX news fetch error:', err.message);
      return [];
    }
  }

  /**
   * 3. 🏎️ Official Formula 1 News (Direct from formula1.com)
   */
  static async fetchF1News() {
    try {
      const res = await fetchWithTimeout('https://www.formula1.com/en/latest/all', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      }, 3500);
      if (!res.ok) return [];

      const html = await res.text();
      const cardRegex = /<li[^>]+id="article-item-([^"]+)"[\s\S]*?<\/li>/gi;
      let cardMatch;
      const articles = [];
      let count = 0;

      while ((cardMatch = cardRegex.exec(html)) !== null) {
        const cardHtml = cardMatch[0];
        const id = cardMatch[1];

        const linkMatch = cardHtml.match(/href="(\/en\/latest\/article\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        if (!linkMatch) continue;

        const relativeUrl = linkMatch[1];
        let title = linkMatch[2].replace(/<[^>]+>/g, '').trim();
        title = decodeHtmlEntities(title);

        // Extract HD Image
        const imgMatch = cardHtml.match(/<img[^>]+src=["']([^"']+)["']/i) || cardHtml.match(/srcset=["']([^"'\s,]+)/i);
        let img = imgMatch ? imgMatch[1] : '';
        if (img.startsWith('//')) img = 'https:' + img;
        img = cleanImageUrl(img);

        // Extract Tag / Category
        const tagMatch = cardHtml.match(/<span[^>]*class="[^"]*tag[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
          || cardHtml.match(/<p[^>]*class="[^"]*tag[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        const tag = tagMatch ? tagMatch[1].replace(/<[^>]+>/g, '').trim() : 'Formula 1';

        articles.push({
          id: `f1_f1official_${id}`,
          sport: 'f1',
          source: 'Formula 1',
          title: title,
          lead: '',
          url: `https://www.formula1.com${relativeUrl}`,
          imageUrl: img,
          tag: tag,
          timestamp: Date.now() - (count * 1800000),
          timeDisplay: this.formatTimeAgo(Date.now() - (count * 1800000))
        });
        count++;
        if (articles.length >= 25) break;
      }

      return articles;
    } catch (err) {
      console.warn('[ScoreQuick] Official Formula 1 news fetch error:', err);
      return [];
    }
  }

  /**
   * Filters news strictly by followed teams, drivers, or constructors
   */
  static filterFollowedNews(articles = [], favorites = {}) {
    const fbFavs = favorites.football || [];
    const crFavs = favorites.cricket || [];
    const f1Favs = favorites.f1 || [];
    const totalCount = fbFavs.length + crFavs.length + f1Favs.length;

    if (totalCount === 0) return [];

    // Extract all keywords to search against
    const keywords = [];

    // Football
    fbFavs.forEach(f => {
      if (f.name) keywords.push(f.name.toLowerCase());
      if (f.shortName && f.shortName.length >= 3) keywords.push(f.shortName.toLowerCase());
      if (f.id && typeof f.id === 'string' && f.id.length >= 3 && isNaN(f.id)) keywords.push(f.id.toLowerCase());
    });

    // Cricket
    crFavs.forEach(c => {
      if (c.name) {
        const nameLower = c.name.toLowerCase();
        keywords.push(nameLower);
        // Add common team aliases and franchise handles
        if (nameLower.includes('royal challengers') || nameLower.includes('bengaluru')) {
          keywords.push('rcb', 'bengaluru', 'bangalore', 'royal challengers');
        } else if (nameLower.includes('chennai') || nameLower.includes('super kings')) {
          keywords.push('csk', 'chennai', 'super kings');
        } else if (nameLower.includes('mumbai indians')) {
          keywords.push('mumbai', 'indians', 'mi');
        } else if (nameLower.includes('kolkata') || nameLower.includes('knight riders')) {
          keywords.push('kkr', 'kolkata', 'knight riders');
        } else if (nameLower.includes('delhi capitals')) {
          keywords.push('delhi', 'capitals', 'dc');
        } else if (nameLower.includes('rajasthan royals')) {
          keywords.push('rajasthan', 'royals', 'rr');
        } else if (nameLower.includes('gujarat titans')) {
          keywords.push('gujarat', 'titans', 'gt');
        } else if (nameLower.includes('sunrisers')) {
          keywords.push('srh', 'sunrisers', 'hyderabad');
        } else if (nameLower.includes('punjab kings')) {
          keywords.push('pbks', 'punjab kings', 'punjab');
        } else if (nameLower.includes('lucknow')) {
          keywords.push('lsg', 'lucknow', 'super giants');
        } else if (nameLower === 'south africa') {
          keywords.push('proteas', 'sa');
        } else if (nameLower === 'new zealand') {
          keywords.push('black caps', 'blackcaps', 'nz');
        } else if (nameLower === 'australia') {
          keywords.push('aussies', 'aus');
        } else if (nameLower === 'west indies') {
          keywords.push('windies', 'wi');
        } else if (nameLower === 'india') {
          keywords.push('team india', 'ind');
        }
      }
      if (c.shortName && c.shortName.length >= 2) keywords.push(c.shortName.toLowerCase());
      if (c.id && typeof c.id === 'string' && c.id.length >= 2 && isNaN(c.id)) keywords.push(c.id.toLowerCase());
    });

    // F1 Drivers & Constructors
    f1Favs.forEach(f => {
      if (f.name) keywords.push(f.name.toLowerCase());
      if (f.team) keywords.push(f.team.toLowerCase().replace(/\s*racing\s*/i, ''));
      if (f.code && f.code.length >= 3) keywords.push(f.code.toLowerCase());
    });

    return articles.filter(article => {
      const text = `${article.title || ''} ${article.lead || ''} ${(article.categories || []).join(' ')}`.toLowerCase();
      return keywords.some(keyword => {
        const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
        return regex.test(text);
      });
    });
  }

  /**
   * Helper: relative time formatter
   */
  static formatTimeAgo(timeMs) {
    if (!timeMs || isNaN(timeMs)) return 'Recently';
    const d = new Date(timeMs);
    const diff = Math.floor((Date.now() - timeMs) / 1000);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago (${timeStr})`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago (${timeStr})`;
    const days = Math.floor(diff / 86400);
    const dateStr = d.toLocaleDateString([], { day: 'numeric', month: 'short' });
    return days === 1 ? `Yesterday (${timeStr})` : `${dateStr} (${timeStr})`;
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function decodeHtmlEntities(str) {
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

export function cleanImageUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let url = rawUrl.trim();
  if (!url) return '';

  // Strip CDATA if present
  url = url.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();

  // Upgrade http to https
  if (url.startsWith('http://')) {
    url = url.replace(/^http:\/\//i, 'https://');
  }

  // Handle URL encoding for filenames with spaces, parentheses, etc. (especially Google Storage / CREX images)
  try {
    url = encodeURI(decodeURI(url));
  } catch (_) {
    url = encodeURI(url);
  }

  return url;
}

