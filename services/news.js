/**
 * ScoreQuick - Sports News Aggregator Service
 * Aggregates rich sports news across Football, Cricket, and Formula 1.
 */

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
      const res = await fetch('https://www.fotmob.com/api/worldnews');
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
   * 2. 🏏 Cricket News Aggregator
   */
  static async fetchCricketNews() {
    try {
      const [espnResult, liveResult] = await Promise.allSettled([
        this.fetchEspnCricketNews(),
        this.fetchLiveCricketNews()
      ]);

      const espnNews = espnResult.status === 'fulfilled' ? espnResult.value : [];
      const liveNews = liveResult.status === 'fulfilled' ? liveResult.value : [];

      // Deduplicate by normalized headline
      const seen = new Set();
      const combined = [];

      for (const item of [...espnNews, ...liveNews]) {
        if (!item || !item.title) continue;
        const norm = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 35);
        if (seen.has(norm)) continue;
        seen.add(norm);
        combined.push(item);
      }

      // Sort by newest first
      combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      return combined.slice(0, 30);
    } catch (err) {
      console.warn('Cricket news aggregator error:', err.message);
      return [];
    }
  }

  /**
   * 2a. 🏏 Official ESPNcricinfo News (RSS Feed with working HD Cover Images)
   */
  static async fetchEspnCricketNews() {
    try {
      const res = await fetch('https://www.espncricinfo.com/rss/content/story/feeds/0.xml');
      if (!res.ok) {
        return this.fetchEspnCricketNewsFallback();
      }

      const xml = await res.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      const articles = [];
      let match;
      let count = 0;

      while ((match = itemRegex.exec(xml)) !== null && count < 25) {
        const chunk = match[1];
        const rawTitle = (chunk.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '';
        const rawCover = (chunk.match(/<coverImages>([\s\S]*?)<\/coverImages>/i) || [])[1] || '';
        const rawMedia = (chunk.match(/<media:content[^>]+url=["']([^"']+)["']/i) || [])[1] || '';
        const rawEnclosure = (chunk.match(/<enclosure[^>]+url=["']([^"']+)["']/i) || [])[1] || '';
        const rawDesc = (chunk.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || '';
        const rawLink = (chunk.match(/<link>([\s\S]*?)<\/link>/i) || chunk.match(/<url>([\s\S]*?)<\/url>/i) || [])[1] || '';
        const rawGuid = (chunk.match(/<guid>([\s\S]*?)<\/guid>/i) || [])[1] || '';
        const rawPubDate = (chunk.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || '';

        const title = decodeHtmlEntities(rawTitle.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1'));
        const lead = decodeHtmlEntities(rawDesc.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]+>/g, ''));
        const link = (rawLink || rawGuid).replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
        const rawImg = (rawCover || rawMedia || rawEnclosure || '').replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
        const img = cleanImageUrl(rawImg);
        const timeMs = rawPubDate ? new Date(rawPubDate).getTime() : Date.now() - (count * 3600000);

        if (title) {
          articles.push({
            id: `cr_espn_news_${count}_${timeMs}`,
            sport: 'cricket',
            source: 'ESPNcricinfo',
            title: title,
            lead: lead,
            url: link || 'https://www.espncricinfo.com',
            imageUrl: img,
            timestamp: timeMs,
            timeDisplay: this.formatTimeAgo(timeMs)
          });
          count++;
        }
      }

      if (articles.length === 0) {
        return this.fetchEspnCricketNewsFallback();
      }

      return articles;
    } catch (err) {
      console.warn('ESPN Cricinfo RSS news fetch error, falling back:', err.message);
      return this.fetchEspnCricketNewsFallback();
    }
  }

  /**
   * 2a-fallback. ESPNcricinfo JSON API Fallback
   */
  static async fetchEspnCricketNewsFallback() {
    try {
      const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/cricket/8048/news');
      if (!res.ok) return [];

      const data = await res.json();
      const items = Array.isArray(data.articles) ? data.articles : [];

      return items.slice(0, 20).map(item => {
        const timeMs = item.published ? new Date(item.published).getTime() : Date.now();
        const articleUrl = item.links?.web?.href || 'https://www.espncricinfo.com';
        const img = cleanImageUrl(item.images?.[0]?.url);

        return {
          id: `cr_espn_fallback_${item.id || Math.random()}`,
          sport: 'cricket',
          source: 'ESPNcricinfo',
          title: decodeHtmlEntities(item.headline || 'Cricket News'),
          lead: decodeHtmlEntities(item.description || ''),
          url: articleUrl,
          imageUrl: img,
          timestamp: timeMs,
          timeDisplay: this.formatTimeAgo(timeMs)
        };
      });
    } catch (err) {
      console.warn('ESPN Cricinfo fallback error:', err.message);
      return [];
    }
  }

  /**
   * 2b. 🏏 Live Cricket News Scraper
   */
  static async fetchLiveCricketNews() {
    try {
      const res = await fetch('https://crex.live/news');
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

      // Deduplicate by ID
      const seen = new Set();
      const articles = [];

      for (const item of rawArticles) {
        if (!item || !item.title || seen.has(item.id || item.title)) continue;
        seen.add(item.id || item.title);

        const timeMs = item.clsOn ? Number(item.clsOn) : Date.now();
        const articleUrl = item.newsUrl 
          ? (item.newsUrl.startsWith('http') ? item.newsUrl : `https://crex.live${item.newsUrl}`)
          : 'https://crex.live/news';

        const img = cleanImageUrl(item.img);

        articles.push({
          id: `cr_news_${item.id || Math.random()}`,
          sport: 'cricket',
          source: 'CREX',
          title: decodeHtmlEntities(item.title),
          lead: decodeHtmlEntities(item.author ? `Reporting by ${item.author}` : (item.desc || '')),
          url: articleUrl,
          imageUrl: img,
          timestamp: timeMs,
          timeDisplay: this.formatTimeAgo(timeMs)
        });

        if (articles.length >= 20) break;
      }

      return articles;
    } catch (err) {
      console.warn('CREX news fetch error:', err.message);
      return [];
    }
  }

  /**
   * 3. 🏎️ Official ESPN Formula 1 News (Rich HD Images)
   */
  static async fetchF1News() {
    try {
      const urls = [
        'https://site.api.espn.com/apis/site/v2/sports/racing/f1/news?limit=50',
        'https://site.web.api.espn.com/apis/site/v2/sports/racing/f1/news?limit=50'
      ];

      let data = null;
      for (const url of urls) {
        try {
          const res = await fetch(url, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
          });
          if (res.ok) {
            data = await res.json();
            if (data?.articles && Array.isArray(data.articles) && data.articles.length > 0) {
              break;
            }
          }
        } catch (_) {
          // Fallback to next endpoint
        }
      }

      if (!data?.articles || !Array.isArray(data.articles)) {
        return [];
      }

      const rawArticles = [];
      for (const item of data.articles) {
        if (!item || !item.headline) continue;

        const timeMs = item.published ? new Date(item.published).getTime() : Date.now();
        const rawImg = item.images?.[0]?.url || item.images?.find(i => i.url)?.url || '';
        const img = cleanImageUrl(rawImg);
        const articleUrl = item.links?.web?.href || item.links?.mobile?.href || 'https://www.espn.com/f1';
        const categories = (item.categories || []).map(c => c.description).filter(Boolean);

        rawArticles.push({
          id: `f1_espn_${item.id || Math.random()}`,
          sport: 'f1',
          source: 'ESPN F1',
          title: decodeHtmlEntities(item.headline),
          lead: decodeHtmlEntities(item.description || ''),
          url: articleUrl,
          imageUrl: img,
          timestamp: timeMs,
          timeDisplay: this.formatTimeAgo(timeMs),
          categories: categories
        });
      }

      // Deduplicate by normalized title
      const seen = new Set();
      const unique = [];

      for (const item of rawArticles) {
        if (!item || !item.title) continue;
        const norm = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 35);
        if (seen.has(norm)) continue;
        seen.add(norm);
        unique.push(item);
      }

      // Sort newest first
      unique.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      return unique.slice(0, 35);
    } catch (err) {
      console.warn('ESPN F1 News fetch error:', err);
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

