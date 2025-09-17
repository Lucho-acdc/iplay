/**
 * Sistema de Noticias RSS → JSON para IPlay Radio
 * 
 * Características:
 * - Feeds RSS convertidos a JSON vía rss2json
 * - Cache local con TTL de 10 minutos
 * - Fallback si una fuente falla
 * - Lazy loading de imágenes
 * - Prioriza noticias de Zárate
 */

// =============== CONFIGURACIÓN ===============
// Editar estas constantes para cambiar fuentes y comportamiento
const FEEDS_ZARATE = [
    'https://news.google.com/rss/search?q=Zárate+Argentina&hl=es-419&gl=AR&ceid=AR:es-419',
    'https://news.google.com/rss/search?q=Z%C3%A1rate+Buenos+Aires&hl=es-419&gl=AR&ceid=AR:es-419'
];

const FEEDS_GENERAL = [
    'https://news.google.com/rss?hl=es-419&gl=AR&ceid=AR:es-419',
    'https://news.google.com/rss/headlines/section/topic/NATION?hl=es-419&gl=AR&ceid=AR:es-419'
];

const RSS_FEEDS = {
    // Noticias específicas de Zárate (prioridad alta)
    zarate: FEEDS_ZARATE,
    // Noticias generales de Argentina (alias para compatibilidad)
    general: FEEDS_GENERAL,
    // Mezcla para la pestaña "Actualidad": priorizar Zárate sin perder contexto nacional
    actualidad: [...FEEDS_ZARATE, ...FEEDS_GENERAL],
    // Deportes
    deportes: [
        'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=es-419&gl=AR&ceid=AR:es-419'
    ],
    // Espectáculos
    espectaculos: [
        'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=es-419&gl=AR&ceid=AR:es-419'
    ]
};

const MAX_NEWS = 20; // Máximo de noticias a mostrar
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos en milisegundos
const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

// =============== CACHE LOCAL ===============
class NewsCache {
    constructor() {
        this.storageKey = 'iplay_news_cache';
    }

    /**
     * Guarda noticias en localStorage con timestamp
     */
    save(category, data) {
        try {
            const cacheData = {
                data: data,
                timestamp: Date.now(),
                category: category
            };
            localStorage.setItem(`${this.storageKey}_${category}`, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Error al guardar en cache:', error);
        }
    }

    /**
     * Recupera noticias del cache si no han expirado
     */
    get(category) {
        try {
            const cached = localStorage.getItem(`${this.storageKey}_${category}`);
            if (!cached) return null;

            const cacheData = JSON.parse(cached);
            const isExpired = (Date.now() - cacheData.timestamp) > CACHE_TTL_MS;
            
            if (isExpired) {
                this.clear(category);
                return null;
            }

            return cacheData.data;
        } catch (error) {
            console.warn('Error al leer cache:', error);
            this.clear(category);
            return null;
        }
    }

    /**
     * Limpia el cache de una categoría específica
     */
    clear(category) {
        try {
            localStorage.removeItem(`${this.storageKey}_${category}`);
        } catch (error) {
            console.warn('Error al limpiar cache:', error);
        }
    }

    /**
     * Limpia todo el cache de noticias
     */
    clearAll() {
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.storageKey)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('Error al limpiar todo el cache:', error);
        }
    }
}

// =============== UTILIDADES ===============
/**
 * Convierte fecha a formato relativo ("hace X min/horas")
 */
function timeAgo(date) {
    if (!date) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'ahora';
    if (diffMins < 60) return `hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `hace ${diffHours} h`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'short' 
    });
}

/**
 * Extrae el hostname de una URL
 */
function getHostname(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch {
        return 'Fuente';
    }
}

/**
 * Trunca texto a una longitud específica
 */
function truncateText(text, maxLength = 150) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

/**
 * Elimina etiquetas HTML preservando solo el texto
 */
function stripHTML(html) {
    if (!html) return '';

    if (typeof window !== 'undefined' && window.DOMParser) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const text = doc.body.textContent || '';
        return text.replace(/\s+/g, ' ').trim();
    }

    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// =============== FETCH DE NOTICIAS ===============
class NewsFetcher {
    constructor() {
        this.cache = new NewsCache();
    }

    /**
     * Convierte RSS a JSON usando rss2json
     */
    async fetchRSSAsJSON(rssUrl) {
        try {
            const apiUrl = RSS2JSON_API + encodeURIComponent(rssUrl);
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.status !== 'ok') {
                throw new Error(`RSS2JSON Error: ${data.message || 'Unknown error'}`);
            }

            return data;
        } catch (error) {
            console.warn(`Error al obtener RSS de ${rssUrl}:`, error);
            throw error;
        }
    }

    /**
     * Normaliza un item de noticia de diferentes fuentes RSS
     */
    normalizeNewsItem(item, source = 'Google News') {
        return {
            title: item.title || '',
            link: item.link || '',
            description: item.description || item.content || '',
            pubDate: item.pubDate || item.published || '',
            source: item.source || source,
            image: this.extractImage(item),
            category: this.detectCategory(item.title, item.description)
        };
    }

    /**
     * Extrae imagen de un item de noticia
     */
    extractImage(item) {
        // Buscar imagen en diferentes campos
        if (item.thumbnail) return item.thumbnail;
        if (item.enclosure && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
            return item.enclosure.link;
        }
        
        // Extraer de description/content HTML
        const html = item.description || item.content || '';
        const imgMatch = html.match(/<img[^>]+src="([^"]+)"/i);
        if (imgMatch) return imgMatch[1];
        
        return null;
    }

    /**
     * Detecta categoría basada en título y descripción
     */
    detectCategory(title, description) {
        const text = (title + ' ' + description).toLowerCase();
        
        if (text.includes('zarate') || text.includes('zárate')) return 'zarate';
        if (text.includes('deporte') || text.includes('fútbol') || text.includes('futbol')) return 'deportes';
        if (text.includes('espectáculo') || text.includes('música') || text.includes('cine')) return 'espectaculos';
        
        return 'general';
    }

    /**
     * Obtiene noticias de una categoría específica
     */
    async fetchCategoryNews(category) {
        const feeds = RSS_FEEDS[category];
        if (!feeds || !feeds.length) {
            throw new Error(`No hay feeds configurados para la categoría: ${category}`);
        }

        let allNews = [];
        let successCount = 0;

        // Intentar cada feed de la categoría
        for (const feedUrl of feeds) {
            try {
                const rssData = await this.fetchRSSAsJSON(feedUrl);
                const newsItems = rssData.items || [];
                
                const normalizedNews = newsItems.map(item => 
                    this.normalizeNewsItem(item, rssData.feed?.title || 'Google News')
                );
                
                allNews = allNews.concat(normalizedNews);
                successCount++;
                
                // Si ya tenemos suficientes noticias, no necesitamos más feeds
                if (allNews.length >= MAX_NEWS * 2) break;
                
            } catch (error) {
                console.warn(`Feed falló para ${category}: ${feedUrl}`, error);
                // Continuar con el siguiente feed
            }
        }

        if (successCount === 0) {
            throw new Error(`Todos los feeds fallaron para la categoría: ${category}`);
        }

        // Ordenar por fecha (más recientes primero) y limitar
        const sortedNews = allNews
            .filter(news => news.title && news.link)
            .sort((a, b) => {
                const dateA = new Date(a.pubDate);
                const dateB = new Date(b.pubDate);
                return dateB - dateA;
            })
            .slice(0, MAX_NEWS);

        return sortedNews;
    }

    /**
     * Obtiene noticias con cache y fallback
     */
    async getNews(category) {
        // 1. Intentar obtener del cache primero
        const cachedNews = this.cache.get(category);
        if (cachedNews) {
            console.log(`Noticias de ${category} obtenidas del cache`);
            return cachedNews;
        }

        // 2. Intentar obtener noticias frescas
        try {
            const freshNews = await this.fetchCategoryNews(category);
            
            // Guardar en cache
            this.cache.save(category, freshNews);
            
            console.log(`Noticias de ${category} obtenidas frescas: ${freshNews.length} items`);
            return freshNews;
            
        } catch (error) {
            console.warn(`Error al obtener noticias frescas de ${category}:`, error);
            
            // 3. Fallback: usar cache expirado si existe
            const expiredCache = this.cache.get(category);
            if (expiredCache) {
                console.log(`Usando cache expirado para ${category}`);
                return expiredCache;
            }
            
            // 4. Último recurso: noticias de emergencia
            return this.getEmergencyNews(category);
        }
    }

    /**
     * Noticias de emergencia cuando todo falla
     */
    getEmergencyNews(category) {
        const emergencyNews = {
            zarate: [
                {
                    title: "Información local de Zárate",
                    link: "#",
                    description: "Las noticias locales se cargarán pronto. Mantente informado con IPlay Radio.",
                    pubDate: new Date().toISOString(),
                    source: "IPlay Radio",
                    image: null,
                    category: "zarate"
                }
            ],
            actualidad: [
                {
                    title: "Noticias de Actualidad",
                    link: "#",
                    description: "Las últimas noticias se cargarán pronto. Escucha IPlay Radio para estar informado.",
                    pubDate: new Date().toISOString(),
                    source: "IPlay Radio",
                    image: null,
                    category: "actualidad"
                }
            ],
            general: [
                {
                    title: "Noticias de Argentina",
                    link: "#",
                    description: "Las últimas noticias se cargarán pronto. Escucha IPlay Radio para estar informado.",
                    pubDate: new Date().toISOString(),
                    source: "IPlay Radio",
                    image: null,
                    category: "general"
                }
            ],
            deportes: [
                {
                    title: "Deportes en Argentina",
                    link: "#",
                    description: "Las noticias deportivas se cargarán pronto. Sintoniza IPlay Radio.",
                    pubDate: new Date().toISOString(),
                    source: "IPlay Radio",
                    image: null,
                    category: "deportes"
                }
            ],
            espectaculos: [
                {
                    title: "Espectáculos y Entretenimiento",
                    link: "#",
                    description: "Las noticias de espectáculos se cargarán pronto. Disfruta la música en IPlay Radio.",
                    pubDate: new Date().toISOString(),
                    source: "IPlay Radio",
                    image: null,
                    category: "espectaculos"
                }
            ]
        };

        return emergencyNews[category] || emergencyNews.general;
    }
}

// =============== RENDERIZADO ===============
class NewsRenderer {
    constructor() {
        this.fetcher = new NewsFetcher();
    }

    /**
     * Renderiza noticias en el contenedor
     */
    async renderNews(category, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Contenedor ${containerId} no encontrado`);
            return;
        }

        // Mostrar loading
        container.innerHTML = '<div class="news-loading">Cargando noticias…</div>';

        try {
            const news = await this.fetcher.getNews(category);
            this.renderNewsList(news, container);
        } catch (error) {
            console.error('Error al renderizar noticias:', error);
            container.innerHTML = '<div class="news-loading">Error al cargar noticias. Intenta recargar la página.</div>';
        }
    }

    /**
     * Renderiza la lista de noticias
     */
    renderNewsList(news, container) {
        if (!news || news.length === 0) {
            container.innerHTML = '<div class="news-loading">No hay noticias disponibles en este momento.</div>';
            return;
        }

        const fragment = document.createDocumentFragment();
        
        news.forEach((item, index) => {
            const newsCard = this.createNewsCard(item, index);
            fragment.appendChild(newsCard);
        });

        container.innerHTML = '';
        container.appendChild(fragment);
    }

    /**
     * Crea una tarjeta de noticia individual
     */
    createNewsCard(item, index) {
        const card = document.createElement('a');
        card.className = 'news-card';
        card.href = item.link;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.setAttribute('data-index', index);

        const date = item.pubDate ? new Date(item.pubDate) : null;
        const timeAgoText = timeAgo(date);
        const hostname = getHostname(item.link);
        const rawDescription = stripHTML(item.description).trim();
        const description = truncateText(rawDescription, 120);

        card.innerHTML = `
            ${item.image ? `
                <div class="news-image-container">
                    <img class="news-image" 
                         src="${item.image}" 
                         alt="${item.title}"
                         loading="lazy"
                         onerror="this.style.display='none'">
                </div>
            ` : ''}
            <div class="news-content">
                <div class="news-title">${item.title}</div>
                ${description ? `<div class="news-description">${description}</div>` : ''}
                <div class="news-meta">
                    <span class="news-source">${item.source || hostname}</span>
                    <span class="news-time">${timeAgoText}</span>
                </div>
            </div>
        `;

        return card;
    }

    /**
     * Pre-carga noticias de otras categorías para mejor UX
     */
    async preloadOtherCategories(currentCategory) {
        const categories = Object.keys(RSS_FEEDS);
        const otherCategories = categories.filter(cat => cat !== currentCategory);
        
        // Pre-cargar en background (no bloquear UI)
        otherCategories.forEach(async (category) => {
            try {
                await this.fetcher.getNews(category);
                console.log(`Pre-cargadas noticias de ${category}`);
            } catch (error) {
                console.warn(`Error pre-cargando ${category}:`, error);
            }
        });
    }
}

// =============== INICIALIZACIÓN ===============
class NewsManager {
    constructor() {
        this.renderer = new NewsRenderer();
        this.currentCategory = 'actualidad'; // Mostrar pestaña de actualidad por defecto
        this.init();
    }

    init() {
        // Esperar a que el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        const newsFilter = document.getElementById('news-filter');
        if (!newsFilter) return;

        // Cargar noticias iniciales
        this.loadCategory(this.currentCategory);

        // Event listeners para tabs
        newsFilter.addEventListener('click', (e) => {
            const tab = e.target.closest('.news-tab');
            if (!tab) return;

            const category = tab.getAttribute('data-category');
            if (category) {
                this.loadCategory(category);
            }
        });
    }

    async loadCategory(category) {
        // Actualizar UI de tabs
        this.updateActiveTab(category);
        
        // Cargar noticias
        await this.renderer.renderNews(category, 'news-grid');
        
        // Pre-cargar otras categorías en background
        this.renderer.preloadOtherCategories(category);
        
        this.currentCategory = category;
    }

    updateActiveTab(activeCategory) {
        const tabs = document.querySelectorAll('.news-tab');
        tabs.forEach(tab => {
            const category = tab.getAttribute('data-category');
            if (category === activeCategory) {
                tab.classList.add('is-active');
                tab.setAttribute('aria-selected', 'true');
            } else {
                tab.classList.remove('is-active');
                tab.setAttribute('aria-selected', 'false');
            }
        });
    }

    /**
     * Método público para refrescar noticias manualmente
     */
    async refreshNews() {
        // Limpiar cache y recargar
        this.renderer.fetcher.cache.clearAll();
        await this.loadCategory(this.currentCategory);
    }
}

// =============== EXPORTAR PARA USO GLOBAL ===============
// Crear instancia global
window.NewsManager = NewsManager;

// Auto-inicializar si no se hace manualmente
if (typeof window !== 'undefined') {
    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
        if (!window.newsManagerInstance) {
            window.newsManagerInstance = new NewsManager();
        }
    }, 100);
}
