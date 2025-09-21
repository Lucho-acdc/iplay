// Configuración de AccuWeather 
const ACCUWEATHER_API_KEY = 'zpka_361cc4e5ac8f45368648240f94417fcd_a32eaee3';
const CITY_KEY = '7894'; // Key de Buenos Aires, Argentina 

document.addEventListener('DOMContentLoaded', function() {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navLinks = document.getElementById('nav-links');

    // Pantalla de precarga con video
    const preloadScreen = document.getElementById('preload-screen');
    const preloadVideo = document.getElementById('preload-video');
    const preloadSkip = document.getElementById('preload-skip');
    let preloadCompleted = false;

    function finishPreload() {
        if (preloadCompleted) return;
        preloadCompleted = true;
        document.body.classList.remove('is-preloading');
        if (preloadScreen) {
            preloadScreen.classList.add('is-hidden');
            setTimeout(() => {
                if (preloadScreen && preloadScreen.parentNode) {
                    preloadScreen.parentNode.removeChild(preloadScreen);
                }
            }, 700);
        }
        if (preloadVideo) {
            try { preloadVideo.pause(); } catch (err) { /* ignore */ }
        }
    }

    if (preloadSkip) {
        preloadSkip.addEventListener('click', finishPreload);
    }

    if (preloadVideo) {
        preloadVideo.addEventListener('ended', finishPreload);
        preloadVideo.addEventListener('error', finishPreload);
        setTimeout(finishPreload, 12000);
    } else {
        finishPreload();
    }
    
    // Alternar menú al hacer clic en el hamburguesa
    hamburgerMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        this.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
    
    // Cerrar menú al hacer clic en un enlace
    const links = document.querySelectorAll('.nav-btn');
    links.forEach(link => {
        link.addEventListener('click', function() {
            hamburgerMenu.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });
    
    // Cerrar menú al hacer clic fuera de él
    document.addEventListener('click', function(event) {
        const isClickInsideNav = navLinks.contains(event.target) || hamburgerMenu.contains(event.target);
        
        if (!isClickInsideNav && navLinks.classList.contains('active')) {
            hamburgerMenu.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
    
    // Cerrar menú con la tecla Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && navLinks.classList.contains('active')) {
            hamburgerMenu.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
    
    // Ajustar menú al cambiar el tamaño de la ventana
    window.addEventListener('resize', function() {
        if (window.innerWidth > 900) {
            hamburgerMenu.classList.remove('active');
            navLinks.classList.remove('active');
        }
    });
    
    // Actualizar fecha automáticamente (formato COMPLETO)
    function updateDate() {
        const dateElement = document.getElementById('navbar-date-full');
        const now = new Date();
        
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        const formattedDate = now.toLocaleDateString('es-ES', options);
        // Capitalizar la primera letra
        dateElement.textContent = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    }
    
    // Obtener datos del clima desde AccuWeather API
    async function getWeatherData() {
        try {
            const response = await fetch(
                `https://dataservice.accuweather.com/currentconditions/v1/${CITY_KEY}?apikey=${ACCUWEATHER_API_KEY}&language=es&details=true`
            );
            
            if (!response.ok) {
                throw new Error('Error al obtener datos del clima');
            }
            
            const data = await response.json();
            return data[0];
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    }
    
    // Mapeo de iconos de AccuWeather a emojis
    function getWeatherEmoji(iconNumber) {
        const iconMap = {
            1: '\u2600\uFE0F',  2: '\uD83C\uDF24\uFE0F',  3: '\uD83C\uDF24\uFE0F',  4: '\u26C5',  5: '\uD83C\uDF25\uFE0F',
            6: '\u2601\uFE0F',  7: '\u2601\uFE0F',  8: '\u2601\uFE0F',  11: '\uD83C\uDF2B\uFE0F', 12: '\uD83C\uDF27\uFE0F',
            13: '\uD83C\uDF26\uFE0F', 14: '\uD83C\uDF26\uFE0F', 15: '\u26C8\uFE0F', 16: '\u26C8\uFE0F', 17: '\uD83C\uDF26\uFE0F',
            18: '\uD83C\uDF27\uFE0F', 19: '\uD83C\uDF28\uFE0F', 20: '\uD83C\uDF28\uFE0F', 21: '\uD83C\uDF28\uFE0F', 22: '\u2744\uFE0F',
            23: '\uD83C\uDF28\uFE0F', 24: '\uD83C\uDF28\uFE0F', 25: '\uD83C\uDF28\uFE0F', 26: '\uD83C\uDF28\uFE0F', 29: '\uD83C\uDF28\uFE0F',
            30: '\uD83D\uDD25', 31: '\uD83E\uDD76', 32: '\uD83D\uDCA8', 33: '\uD83C\uDF19', 34: '\uD83C\uDF24\uFE0F',
            35: '\uD83C\uDF24\uFE0F', 36: '\uD83C\uDF25\uFE0F', 37: '\uD83C\uDF2B\uFE0F', 38: '\u2601\uFE0F', 39: '\uD83C\uDF26\uFE0F',
            40: '\uD83C\uDF26\uFE0F', 41: '\u26C8\uFE0F', 42: '\u26C8\uFE0F', 43: '\uD83C\uDF28\uFE0F', 44: '\uD83C\uDF28\uFE0F'
        };
        
        return iconMap[iconNumber] || '\uD83C\uDF21\uFE0F';
    }
    
    // Actualizar la interfaz con los datos del clima
    function updateWeatherUI(data) {
        const weatherIcon = document.getElementById('navbar-weather-icon-full');
        const weatherTemp = document.getElementById('navbar-weather-temp-full');
        
        if (!data) {
            weatherIcon.textContent = '\u274C';
            weatherTemp.textContent = 'Error al cargar clima';
            return;
        }
        
        const temperature = Math.round(data.Temperature.Metric.Value);
        const iconNumber = data.WeatherIcon;
        
        weatherIcon.textContent = getWeatherEmoji(iconNumber);
        weatherIcon.title = data.WeatherText;
        weatherTemp.textContent = `${temperature}\u00B0 Buenos Aires`;
    }
    
    // Función principal para actualizar el clima
    async function updateWeather() {
        const weatherData = await getWeatherData();
        updateWeatherUI(weatherData);
    }
    
    // Inicializar y configurar actualizaciones
    updateDate();
    
    // Solo intentar obtener el clima si hay una API key configurada
    if (ACCUWEATHER_API_KEY && ACCUWEATHER_API_KEY !== 'tu_api_key_de_accuweather_aqui') {
        updateWeather();
        // Actualizar el clima cada 30 minutos
        setInterval(updateWeather, 1800000);
    } else {
        // Modo demo si no hay API key
        document.getElementById('navbar-weather-icon-full').textContent = '\uD83C\uDF24\uFE0F';
        document.getElementById('navbar-weather-temp-full').textContent = '13\u00B0 Buenos Aires';
    }
    
    // Actualizar la fecha cada minuto
    setInterval(updateDate, 60000);

// Altura dinámica de la sección hero (entre header y footer)
    function updateHeroHeight() {
        const header = document.querySelector('.navbar');
        const footer = document.querySelector('.radio-player');
        const headerH = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
        const footerH = footer ? Math.ceil(footer.getBoundingClientRect().height) : 0;
        // usar calc en la variable para permitir uso directo en CSS
        document.documentElement.style.setProperty('--hero-min-h', `calc(100vh - ${headerH}px - ${footerH}px)`);
    }

    // Debounce helper y bind
    function debounce(fn, wait) {
      let t = null;
      return function(...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    }

    const debouncedUpdateHeroHeight = debounce(updateHeroHeight, 120);
    updateHeroHeight();
    window.addEventListener('resize', debouncedUpdateHeroHeight);
    window.addEventListener('orientationchange', debouncedUpdateHeroHeight);
    window.addEventListener('load', updateHeroHeight);

    // Asegurar reproducción del video de portada (autoplay silencioso)
    const heroVideo = document.querySelector('.media-video');
    if (heroVideo) {
        const tryPlay = heroVideo.play();
        if (tryPlay && typeof tryPlay.then === 'function') {
            tryPlay.catch(() => {
                // Si el navegador bloquea autoplay, mostrar controles para que el usuario pueda reproducir
                heroVideo.controls = true;
            });
        }
    }

    // Abrir secciones inline (cámaras/noticias) bajo la principal
    function openInlineSection(id) {
        const sec = document.getElementById(id);
        if (!sec || sec.hasAttribute('data-coming-soon-section')) return;
        sec.classList.add('is-open');
        // permitir scroll si estaba al tope
        document.body.style.overflowY = 'auto';
        // scroll con offset de la navbar
        const header = document.querySelector('.navbar');
        const offset = (header ? header.offsetHeight : 0) + 6;
        const top = sec.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
    document.querySelectorAll('[data-open-section]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const id = el.getAttribute('data-open-section');
            openInlineSection(id);
        });
    });

    // Cámaras en vivo con mini player y cache local
    (function setupCamPreview() {
        const camCards = Array.from(document.querySelectorAll('.cam-card'));
        const preview = document.getElementById('cam-preview');
        const player = document.getElementById('cam-preview-player');
        const titleEl = document.getElementById('cam-preview-title');
        const openBtn = document.getElementById('cam-preview-open');

        if (!camCards.length || !preview || !player || !titleEl || !openBtn) {
            return;
        }

        const STORAGE_KEY = 'iplay_cam_last_selection';
        const HISTORY_KEY = 'iplay_cam_recent_history';
        const DEFAULT_TITLE = 'Seleccioná una cámara';
        const DEFAULT_MESSAGE = 'Seleccioná una cámara para verla en vivo.';

        const historyWrapper = document.getElementById('cam-preview-history-wrapper');
        const historyListEl = document.getElementById('cam-preview-history');
        let historyList = [];
        let currentCam = null;

        function storage(action, value, key = STORAGE_KEY) {
            try {
                if (!('localStorage' in window)) return null;
                if (action === 'get') {
                    const raw = window.localStorage.getItem(key);
                    return raw ? JSON.parse(raw) : null;
                }
                if (action === 'set') {
                    window.localStorage.setItem(key, JSON.stringify(value));
                }
            } catch (err) {
                console.warn('Cámaras: almacenamiento no disponible', err);
            }
            return null;
        }

        function createPlaceholder(message = DEFAULT_MESSAGE) {
            const placeholder = document.createElement('div');
            placeholder.className = 'cam-preview-placeholder';
            placeholder.textContent = message;
            return placeholder;
        }

        function renderMedia(data) {
            player.innerHTML = '';
            if (data && data.stream) {
                const iframe = document.createElement('iframe');
                iframe.className = 'cam-preview-media';
                iframe.src = data.stream;
                iframe.loading = 'lazy';
                iframe.allow = 'autoplay; fullscreen; picture-in-picture';
                iframe.referrerPolicy = 'no-referrer';
                player.appendChild(iframe);
                return;
            }
            if (data && data.thumb) {
                const img = document.createElement('img');
                img.className = 'cam-preview-media';
                img.src = data.thumb;
                img.alt = data.title || DEFAULT_TITLE;
                img.loading = 'lazy';
                player.appendChild(img);
                return;
            }
            player.appendChild(createPlaceholder());
        }

        function setActiveCard(card) {
            camCards.forEach(el => {
                el.classList.toggle('is-active', el === card);
            });
        }

        function getCardData(card) {
            const title = card.dataset.title || card.querySelector('.cam-title')?.textContent?.trim() || DEFAULT_TITLE;
            const stream = card.dataset.stream || '';
            const thumb = card.querySelector('img')?.getAttribute('src') || '';
            const external = card.getAttribute('href');
            return { title, stream, thumb, external };
        }

        const storedHistory = storage('get', undefined, HISTORY_KEY);
        if (Array.isArray(storedHistory)) {
            historyList = storedHistory.filter(item => item && item.external);
        }

        function renderHistory() {
            if (!historyWrapper || !historyListEl) return;
            historyListEl.innerHTML = '';
            if (!historyList.length) {
                historyWrapper.classList.add('is-empty');
                return;
            }
            historyWrapper.classList.remove('is-empty');
            historyList.forEach(item => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'cam-history-item';
                btn.setAttribute('data-external', item.external);

                if (item.thumb) {
                    const img = document.createElement('img');
                    img.className = 'cam-history-thumb';
                    img.src = item.thumb;
                    img.loading = 'lazy';
                    img.alt = item.title || DEFAULT_TITLE;
                    btn.appendChild(img);
                } else {
                    const placeholder = document.createElement('div');
                    placeholder.className = 'cam-history-thumb cam-history-thumb--placeholder';
                    placeholder.textContent = 'LIVE';
                    btn.appendChild(placeholder);
                }

                const label = document.createElement('span');
                label.className = 'cam-history-title';
                label.textContent = item.title || DEFAULT_TITLE;
                btn.appendChild(label);

                btn.addEventListener('click', () => selectHistoryItem(item));
                historyListEl.appendChild(btn);
            });
        }

        function saveHistory() {
            storage('set', historyList, HISTORY_KEY);
        }

        function pushHistory(data) {
            if (!data || !data.external) return;
            const entry = {
                title: data.title || DEFAULT_TITLE,
                external: data.external,
                stream: data.stream || '',
                thumb: data.thumb || ''
            };
            historyList = historyList.filter(item => item.external !== entry.external);
            historyList.unshift(entry);
            if (historyList.length > 6) {
                historyList.length = 6;
            }
            saveHistory();
            renderHistory();
        }

        function selectHistoryItem(item) {
            const match = camCards.find(card => card.getAttribute('href') === item.external);
            if (match) {
                const data = getCardData(match);
                applyCamData(data, { card: match, persist: true });
                pushHistory(data);
            } else {
                applyCamData(item, { card: null, persist: true });
                pushHistory(item);
            }
        }

        function applyCamData(data, options = {}) {
            const { card = null, persist = false } = options;
            currentCam = data;
            renderMedia(data);
            titleEl.textContent = data?.title || DEFAULT_TITLE;
            openBtn.disabled = !(data && data.external);
            preview.classList.toggle('cam-preview-has-media', !!(data && (data.stream || data.thumb)));
            setActiveCard(card || null);
            if (persist && data) {
                storage('set', data);
            }
        }

        function handleCardClick(card, event) {
            event.preventDefault();
            const data = getCardData(card);
            applyCamData(data, { card, persist: true });
            pushHistory(data);
        }

        camCards.forEach(card => {
            card.addEventListener('click', (event) => handleCardClick(card, event));
        });

        openBtn.addEventListener('click', () => {
            if (currentCam && currentCam.external) {
                window.open(currentCam.external, '_blank', 'noopener');
            }
        });

        renderHistory();

        // Intentar restaurar la última cámara
        const saved = storage('get');
        if (saved && saved.external) {
            const match = camCards.find(card => card.getAttribute('href') === saved.external);
            if (match) {
                const matchData = getCardData(match);
                applyCamData(matchData, { card: match, persist: false });
                pushHistory(matchData);
                return;
            }
            applyCamData(saved, { card: null, persist: false });
            pushHistory(saved);
        } else {
            applyCamData(null, { card: null, persist: false });
        }
    })();

    const comingSoonCards = document.querySelectorAll('[data-coming-soon]');
    const RUBBER_CLASSES = ['animate__animated', 'animate__rubberBand', 'animate__faster'];

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    function hasContent(el) {
        return !!(el && el.textContent && el.textContent.trim().length > 0);
    }

    function runRubber(el) {
        return new Promise(resolve => {
            if (!el) {
                resolve();
                return;
            }
            RUBBER_CLASSES.forEach(cls => el.classList.remove(cls));
            // Forzar reflow para reiniciar la animación
            void el.offsetWidth;
            let finished = false;
            const cleanup = () => {
                if (finished) return;
                finished = true;
                RUBBER_CLASSES.forEach(cls => el.classList.remove(cls));
                el.removeEventListener('animationend', onEnd);
                clearTimeout(fallbackTimer);
                resolve();
            };
            const onEnd = () => cleanup();
            const fallbackTimer = setTimeout(cleanup, 900);
            RUBBER_CLASSES.forEach(cls => el.classList.add(cls));
            el.addEventListener('animationend', onEnd, { once: true });
        });
    }

    async function animateOut(el) {
        if (!el || !hasContent(el)) {
            if (el) el.classList.add('coming-soon-hidden');
            return;
        }
        await runRubber(el);
        el.classList.add('coming-soon-hidden');
    }

    async function animateIn(el) {
        if (!el || !hasContent(el)) {
            if (el) el.classList.add('coming-soon-hidden');
            return;
        }
        el.classList.remove('coming-soon-hidden');
        await runRubber(el);
    }

    comingSoonCards.forEach(card => {
        card.setAttribute('aria-disabled', 'true');
        const titleEl = card.querySelector('.fc-title');
        const subtitleEl = card.querySelector('.fc-subtitle');

        if (titleEl && !card.dataset.originalTitle) {
            card.dataset.originalTitle = titleEl.textContent.trim();
        }
        if (subtitleEl && !card.dataset.originalSubtitle) {
            card.dataset.originalSubtitle = subtitleEl.textContent.trim();
        }

        card.addEventListener('click', async (event) => {
            event.preventDefault();
            if (card.dataset.comingSoonActive === 'true') return;

            card.dataset.comingSoonActive = 'true';
            card.classList.add('is-coming-soon');
            card.blur();

            try {
                await Promise.all([animateOut(titleEl), animateOut(subtitleEl)]);

                if (titleEl) {
                    titleEl.textContent = 'Próximamente';
                }
                if (subtitleEl) {
                    subtitleEl.textContent = '';
                }

                await Promise.all([animateIn(titleEl), animateIn(subtitleEl)]);

                await wait(1800);

                await Promise.all([animateOut(titleEl), animateOut(subtitleEl)]);

                if (titleEl) {
                    titleEl.textContent = card.dataset.originalTitle || 'Próximamente';
                }
                if (subtitleEl) {
                    subtitleEl.textContent = card.dataset.originalSubtitle || '';
                }

                await Promise.all([animateIn(titleEl), animateIn(subtitleEl)]);
            } finally {
                if (titleEl) titleEl.classList.remove('coming-soon-hidden');
                if (subtitleEl) subtitleEl.classList.remove('coming-soon-hidden');
                card.classList.remove('is-coming-soon');
                card.dataset.comingSoonActive = 'false';
            }
        });
    });

    document.querySelectorAll('[data-coming-soon-section]').forEach(section => {
        section.setAttribute('aria-hidden', 'true');
    });

    // Expanding cards (para La Radio y Recomendaciones) en dispositivos táctiles
    document.querySelectorAll('[data-expander]').forEach(row => {
        const cards = Array.from(row.querySelectorAll('.exp-card'));
        // Para hover ya funciona con CSS; en touch alternamos estado activo
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                const isTouch = matchMedia('(hover: none) and (pointer: coarse)').matches;
                if (!isTouch) return; // en desktop, el hover ya hace el trabajo
                e.preventDefault();
                cards.forEach(c => c.classList.remove('is-active'));
                card.classList.add('is-active');
            });
        });
    });
});

// =============== SISTEMA DE NOTICIAS MEJORADO ===============
// El sistema de noticias ahora se maneja en news.js
// Este código se mantiene como fallback si news.js no está disponible
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el nuevo sistema de noticias está disponible
    if (typeof window.NewsManager !== 'undefined') {
        console.log('Sistema de noticias mejorado cargado desde news.js');
        return; // El nuevo sistema se encarga de todo
    }
    
    // Fallback al sistema anterior si news.js no está disponible
    console.warn('news.js no disponible, usando sistema de noticias básico');
    
    const grid = document.getElementById('news-grid');
    const tabs = document.getElementById('news-filter');
    if (!grid) return;

    const RSS_URL = 'https://news.google.com/rss/search?q=Z%C3%A1rate+Argentina&hl=es-419&gl=AR&ceid=AR:es-419';

    async function fetchRSSWithFallback(url) {
        const candidates = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            `https://r.jina.ai/http/${url.replace(/^https?:\/\//,'')}`
        ];
        for (const u of candidates) {
            try {
                const res = await fetch(u, { cache: 'no-store' });
                if (!res.ok) continue;
                const text = await res.text();
                if (text && text.length > 0) return text;
            } catch (e) { /* intentar próximo */ }
        }
        throw new Error('No se pudo obtener el RSS por CORS');
    }

    function parseRSS(xmlText) {
        const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
        const items = Array.from(doc.querySelectorAll('item'));
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7*24*60*60*1000);
        return items.map(item => {
            const title = item.querySelector('title')?.textContent?.trim() || '';
            const link = item.querySelector('link')?.textContent?.trim() || '';
            const pub = item.querySelector('pubDate')?.textContent?.trim() || '';
            const src = item.querySelector('source')?.textContent?.trim() || '';
            const description = item.querySelector('description')?.textContent?.trim() || '';
            const date = pub ? new Date(pub) : null;
            return { title, link, date, src, description };
        }).filter(n => {
            if (!n.title || !n.link || (n.date && n.date < weekAgo)) return false;
            const text = n.title.toLowerCase();
            return text.includes('zarate') || text.includes('zárate');
        })
          .slice(0, 20);
    }

    function timeAgo(date) {
        if (!date) return '';
        const ms = Date.now() - date.getTime();
        const min = Math.floor(ms/60000);
        if (min < 60) return `hace ${min} min`;
        const hr = Math.floor(min/60);
        if (hr < 24) return `hace ${hr} h`;
        const d = Math.floor(hr/24);
        return d === 1 ? 'ayer' : `hace ${d} días`;
    }

    function hostname(u) {
        try { return new URL(u).hostname.replace(/^www\./,''); } catch { return ''; }
    }

    function escapeHTML(str = '') {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function stripHTML(html) {
        if (!html) return '';
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return (temp.textContent || temp.innerText || '').trim();
    }

    function buildExcerpt(news) {
        const raw = stripHTML(news.description || '');
        const normalized = raw.replace(/\s+/g, ' ').trim();
        if (normalized) {
            return normalized.length > 180 ? `${normalized.slice(0, 177)}…` : normalized;
        }
        const source = news.src || hostname(news.link) || 'la fuente original';
        return `Leé la nota completa en ${source}.`;
    }

    function renderNews(list) {
        grid.innerHTML = '';
        if (!list.length) {
            grid.innerHTML = '<div class="news-loading">No hay noticias disponibles ahora.</div>';
            return;
        }
        const frag = document.createDocumentFragment();
        list.forEach(n => {
            const a = document.createElement('a');
            a.className = 'news-card';
            a.href = n.link; a.target = '_blank'; a.rel = 'noopener';
            const title = escapeHTML(n.title);
            const excerpt = escapeHTML(buildExcerpt(n));
            const source = escapeHTML(n.src || hostname(n.link));
            const time = n.date ? timeAgo(n.date) : '';
            const safeTime = escapeHTML(time);
            a.innerHTML = `
                <div class="news-card-title">${title}</div>
                <div class="news-card-content">
                    <p>${excerpt}</p>
                </div>
                <div class="news-card-meta">
                    <span class="news-card-source">${source}</span>
                    ${safeTime ? `<span class="news-card-time">${safeTime}</span>` : ''}
                </div>`;
            frag.appendChild(a);
        });
        grid.appendChild(frag);
    }

    async function loadNews() {
        try {
            const xml = await fetchRSSWithFallback(RSS_URL);
            const list = parseRSS(xml);
            renderNews(list);
        } catch (e) {
            console.warn('Noticias: error al cargar', e);
            grid.innerHTML = '<div class="news-loading">Error al cargar noticias.</div>';
        }
    }

    // Solo cargar si no hay tabs (sistema básico)
    if (!tabs) {
        loadNews();
    }
});

// =============== REPRODUCTOR DE RADIO ===============
// El reproductor ahora se maneja en player.js
// Este código se mantiene como fallback si player.js no está disponible
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el nuevo reproductor está disponible
    if (typeof window.RadioPlayer !== 'undefined') {
        console.log('Reproductor mejorado cargado desde player.js');
        return; // El nuevo reproductor se encarga de todo
    }
    
    // Fallback al sistema anterior si player.js no está disponible
    console.warn('player.js no disponible, usando reproductor básico');
    
    const audioPlayer = document.getElementById('radio-stream');
    const playButton = document.getElementById('play-btn');
    const songTitle = document.getElementById('song-title');
    
    if (!audioPlayer || !playButton || !songTitle) {
        console.error('Elementos del reproductor no encontrados');
        return;
    }

    let isPlaying = false;
    const STREAM_URL = 'https://168.90.255.12/listen/intelinet_play/radio.mp3';

    // Función básica de toggle
    function togglePlayback(e) {
        e.preventDefault();
        
        if (isPlaying) {
            audioPlayer.pause();
            playButton.classList.remove('playing');
            isPlaying = false;
            songTitle.textContent = 'Dale PLAY a tu día';
        } else {
            audioPlayer.src = STREAM_URL;
            audioPlayer.play().catch(error => {
                console.error('Error al reproducir:', error);
                songTitle.textContent = 'Error de conexión';
            });
            playButton.classList.add('playing');
            isPlaying = true;
            songTitle.textContent = 'IPlay Radio - En vivo';
        }
    }

    playButton.addEventListener('click', togglePlayback);
    
    // Eventos básicos
    audioPlayer.addEventListener('play', () => {
        isPlaying = true;
        playButton.classList.add('playing');
    });
    
    audioPlayer.addEventListener('pause', () => {
        isPlaying = false;
        playButton.classList.remove('playing');
    });
    
    audioPlayer.addEventListener('error', () => {
        console.warn('Error de audio');
        songTitle.textContent = 'Error de conexión';
    });
});
