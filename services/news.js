/**
 * ScoreQuick - Sports News Aggregator Service (v1.4)
 * Aggregates rich sports news directly from:
 * 1. ⚽ FotMob (World News API)
 * 2. 🏏 CREX (crex.live News & Top Stories)
 * 3. 🏎️ Official Formula 1 (F1 RSS & ESPN F1)
 */

export class NewsService {
  static STORAGE_KEY = 'scorequick_cached_news';

  /**
   * Fetch all news across Football, Cricket, and F1
   */
  static async fetchAllNews() {
    try {
      const [fotmobResult, cricketResult, f1Result] = await Promise.allSettled([
        this.fetchFotMobNews(),
        this.fetchCricketNews(),
        this.fetchF1News()
      ]);

      const footballNews = fotmobResult.status === 'fulfilled' ? fotmobResult.value : [];
      const cricketNews = cricketResult.status === 'fulfilled' ? cricketResult.value : [];
      const f1News = f1Result.status === 'fulfilled' ? f1Result.value : [];

      // Combine and sort by timestamp
      const allNews = [...footballNews, ...cricketNews, ...f1News].sort((a, b) => {
        return (b.timestamp || 0) - (a.timestamp || 0);
      });

      // Cache for instant popup startup
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({ [this.STORAGE_KEY]: allNews });
      }

      return {
        all: allNews,
        football: footballNews,
        cricket: cricketNews,
        f1: f1News
      };
    } catch (err) {
      console.error('Error in NewsService.fetchAllNews:', err);
      const cached = await this.getCachedNews();
      return {
        all: cached,
        football: cached.filter(n => n.sport === 'football'),
        cricket: cached.filter(n => n.sport === 'cricket'),
        f1: cached.filter(n => n.sport === 'f1')
      };
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
   * 1. ⚽ FotMob World News
   */
  static async fetchFotMobNews() {
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
          source: item.sourceStr || 'FotMob',
          title: item.title || 'Football News',
          lead: item.lead || '',
          url: articleUrl,
          imageUrl: item.imageUrl || '',
          timestamp: timeMs,
          timeDisplay: this.formatTimeAgo(timeMs)
        };
      });
    } catch (err) {
      console.warn('FotMob news fetch error:', err.message);
      return [];
    }
  }

  /**
   * 2. 🏏 ESPNcricinfo & CREX Cricket News Aggregator
   */
  static async fetchCricketNews() {
    try {
      const [espnResult, crexResult] = await Promise.allSettled([
        this.fetchEspnCricketNews(),
        this.fetchCrexNews()
      ]);

      const espnNews = espnResult.status === 'fulfilled' ? espnResult.value : [];
      const crexNews = crexResult.status === 'fulfilled' ? crexResult.value : [];

      // Deduplicate by normalized headline
      const seen = new Set();
      const combined = [];

      for (const item of [...espnNews, ...crexNews]) {
        if (!item || !item.title) continue;
        const norm = item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 35);
        if (seen.has(norm)) continue;
        seen.add(norm);
        combined.push(item);
      }

      // Sort by newest first
      combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      return combined.slice(0, 25);
    } catch (err) {
      console.warn('Cricket news aggregator error:', err.message);
      return [];
    }
  }

  /**
   * 2a. 🏏 Official ESPNcricinfo News JSON API (High Reliability & Images)
   */
  static async fetchEspnCricketNews() {
    try {
      const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/cricket/8048/news');
      if (!res.ok) return [];

      const data = await res.json();
      const items = Array.isArray(data.articles) ? data.articles : [];

      return items.slice(0, 25).map(item => {
        const timeMs = item.published ? new Date(item.published).getTime() : Date.now();
        const articleUrl = item.links?.web?.href || 'https://www.espncricinfo.com';
        const img = item.images?.[0]?.url || '';

        return {
          id: `cr_espn_news_${item.id || Math.random()}`,
          sport: 'cricket',
          source: 'ESPNcricinfo',
          title: item.headline || 'Cricket News',
          lead: item.description || '',
          url: articleUrl,
          imageUrl: img,
          timestamp: timeMs,
          timeDisplay: this.formatTimeAgo(timeMs)
        };
      });
    } catch (err) {
      console.warn('ESPN Cricinfo news fetch error:', err.message);
      return [];
    }
  }

  /**
   * 2b. 🏏 CREX Cricket News (HTML SSR Scraper)
   */
  static async fetchCrexNews() {
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

        articles.push({
          id: `cr_news_${item.id || Math.random()}`,
          sport: 'cricket',
          source: 'CREX',
          title: item.title,
          lead: item.author ? `Reporting by ${item.author}` : (item.desc || ''),
          url: articleUrl,
          imageUrl: item.img || '',
          timestamp: timeMs,
          timeDisplay: this.formatTimeAgo(timeMs)
        });

        if (articles.length >= 15) break;
      }

      return articles;
    } catch (err) {
      console.warn('CREX news fetch error:', err.message);
      return [];
    }
  }

  /**
   * 3. 🏎️ Official Formula 1 News
   */
  static async fetchF1News() {
    const articles = [];

    // A. Official F1 RSS
    try {
      const res = await fetch('https://www.formula1.com/content/fom-website/en/latest/all.xml');
      if (res.ok) {
        const xml = await res.text();
        const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
        let match;
        let count = 0;

        while ((match = itemRegex.exec(xml)) !== null && count < 10) {
          const chunk = match[1];
          const rawTitle = (chunk.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '';
          const rawLink = (chunk.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || '';
          const rawDesc = (chunk.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || '';
          const rawPubDate = (chunk.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || '';

          const title = rawTitle.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
          const link = rawLink.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
          const lead = rawDesc.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();
          const timeMs = rawPubDate ? new Date(rawPubDate).getTime() : Date.now() - (count * 3600000);

          if (title && link) {
            articles.push({
              id: `f1_news_${count}`,
              sport: 'f1',
              source: 'Formula 1',
              title: title,
              lead: lead,
              url: link,
              imageUrl: 'https://www.formula1.com/etc/designs/fom-website/icon192x192.png',
              timestamp: timeMs,
              timeDisplay: this.formatTimeAgo(timeMs)
            });
            count++;
          }
        }
      }
    } catch (e) {
      console.warn('F1 RSS error:', e.message);
    }

    // B. Enrich with ESPN F1 images if available
    try {
      const espnRes = await fetch('https://site.api.espn.com/apis/site/v2/sports/racing/f1/news');
      if (espnRes.ok) {
        const espnData = await espnRes.json();
        for (const item of (espnData.articles || []).slice(0, 8)) {
          const timeMs = item.published ? new Date(item.published).getTime() : Date.now();
          articles.push({
            id: `f1_news_espn_${item.id || Math.random()}`,
            sport: 'f1',
            source: 'Formula 1',
            title: item.headline || 'Formula 1 Update',
            lead: item.description || '',
            url: item.links?.web?.href || 'https://www.formula1.com',
            imageUrl: item.images?.[0]?.url || 'https://www.formula1.com/etc/designs/fom-website/icon192x192.png',
            timestamp: timeMs,
            timeDisplay: this.formatTimeAgo(timeMs)
          });
        }
      }
    } catch (_) {}

    return articles;
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
      const text = `${article.title || ''} ${article.lead || ''}`.toLowerCase();
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
