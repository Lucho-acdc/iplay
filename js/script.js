// Configuración de AccuWeather 
const ACCUWEATHER_API_KEY = 'zpka_361cc4e5ac8f45368648240f94417fcd_a32eaee3';
const CITY_KEY = '7894'; // Key de Buenos Aires, Argentina 

document.addEventListener('DOMContentLoaded', function() {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navLinks = document.getElementById('nav-links');
    
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
            1: '☀️',  2: '🌤️',  3: '🌤️',  4: '⛅',  5: '🌥️',
            6: '☁️',  7: '☁️',  8: '☁️',  11: '🌫️', 12: '🌧️',
            13: '🌦️', 14: '🌦️', 15: '⛈️', 16: '⛈️', 17: '🌦️',
            18: '🌧️', 19: '🌨️', 20: '🌨️', 21: '🌨️', 22: '❄️',
            23: '🌨️', 24: '🌨️', 25: '🌨️', 26: '🌨️', 29: '🌨️',
            30: '🔥', 31: '🥶', 32: '💨', 33: '🌙', 34: '🌤️',
            35: '🌤️', 36: '🌥️', 37: '🌫️', 38: '☁️', 39: '🌦️',
            40: '🌦️', 41: '⛈️', 42: '⛈️', 43: '🌨️', 44: '🌨️'
        };
        
        return iconMap[iconNumber] || '🌡️';
    }
    
    // Actualizar la interfaz con los datos del clima
    function updateWeatherUI(data) {
        const weatherIcon = document.getElementById('navbar-weather-icon-full');
        const weatherTemp = document.getElementById('navbar-weather-temp-full');
        
        if (!data) {
            weatherIcon.textContent = '❌';
            weatherTemp.textContent = 'Error al cargar clima';
            return;
        }
        
        const temperature = Math.round(data.Temperature.Metric.Value);
        const iconNumber = data.WeatherIcon;
        
        weatherIcon.textContent = getWeatherEmoji(iconNumber);
        weatherIcon.title = data.WeatherText;
        weatherTemp.textContent = `${temperature}° Buenos Aires`;
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
        document.getElementById('navbar-weather-icon-full').textContent = '🌤️';
        document.getElementById('navbar-weather-temp-full').textContent = '13° Buenos Aires';
    }
    
    // Actualizar la fecha cada minuto
    setInterval(updateDate, 60000);

    // Altura dinámica de la sección hero (entre header y footer)
    function updateHeroHeight() {
        const header = document.querySelector('.navbar');
        const footer = document.querySelector('.radio-player');
        const headerH = header ? header.offsetHeight : 0;
        const footerH = footer ? footer.offsetHeight : 0;
        const val = `calc(100vh - ${headerH}px - ${footerH}px)`;
        document.documentElement.style.setProperty('--hero-min-h', val);
    }
    updateHeroHeight();
    window.addEventListener('resize', updateHeroHeight);
    window.addEventListener('orientationchange', updateHeroHeight);

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
});

// =============== Noticias (Google News RSS) ===============
document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('news-grid');
    if (!grid) return;

    const RSS_URL = 'https://news.google.com/rss?hl=es-419&gl=AR&ceid=AR:es-419';

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
            const date = pub ? new Date(pub) : null;
            return { title, link, date, src };
        }).filter(n => n.title && n.link && (!n.date || n.date >= weekAgo))
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
            a.innerHTML = `
                <div class="news-title">${n.title}</div>
                <div class="news-meta">
                    <span class="news-source">${n.src || hostname(n.link)}</span>
                    <span class="news-time">${n.date ? timeAgo(n.date) : ''}</span>
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

    loadNews();
});

// =============== Noticias (mejoradas con categorías e imágenes) ===============
document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('news-grid');
    const tabs = document.getElementById('news-filter');
    if (!grid || !tabs) return;

    const FEEDS = {
        actualidad: 'https://news.google.com/rss?hl=es-419&gl=AR&ceid=AR:es-419',
        deportes: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=es-419&gl=AR&ceid=AR:es-419',
        espectaculos: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=es-419&gl=AR&ceid=AR:es-419'
    };
    const newsCache = {};

    async function fetchRSS(url) {
        const jina = `https://r.jina.ai/http/${url.replace(/^https?:\/\//,'')}`;
        try {
            const r = await fetch(jina, { cache: 'no-store' });
            if (r.ok) return await r.text();
        } catch {}
        const all = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const r2 = await fetch(all, { cache: 'no-store' });
        if (!r2.ok) throw new Error('RSS fetch fail');
        return await r2.text();
    }

    function parseRSS(xmlText) {
        const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
        const items = Array.from(doc.querySelectorAll('item'));
        const weekAgo = new Date(Date.now() - 7*24*60*60*1000);
        return items.map(item => {
            const title = item.querySelector('title')?.textContent?.trim() || '';
            const link = item.querySelector('link')?.textContent?.trim() || '';
            const pub = item.querySelector('pubDate')?.textContent?.trim() || '';
            const src = item.querySelector('source')?.textContent?.trim() || '';
            const date = pub ? new Date(pub) : null;
            let image = '';
            const mc = item.getElementsByTagName('media:content')[0] || item.getElementsByTagName('enclosure')[0] || item.getElementsByTagName('media:thumbnail')[0];
            if (mc && mc.getAttribute) image = mc.getAttribute('url') || '';
            if (!image) {
                const html = item.querySelector('content\\:encoded')?.textContent || '';
                const m = html && html.match(/<img[^>]+src=\"([^\"]+)\"/i);
                if (m) image = m[1];
            }
            return { title, link, date, src, image };
        }).filter(n => n.title && n.link && (!n.date || n.date >= weekAgo)).slice(0, 20);
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
    const host = (u) => { try { return new URL(u).hostname.replace(/^www\./,''); } catch { return ''; } };
    const fallbackIcon = (u) => `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(u)}`;

    function render(list) {
        grid.innerHTML = '';
        if (!list.length) { grid.innerHTML = '<div class="news-loading">No hay noticias disponibles ahora.</div>'; return; }
        const frag = document.createDocumentFragment();
        list.forEach(n => {
            const a = document.createElement('a');
            a.className = 'news-card'; a.href = n.link; a.target = '_blank'; a.rel = 'noopener';
            const imgSrc = n.image || fallbackIcon(n.link);
            a.innerHTML = `
                <div class=\"news-thumb\"><img src=\"${imgSrc}\" alt=\"\"></div>
                <div class=\"news-title\">${n.title}</div>
                <div class=\"news-meta\"><span class=\"news-source\">${n.src || host(n.link)}</span><span class=\"news-time\">${n.date ? timeAgo(n.date) : ''}</span></div>`;
            frag.appendChild(a);
        });
        grid.appendChild(frag);
    }

    async function loadCategory(cat) {
        const url = FEEDS[cat] || FEEDS.actualidad;
        grid.innerHTML = '<div class="news-loading">Cargando noticias…</div>';
        try {
            if (!newsCache[cat]) {
                const xml = await fetchRSS(url);
                newsCache[cat] = parseRSS(xml);
            }
            render(newsCache[cat]);
        } catch (e) {
            console.warn('Noticias: error al cargar', e);
            grid.innerHTML = '<div class="news-loading">Error al cargar noticias.</div>';
        }
    }

    // Cargar y prefetch
    loadCategory('actualidad');
    ['deportes','espectaculos'].forEach(k => fetchRSS(FEEDS[k]).then(xml => newsCache[k] = parseRSS(xml)).catch(()=>{}));

    tabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.news-tab'); if (!btn) return;
        tabs.querySelectorAll('.news-tab').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        loadCategory(btn.getAttribute('data-category'));
    });
});

// Parte Reproductor

// Funcionalidad del reproductor de radio
document.addEventListener('DOMContentLoaded', function() {
    // Configuración del reproductor
    const audioPlayer = document.getElementById('radio-stream');
    const playButton = document.getElementById('play-btn');
    const songTitle = document.getElementById('song-title');
    const playerBar = document.querySelector('.radio-player');

    // Estado inicial
    let isPlaying = false;

    // Función para toggle play/pause
    function togglePlayback(e) {
        e.preventDefault();
        
        if (isPlaying) {
            audioPlayer.pause();
            playButton.classList.remove('playing');
        } else {
            // Asegurar usar la fuente vigente y reintentar si falla
            if (!audioPlayer.src) {
                setStream(STREAM_SOURCES[streamIndex]);
            }
            audioPlayer.play().catch(error => {
                console.error('Error al reproducir:', error);
                songTitle.textContent = 'Error de conexión';
                scheduleReconnect();
            });
            playButton.classList.add('playing');
        }
        isPlaying = !isPlaying;
    }

    // Event listeners para los controles
    playButton.addEventListener('click', togglePlayback);

    // Manejar eventos del reproductor
    audioPlayer.addEventListener('play', function() {
        playButton.classList.add('playing');
        isPlaying = true;
        songTitle.textContent = 'Conectando…';
        if (playerBar) playerBar.classList.add('is-playing');
        startNowPlayingPolling();
        // refrescar ondas/pulso
        setTimeout(() => updateVolumeUI(audioPlayer.volume), 0);
    });

    audioPlayer.addEventListener('pause', function() {
        playButton.classList.remove('playing');
        isPlaying = false;
        stopNowPlayingPolling();
        songTitle.textContent = 'Dale PLAY a tu día';
        if (playerBar) playerBar.classList.remove('is-playing');
        // detener pulso
        setTimeout(() => updateVolumeUI(audioPlayer.volume), 0);
    });
    
    const STREAM_BASE = 'https://168.90.252.40';
    const STATION_SLUG = 'intelinet_play';

    // 1) AzuraCast: /api/nowplaying/<station>
    async function fetchAzuraNowPlaying() {
        const candidates = [
            `${STREAM_BASE}/api/nowplaying/${STATION_SLUG}`,
            `${STREAM_BASE}/api/nowplaying`
        ];
        for (const url of candidates) {
            try {
                const res = await fetch(url, { method: 'GET' });
                if (!res.ok) continue;
                const data = await res.json();
                const entry = Array.isArray(data)
                  ? (data.find(e => (e.station && (e.station.shortcode === STATION_SLUG || e.station.name?.includes('IPlay')))) || data[0])
                  : data;
                const title = entry?.now_playing?.song?.title || entry?.playing_now?.song?.title;
                const artist = entry?.now_playing?.song?.artist || entry?.playing_now?.song?.artist;
                if (title || artist) {
                    songTitle.textContent = artist ? `${title} — ${artist}` : title;
                    return true;
                }
            } catch (e) {
                // Intentar siguiente método
            }
        }
        return false;
    }

    // 2) Icecast: /status-json.xsl
    async function fetchIcecastStatus() {
        const url = `${STREAM_BASE}/status-json.xsl`;
        try {
            const res = await fetch(url, { method: 'GET' });
            if (!res.ok) return false;
            const data = await res.json();
            const sources = data?.icestats?.source;
            const arr = Array.isArray(sources) ? sources : (sources ? [sources] : []);
            const src = arr.find(s => (s.listenurl?.includes(STATION_SLUG) || s.server_name?.includes('IPlay'))) || arr[0];
            const title = src?.title || src?.server_name;
            if (title) { songTitle.textContent = title; return true; }
            return false;
        } catch (e) { return false; }
    }

    // 3) HTML público como último recurso (puede fallar por CORS)
    async function fetchPublicHtml() {
        const url = `${STREAM_BASE}/public/${STATION_SLUG}`;
        try {
            const res = await fetch(url, { method: 'GET' });
            if (!res.ok) return false;
            const html = await res.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const titleEl = doc.querySelector('.now-playing-title');
            const artistEl = doc.querySelector('.now-playing-artist');
            const title = titleEl ? titleEl.textContent.trim() : '';
            const artist = artistEl ? artistEl.textContent.trim() : '';
            if (title || artist) {
                songTitle.textContent = artist ? `${title} — ${artist}` : title;
                return true;
            }
            return false;
        } catch (e) { return false; }
    }

    // Fallback local si falla CORS o la petición
    const fallbackSongs = [
        'Transmisión en vivo',
        'iPlay Radio — En vivo',
        'iPlay: Música y noticias'
    ];
    let fbIndex = 0;

    async function refreshNowPlaying() {
        let ok = await fetchAzuraNowPlaying();
        if (!ok) ok = await fetchIcecastStatus();
        if (!ok) ok = await fetchPublicHtml();
        if (!ok) {
            songTitle.textContent = fallbackSongs[fbIndex % fallbackSongs.length];
            fbIndex++;
        }
    }

    // Control del polling de Now Playing: solo cuando está reproduciendo
    let nowPlayingTimer = null;
    function startNowPlayingPolling() {
        if (nowPlayingTimer) return;
        refreshNowPlaying();
        nowPlayingTimer = setInterval(refreshNowPlaying, 15000);
    }
    function stopNowPlayingPolling() {
        if (nowPlayingTimer) { clearInterval(nowPlayingTimer); nowPlayingTimer = null; }
    }

    // Manejo de reconexión y failover de stream
    const STREAM_SOURCES = [
        'https://168.90.252.40/listen/intelinet_play/stream',
        'http://168.90.252.40/listen/intelinet_play/stream'
    ];
    let streamIndex = 0;
    let reconnectTimer = null;
    let reconnectDelay = 3000; // ms (aumenta progresivo)

    function setStream(url) {
        try {
            // Forzar asignación directa al audio (ignora <source>)
            audioPlayer.src = url;
            audioPlayer.load();
        } catch (e) { console.warn('No se pudo asignar stream:', e); }
    }

    async function tryPlayCurrent() {
        try {
            const p = audioPlayer.play();
            if (p && typeof p.then === 'function') await p;
            return true;
        } catch (e) {
            console.warn('Fallo al reproducir fuente actual:', e);
            return false;
        }
    }

    async function failoverNextSource() {
        streamIndex = (streamIndex + 1) % STREAM_SOURCES.length;
        setStream(STREAM_SOURCES[streamIndex]);
        return tryPlayCurrent();
    }

    function scheduleReconnect() {
        if (!isPlaying) return; // solo si el usuario quiso reproducir
        if (reconnectTimer) return;
        reconnectTimer = setTimeout(async () => {
            reconnectTimer = null;
            const ok = await tryPlayCurrent();
            if (!ok) {
                const switched = await failoverNextSource();
                if (!switched) {
                    reconnectDelay = Math.min(reconnectDelay * 1.7, 20000);
                    scheduleReconnect();
                } else {
                    reconnectDelay = 3000; // éxito: resetear
                }
            } else {
                reconnectDelay = 3000;
            }
        }, reconnectDelay);
    }

    // Eventos de audio relevantes
    audioPlayer.addEventListener('error', () => {
        const err = audioPlayer.error;
        console.warn('Error de audio:', err?.code, err);
        songTitle.textContent = 'Reconectando audio…';
        scheduleReconnect();
    });
    audioPlayer.addEventListener('stalled', scheduleReconnect);
    audioPlayer.addEventListener('ended', scheduleReconnect);
    
    // Iniciar reproducción automáticamente (opcional)
    // setTimeout(() => togglePlayback(), 1000);
    
    // ==============================================
// CONTROL DE VOLUMEN VISUAL (CÓDIGO CORREGIDO)
// ==============================================

// Configuración del control de volumen visual
const ctrlCircle = document.getElementById('volCtrlCircle');
const ctrlLineF = document.getElementById('volCtrlLineF');
const ctrlLineB = document.getElementById('volCtrlLineB');
const speakerSvg = document.querySelector('.speaker svg');
const volumeSvg = document.querySelector('.vlCtrl svg');
const speakF = document.getElementById('speakF');
const arcBigF = document.getElementById('arcBigF');
const arcSmF = document.getElementById('arcSmF');
const crossLtRb = document.getElementById('crossLtRb');
const crossLbRt = document.getElementById('crossLbRt');

// Si no existen los elementos, salir
if (!ctrlCircle || !ctrlLineF) {
    console.error('Elementos del control de volumen no encontrados');
} else {
    // Configuración inicial
    // En la sección de control de volumen, cambia estos valores:
    const minX = 13;
    const maxX = 187;
    let currentX = minX + (maxX - minX) * audioPlayer.volume; // Sincronizar con el volumen actual
    let isDragging = false;
    let lastVolume = Math.max(0.2, audioPlayer.volume || 0.5); // para restaurar tras mute

    // Longitudes de los trazos
    const speakLen = speakF.getTotalLength();
    const arcBigLen = arcBigF.getTotalLength();
    const arcSmLen = arcSmF.getTotalLength();

    // Inicializar los dasharrays
    speakF.style.strokeDasharray = `${speakLen}`;
    arcBigF.style.strokeDasharray = `${arcBigLen}`;
    arcSmF.style.strokeDasharray = `${arcSmLen}`;

    // Actualizar la interfaz según el volumen
    function updateVolumeUI(volume) {
        // Calcular posición X (0-100% a minX-maxX)
        const xPos = minX + (maxX - minX) * volume;
        currentX = xPos;
        
        // Actualizar elementos visuales
        ctrlCircle.setAttribute('cx', xPos);
        ctrlLineF.setAttribute('x2', xPos);
        
        // Actualizar animaciones del altavoz según el volumen
        if (volume === 0) {
            // Volumen en 0 - mostrar X
            crossLtRb.style.transform = 'scale(1)';
            crossLbRt.style.transform = 'scale(1)';
            speakF.style.opacity = '0';
            arcBigF.style.opacity = '0';
            arcSmF.style.opacity = '0';
            // detener pulso
            arcSmF.classList.remove('pulsing');
            arcBigF.classList.remove('pulsing');
        } else {
            // Volumen mayor a 0 - ocultar X
            crossLtRb.style.transform = 'scale(0)';
            crossLbRt.style.transform = 'scale(0)';
            speakF.style.opacity = '1';
            // Transición progresiva de ondas:
            // - Arco pequeño crece 0..100% entre 0..0.6
            // - Arco grande aparece suave y crece 0..100% entre 0.3..1.0
            const smProgress = Math.max(0, Math.min(1, volume / 0.6));
            const bigProgress = Math.max(0, Math.min(1, (volume - 0.3) / 0.7));

            arcSmF.style.opacity = smProgress > 0 ? '1' : '0';
            arcSmF.style.strokeDasharray = `${arcSmLen * smProgress} ${arcSmLen * (1 - smProgress)}`;

            arcBigF.style.opacity = bigProgress > 0 ? '1' : '0';
            arcBigF.style.strokeDasharray = `${arcBigLen * bigProgress} ${arcBigLen * (1 - bigProgress)}`;

            // Activar pulso si está reproduciendo
            if (isPlaying) {
                arcSmF.classList.add('pulsing');
                arcBigF.classList.add('pulsing');
                const speedFactor = 1 - 0.5 * Math.max(0, Math.min(1, volume)); // 1..0.5
                arcSmF.style.animationDuration = `${(0.9 * speedFactor).toFixed(2)}s`;
                arcBigF.style.animationDuration = `${(1.2 * speedFactor).toFixed(2)}s`;
            } else {
                arcSmF.classList.remove('pulsing');
                arcBigF.classList.remove('pulsing');
                arcSmF.style.animationDuration = '';
                arcBigF.style.animationDuration = '';
            }
        }
    }

    // Inicializar con el volumen actual
    updateVolumeUI(audioPlayer.volume);
    // Asegurar estado visual inicial (pausado): ocultar volumen y centrar
    if (playerBar) playerBar.classList.remove('is-playing');

    // Eventos para arrastrar el control
    ctrlCircle.addEventListener('mousedown', startDrag);
    // Permitir click y arrastre sobre la barra (usar la barra de fondo, que es fija)
    function handleTrackDown(e) {
        const rect = ctrlLineB.getBoundingClientRect();
        const x = e.clientX - rect.left; // posición en píxeles dentro de la barra
        const clampedX = Math.max(0, Math.min(rect.width, x));
        const volume = clampedX / rect.width;
        audioPlayer.volume = volume;
        updateVolumeUI(volume);
        startDrag(e);
    }
    if (ctrlLineB) ctrlLineB.addEventListener('mousedown', handleTrackDown);
    // También permitir sobre la línea de frente por conveniencia
    ctrlLineF.addEventListener('mousedown', handleTrackDown);

    function startDrag(e) {
        isDragging = true;
        e.preventDefault();
        
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    }

    function doDrag(e) {
        if (!isDragging) return;
        const rect = ctrlLineB.getBoundingClientRect();
        let x = e.clientX - rect.left;
        x = Math.max(0, Math.min(rect.width, x));
        const volume = x / rect.width;
        audioPlayer.volume = volume;
        updateVolumeUI(volume);
    }

    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', doDrag);
        document.removeEventListener('mouseup', stopDrag);
    }

    // También funciona en dispositivos táctiles
    ctrlCircle.addEventListener('touchstart', function(e) {
        e.preventDefault();
        startDrag(e.touches[0]);
    });

    // Soporte táctil en la barra
    const handleTrackTouchStart = function(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = ctrlLineB.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const clampedX = Math.max(0, Math.min(rect.width, x));
        const volume = clampedX / rect.width;
        audioPlayer.volume = volume;
        updateVolumeUI(volume);
        startDrag(touch);
    };
    if (ctrlLineB) ctrlLineB.addEventListener('touchstart', handleTrackTouchStart);
    ctrlLineF.addEventListener('touchstart', handleTrackTouchStart);

    // Sincronizar cuando se cambie el volumen desde otros controles
    audioPlayer.addEventListener('volumechange', function() {
        if (!isDragging) { // Para evitar bucles de retroalimentación
            updateVolumeUI(this.volume);
        }
    });

    // Click en el ícono del parlante para mutear/restaurar
    if (speakerSvg) {
        speakerSvg.setAttribute('tabindex', '0');
        speakerSvg.style.outline = 'none';
        speakerSvg.addEventListener('click', function() {
            if (audioPlayer.volume > 0) {
                lastVolume = audioPlayer.volume;
                audioPlayer.volume = 0;
            } else {
                audioPlayer.volume = Math.max(0.05, lastVolume);
            }
            updateVolumeUI(audioPlayer.volume);
        });
        speakerSvg.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    }

    // Rueda del mouse sobre la barra para ajustar volumen
    if (volumeSvg) {
        volumeSvg.setAttribute('tabindex', '0');
        volumeSvg.style.outline = 'none';
        const step = 0.05;
        volumeSvg.addEventListener('wheel', function(e) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -step : step;
            const next = Math.max(0, Math.min(1, audioPlayer.volume + delta));
            audioPlayer.volume = next;
            updateVolumeUI(next);
        }, { passive: false });
        volumeSvg.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault();
                const next = Math.max(0, Math.min(1, audioPlayer.volume + step));
                audioPlayer.volume = next;
                updateVolumeUI(next);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault();
                const next = Math.max(0, Math.min(1, audioPlayer.volume - step));
                audioPlayer.volume = next;
                updateVolumeUI(next);
            } else if (e.key === 'Home') {
                e.preventDefault();
                audioPlayer.volume = 0;
                updateVolumeUI(0);
            } else if (e.key === 'End') {
                e.preventDefault();
                audioPlayer.volume = 1;
                updateVolumeUI(1);
            } else if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                if (audioPlayer.volume > 0) {
                    lastVolume = audioPlayer.volume;
                    audioPlayer.volume = 0;
                } else {
                    audioPlayer.volume = Math.max(0.05, lastVolume);
                }
                updateVolumeUI(audioPlayer.volume);
            }
        });
    }
}
});
