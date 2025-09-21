(() => {
  const FEEDS_ZARATE = [
    'https://zarate.gob.ar/portal-de-noticias/feed/',
    'https://news.google.com/rss/search?q=Z%C3%A1rate+Argentina&hl=es-419&gl=AR&ceid=AR:es-419',
    'https://news.google.com/rss/search?q=Z%C3%A1rate+Buenos+Aires&hl=es-419&gl=AR&ceid=AR:es-419'
  ];

  const FEEDS_GENERAL = [
    'https://news.google.com/rss?hl=es-419&gl=AR&ceid=AR:es-419',
    'https://news.google.com/rss/headlines/section/topic/NATION?hl=es-419&gl=AR&ceid=AR:es-419'
  ];

  const RSS_FEEDS = {
    zarate: FEEDS_ZARATE,
    general: FEEDS_GENERAL,
    actualidad: FEEDS_ZARATE,
    deportes: [
      'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=es-419&gl=AR&ceid=AR:es-419'
    ],
    espectaculos: [
      'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=es-419&gl=AR&ceid=AR:es-419'
    ]
  };

  const MAX_NEWS = 20;
  const CACHE_TTL_MS = 10 * 60 * 1000;
  const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

  class NewsCache {
    constructor() {
      this.storageKey = 'iplay_news_cache';
      this.storageAvailable = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    }

    save(category, data) {
      if (!this.storageAvailable) return;
      try {
        const payload = {
          data,
          timestamp: Date.now()
        };
        window.localStorage.setItem(`${this.storageKey}_${category}`, JSON.stringify(payload));
      } catch (error) {
        console.warn('Noticias: no se pudo guardar en cache', error);
      }
    }

    get(category) {
      if (!this.storageAvailable) return null;
      try {
        const cached = window.localStorage.getItem(`${this.storageKey}_${category}`);
        if (!cached) return null;

        const parsed = JSON.parse(cached);
        const isExpired = (Date.now() - parsed.timestamp) > CACHE_TTL_MS;
        if (isExpired) {
          this.clear(category);
          return null;
        }

        return parsed.data;
      } catch (error) {
        console.warn('Noticias: no se pudo leer cache', error);
        this.clear(category);
        return null;
      }
    }

    clear(category) {
      if (!this.storageAvailable) return;
      try {
        window.localStorage.removeItem(`${this.storageKey}_${category}`);
      } catch (error) {
        console.warn('Noticias: no se pudo limpiar cache', error);
      }
    }

    clearAll() {
      if (!this.storageAvailable) return;
      try {
        Object.keys(window.localStorage)
          .filter((key) => key.startsWith(this.storageKey))
          .forEach((key) => window.localStorage.removeItem(key));
      } catch (error) {
        console.warn('Noticias: no se pudo limpiar todo el cache', error);
      }
    }
  }

  class NewsFetcher {
    constructor() {
      this.cache = new NewsCache();
    }

    async fetchRSSAsJSON(rssUrl) {
      try {
        const apiUrl = RSS2JSON_API + encodeURIComponent(rssUrl);
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data.status !== 'ok') {
          throw new Error(data.message || 'RSS2JSON error');
        }

        return data;
      } catch (error) {
        console.warn(`Noticias: error al obtener RSS ${rssUrl}`, error);
        throw error;
      }
    }

    normalizeNewsItem(item, source = 'Google News') {
      const link = item.link || item.guid || '';
      return {
        title: item.title || '',
        link,
        description: item.description || item.content || '',
        pubDate: item.pubDate || item.published || '',
        source: item.source || source,
        image: this.extractImage(item),
        category: this.detectCategory(item.title, item.description, link, source)
      };
    }

    extractImage(item) {
      if (item.thumbnail) return item.thumbnail;
      if (item.enclosure && item.enclosure.type && String(item.enclosure.type).startsWith('image/')) {
        return item.enclosure.link;
      }
      const html = item.description || item.content || '';
      const match = html.match(/<img[^>]+src="([^"]+)"/i);
      return match ? match[1] : null;
    }

    detectCategory(title, description, link = '', source = '') {
      const text = `${title || ''} ${description || ''}`.toLowerCase();
      const normalizedLink = (link || '').toLowerCase();
      const normalizedSource = (source || '').toLowerCase();

      const isZarateSource =
        normalizedLink.includes('zarate.gob.ar') ||
        normalizedSource.includes('zarate');

      if (isZarateSource || text.includes('zarate') || text.includes('zárate')) {
        return 'zarate';
      }
      if (text.includes('deporte') || text.includes('futbol') || text.includes('fútbol')) {
        return 'deportes';
      }
      if (text.includes('espectáculo') || text.includes('música') || text.includes('cine')) {
        return 'espectaculos';
      }
      return 'general';
    }

    filterActualidad(newsList) {
      const keywords = ['zarate', 'zárate'];
      const filtered = newsList.filter((item) => {
        const text = `${item.title} ${item.description || ''}`.toLowerCase();
        const host = getHostname(item.link).toLowerCase();
        const source = (item.source || '').toLowerCase();
        return host.includes('zarate.gob.ar') ||
          source.includes('zarate') ||
          keywords.some((keyword) => text.includes(keyword));
      });
      return filtered;
    }

    dedupeByLink(items) {
      const seen = new Set();
      return items.filter((item) => {
        const key = item.link || item.title;
        if (!key) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    async fetchCategoryNews(category) {
      const feeds = RSS_FEEDS[category];
      if (!feeds || !feeds.length) {
        throw new Error(`Sin feeds configurados para ${category}`);
      }

      let collected = [];
      let successCount = 0;

      for (const feedUrl of feeds) {
        try {
          const rssData = await this.fetchRSSAsJSON(feedUrl);
          const newsItems = Array.isArray(rssData.items) ? rssData.items : [];
          const normalizedNews = newsItems.map((item) =>
            this.normalizeNewsItem(item, rssData.feed?.title || 'Google News')
          );
          collected = collected.concat(normalizedNews);
          successCount += 1;

          if (collected.length >= MAX_NEWS * 2) {
            break;
          }
        } catch (error) {
          // Mantener el loop aunque falle un feed
        }
      }

      if (successCount === 0) {
        throw new Error(`Todos los feeds fallaron para ${category}`);
      }

      let sortedNews = this.dedupeByLink(
        collected.filter((news) => news.title && news.link)
      ).sort((a, b) => {
        const dateA = new Date(a.pubDate);
        const dateB = new Date(b.pubDate);
        return dateB - dateA;
      });

      if (category === 'actualidad') {
        const actualidadNews = this.filterActualidad(sortedNews);
        if (actualidadNews.length > 0) {
          sortedNews = actualidadNews;
        } else {
          sortedNews = this.getEmergencyNews('actualidad');
        }
      }

      return sortedNews.slice(0, MAX_NEWS);
    }

    async getNews(category) {
      const cached = this.cache.get(category);
      if (cached) {
        console.log(`Noticias: usando cache para ${category}`);
        return cached;
      }

      try {
        const fresh = await this.fetchCategoryNews(category);
        this.cache.save(category, fresh);
        return fresh;
      } catch (error) {
        console.warn(`Noticias: error en ${category}`, error);
        const fallback = this.cache.get(category);
        if (fallback) {
          console.log(`Noticias: usando cache expirado para ${category}`);
          return fallback;
        }
        return this.getEmergencyNews(category);
      }
    }

    getEmergencyNews(category) {
      const nowIso = new Date().toISOString();
      const emergencyNews = {
        zarate: [
          {
            title: 'Información local de Zárate',
            link: '#',
            description: 'Las noticias locales se cargarán pronto. Mantente informado con IPlay Radio.',
            pubDate: nowIso,
            source: 'IPlay Radio',
            image: null,
            category: 'zarate'
          }
        ],
        actualidad: [
          {
            title: 'Actualidad de Zárate',
            link: '#',
            description: 'Las noticias de Zárate se cargarán pronto. Escuchá IPlay Radio para mantenerte al día.',
            pubDate: nowIso,
            source: 'IPlay Radio',
            image: null,
            category: 'actualidad'
          }
        ],
        general: [
          {
            title: 'Noticias de Argentina',
            link: '#',
            description: 'Las últimas noticias se cargarán pronto. Escuchá IPlay Radio para estar informado.',
            pubDate: nowIso,
            source: 'IPlay Radio',
            image: null,
            category: 'general'
          }
        ],
        deportes: [
          {
            title: 'Deportes en Argentina',
            link: '#',
            description: 'Las noticias deportivas se cargarán pronto. Sintonizá IPlay Radio.',
            pubDate: nowIso,
            source: 'IPlay Radio',
            image: null,
            category: 'deportes'
          }
        ],
        espectaculos: [
          {
            title: 'Espectáculos y Entretenimiento',
            link: '#',
            description: 'Las noticias de espectáculos se cargarán pronto. Disfrutá la música en IPlay Radio.',
            pubDate: nowIso,
            source: 'IPlay Radio',
            image: null,
            category: 'espectaculos'
          }
        ]
      };

      return emergencyNews[category] || emergencyNews.general;
    }
  }

  const newsFetcher = new NewsFetcher();

  function timeAgo(dateInput) {
    if (!dateInput) return '';
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'ahora';
    if (diffMins < 60) return `hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  function getHostname(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (error) {
      return '';
    }
  }

  function stripHTML(html) {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return (temp.textContent || temp.innerText || '').trim();
  }

  function buildExcerpt(item) {
    const raw = stripHTML(item.description || '');
    const normalized = raw.replace(/\s+/g, ' ').trim();
    if (normalized) {
      return normalized.length > 180 ? `${normalized.slice(0, 177)}…` : normalized;
    }
    const source = item.source || getHostname(item.link) || 'la fuente original';
    return `Leé la nota completa en ${source}.`;
  }

  function createNewsCard(item) {
    const card = document.createElement('a');
    card.className = 'news-card';
    card.href = item.link || '#';
    card.target = '_blank';
    card.rel = 'noopener noreferrer';

    const title = document.createElement('div');
    title.className = 'news-card-title';
    title.textContent = item.title || 'Noticia sin título';

    const content = document.createElement('div');
    content.className = 'news-card-content';

    const excerpt = document.createElement('p');
    excerpt.textContent = buildExcerpt(item);
    content.appendChild(excerpt);

    const meta = document.createElement('div');
    meta.className = 'news-card-meta';

    const source = document.createElement('span');
    source.className = 'news-card-source';
    source.textContent = item.source || getHostname(item.link) || 'Fuente';

    const time = document.createElement('span');
    time.className = 'news-card-time';
    time.textContent = timeAgo(item.pubDate);

    meta.appendChild(source);
    if (time.textContent) {
      meta.appendChild(time);
    }

    card.appendChild(title);
    card.appendChild(content);
    card.appendChild(meta);

    return card;
  }

  function showMessage(grid, message) {
    grid.innerHTML = `<div class="news-loading">${message}</div>`;
  }

  function renderNews(grid, items) {
    if (!items || items.length === 0) {
      showMessage(grid, 'No hay noticias disponibles ahora.');
      return;
    }
    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
      fragment.appendChild(createNewsCard(item));
    });
    grid.appendChild(fragment);
  }

  function setLoading(grid) {
    showMessage(grid, 'Cargando noticias...');
  }

  function updateActiveTab(activeTab, tabs) {
    tabs.forEach((tab) => {
      const isActive = tab === activeTab;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('news-grid');
    const tabButtons = Array.from(document.querySelectorAll('.news-tab'));
    if (!grid || tabButtons.length === 0) return;

    let isLoading = false;
    const initialTab = tabButtons.find((tab) => tab.classList.contains('is-active'));
    let currentCategory = initialTab?.dataset.category || tabButtons[0].dataset.category || 'actualidad';

    async function loadCategory(category) {
      if (!category || isLoading) return;
      isLoading = true;
      setLoading(grid);
      try {
        const news = await newsFetcher.getNews(category);
        renderNews(grid, news);
      } catch (error) {
        console.error('Noticias: error al renderizar', error);
        showMessage(grid, 'Error al cargar noticias.');
      } finally {
        isLoading = false;
      }
    }

    tabButtons.forEach((tab) => {
      tab.addEventListener('click', () => {
        const category = tab.dataset.category;
        if (!category || category === currentCategory) return;
        currentCategory = category;
        updateActiveTab(tab, tabButtons);
        loadCategory(category);
      });
      tab.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        tab.click();
      });
    });

    updateActiveTab(
      tabButtons.find((tab) => tab.dataset.category === currentCategory) || tabButtons[0],
      tabButtons
    );
    loadCategory(currentCategory);
  });
})();
