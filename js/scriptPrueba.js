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
        if (!sec) return;
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
    const STREAM_URL = 'https://168.90.252.40/listen/intelinet_play/stream';

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