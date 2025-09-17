/**
 * Reproductor de Radio IPlay - Versión Mejorada
 * 
 * Características:
 * - Manejo robusto de errores y reconexión automática
 * - Polling de información de "now playing"
 * - Múltiples fuentes de stream como fallback
 * - Control de volumen visual mejorado
 */

// =============== CONFIGURACIÓN ===============
// Editar estas constantes para cambiar comportamiento del reproductor
const STREAM_URL = 'https://168.90.252.40/listen/intelinet_play/stream';
const NOWPLAYING_URL = 'https://168.90.252.40/api/nowplaying/intelinet_play';
const STREAM_SOURCES = [
    'https://168.90.252.40/listen/intelinet_play/stream',
    'http://168.90.252.40/listen/intelinet_play/stream' // fallback HTTP
];

// =============== CLASE REPRODUCTOR ===============
class RadioPlayer {
    constructor() {
        this.audioPlayer = document.getElementById('radio-stream');
        this.playButton = document.getElementById('play-btn');
        this.songTitle = document.getElementById('song-title');
        this.playerBar = document.querySelector('.radio-player');
        
        this.isPlaying = false;
        this.streamIndex = 0;
        this.reconnectTimer = null;
        this.reconnectDelay = 3000;
        this.nowPlayingTimer = null;
        
        this.init();
    }

    init() {
        if (!this.audioPlayer || !this.playButton || !this.songTitle) {
            console.error('Elementos del reproductor no encontrados');
            return;
        }

        this.setupEventListeners();
        this.setupVolumeControl();
        console.log('Reproductor de radio inicializado');
    }

    setupEventListeners() {
        // Botón play/pause
        this.playButton.addEventListener('click', (e) => this.togglePlayback(e));

        // Eventos del audio
        this.audioPlayer.addEventListener('play', () => this.onPlay());
        this.audioPlayer.addEventListener('pause', () => this.onPause());
        this.audioPlayer.addEventListener('canplay', () => this.onCanPlay());
        this.audioPlayer.addEventListener('playing', () => this.onPlaying());
        this.audioPlayer.addEventListener('error', () => this.onError());
        this.audioPlayer.addEventListener('stalled', () => this.onStalled());
        this.audioPlayer.addEventListener('ended', () => this.onEnded());
    }

    // =============== CONTROL DE REPRODUCCIÓN ===============
    async togglePlayback(e) {
        e.preventDefault();
        
        if (this.isPlaying) {
            this.pauseAudio();
        } else {
            await this.playAudio();
        }
    }

    async playAudio() {
        try {
            // Asegurar que tenemos una fuente de stream
            if (!this.audioPlayer.src) {
                this.setStream(STREAM_SOURCES[this.streamIndex]);
            }
            
            // Intentar reproducir
            await this.audioPlayer.play();
            this.playButton.classList.add('playing');
            this.isPlaying = true;
            this.songTitle.textContent = 'Conectando…';
            
            if (this.playerBar) this.playerBar.classList.add('is-playing');
            this.startNowPlayingPolling();
            
        } catch (error) {
            console.error('Error al reproducir:', error);
            this.songTitle.textContent = 'Error de conexión';
            this.scheduleReconnect();
        }
    }

    pauseAudio() {
        this.audioPlayer.pause();
        this.playButton.classList.remove('playing');
        this.isPlaying = false;
        this.stopNowPlayingPolling();
        this.songTitle.textContent = 'Dale PLAY a tu día';
        
        if (this.playerBar) this.playerBar.classList.remove('is-playing');
    }

    // =============== EVENTOS DE AUDIO ===============
    onPlay() {
        console.log('Audio empezó a reproducir');
        this.updateVolumeUI();
    }

    onPause() {
        console.log('Audio pausado');
        this.updateVolumeUI();
    }

    onCanPlay() {
        console.log('Audio listo para reproducir');
        this.songTitle.textContent = 'IPlay Radio - En vivo';
    }

    onPlaying() {
        console.log('Audio reproduciendo');
        this.songTitle.textContent = 'IPlay Radio - En vivo';
    }

    onError() {
        const err = this.audioPlayer.error;
        console.warn('Error de audio:', err?.code, err);
        this.songTitle.textContent = 'Reconectando audio…';
        this.scheduleReconnect();
    }

    onStalled() {
        console.warn('Stream estancado, intentando reconectar');
        this.scheduleReconnect();
    }

    onEnded() {
        console.warn('Stream terminado, intentando reconectar');
        this.scheduleReconnect();
    }

    // =============== NOW PLAYING ===============
    async fetchNowPlaying() {
        if (!NOWPLAYING_URL) return false;
        
        try {
            const response = await fetch(NOWPLAYING_URL, {
                method: 'GET',
                cache: 'no-store'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Buscar información de la canción en diferentes formatos de API
            let title = '';
            let artist = '';
            
            if (data.now_playing?.song) {
                title = data.now_playing.song.title || '';
                artist = data.now_playing.song.artist || '';
            } else if (data.playing_now?.song) {
                title = data.playing_now.song.title || '';
                artist = data.playing_now.song.artist || '';
            } else if (data.title) {
                title = data.title;
                artist = data.artist || '';
            }
            
            if (title || artist) {
                const displayText = artist ? `${title} — ${artist}` : title;
                this.songTitle.textContent = displayText;
                return true;
            }
            
        } catch (error) {
            console.warn('Error al obtener now playing:', error);
        }
        
        return false;
    }

    startNowPlayingPolling() {
        if (this.nowPlayingTimer) return;
        
        // Obtener información inmediatamente
        this.fetchNowPlaying();
        
        // Configurar polling cada 15 segundos
        this.nowPlayingTimer = setInterval(() => this.fetchNowPlaying(), 15000);
        console.log('Polling de now playing iniciado');
    }

    stopNowPlayingPolling() {
        if (this.nowPlayingTimer) {
            clearInterval(this.nowPlayingTimer);
            this.nowPlayingTimer = null;
            console.log('Polling de now playing detenido');
        }
    }

    // =============== RECONEXIÓN Y FALLBACK ===============
    setStream(url) {
        try {
            this.audioPlayer.src = url;
            this.audioPlayer.load();
            console.log(`Stream configurado: ${url}`);
        } catch (e) {
            console.warn('No se pudo asignar stream:', e);
        }
    }

    async tryPlayCurrent() {
        try {
            const p = this.audioPlayer.play();
            if (p && typeof p.then === 'function') await p;
            return true;
        } catch (e) {
            console.warn('Fallo al reproducir fuente actual:', e);
            return false;
        }
    }

    async failoverNextSource() {
        this.streamIndex = (this.streamIndex + 1) % STREAM_SOURCES.length;
        this.setStream(STREAM_SOURCES[this.streamIndex]);
        return this.tryPlayCurrent();
    }

    scheduleReconnect() {
        if (!this.isPlaying) return; // solo si el usuario quiso reproducir
        
        if (this.reconnectTimer) return;
        
        this.reconnectTimer = setTimeout(async () => {
            this.reconnectTimer = null;
            
            const ok = await this.tryPlayCurrent();
            if (!ok) {
                const switched = await this.failoverNextSource();
                if (!switched) {
                    this.reconnectDelay = Math.min(this.reconnectDelay * 1.7, 20000);
                    this.scheduleReconnect();
                } else {
                    this.reconnectDelay = 3000; // éxito: resetear
                }
            } else {
                this.reconnectDelay = 3000;
            }
        }, this.reconnectDelay);
    }

    // =============== CONTROL DE VOLUMEN ===============
    setupVolumeControl() {
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

        if (!ctrlCircle || !ctrlLineF) {
            console.warn('Elementos del control de volumen no encontrados');
            return;
        }

        // Configuración inicial
        const minX = 13;
        const maxX = 187;
        let currentX = minX + (maxX - minX) * this.audioPlayer.volume;
        let isDragging = false;
        let lastVolume = Math.max(0.2, this.audioPlayer.volume || 0.5);

        // Longitudes de los trazos
        const speakLen = speakF.getTotalLength();
        const arcBigLen = arcBigF.getTotalLength();
        const arcSmLen = arcSmF.getTotalLength();

        // Inicializar los dasharrays
        speakF.style.strokeDasharray = `${speakLen}`;
        arcBigF.style.strokeDasharray = `${arcBigLen}`;
        arcSmF.style.strokeDasharray = `${arcSmLen}`;

        // Función para actualizar UI del volumen
        this.updateVolumeUI = (volume = this.audioPlayer.volume) => {
            // Calcular posición X
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
                arcSmF.classList.remove('pulsing');
                arcBigF.classList.remove('pulsing');
            } else {
                // Volumen mayor a 0 - ocultar X
                crossLtRb.style.transform = 'scale(0)';
                crossLbRt.style.transform = 'scale(0)';
                speakF.style.opacity = '1';
                
                const smProgress = Math.max(0, Math.min(1, volume / 0.6));
                const bigProgress = Math.max(0, Math.min(1, (volume - 0.3) / 0.7));

                arcSmF.style.opacity = smProgress > 0 ? '1' : '0';
                arcSmF.style.strokeDasharray = `${arcSmLen * smProgress} ${arcSmLen * (1 - smProgress)}`;

                arcBigF.style.opacity = bigProgress > 0 ? '1' : '0';
                arcBigF.style.strokeDasharray = `${arcBigLen * bigProgress} ${arcBigLen * (1 - bigProgress)}`;

                // Activar pulso si está reproduciendo
                if (this.isPlaying) {
                    arcSmF.classList.add('pulsing');
                    arcBigF.classList.add('pulsing');
                    const speedFactor = 1 - 0.5 * Math.max(0, Math.min(1, volume));
                    arcSmF.style.animationDuration = `${(0.9 * speedFactor).toFixed(2)}s`;
                    arcBigF.style.animationDuration = `${(1.2 * speedFactor).toFixed(2)}s`;
                } else {
                    arcSmF.classList.remove('pulsing');
                    arcBigF.classList.remove('pulsing');
                    arcSmF.style.animationDuration = '';
                    arcBigF.style.animationDuration = '';
                }
            }
        };

        // Inicializar con el volumen actual
        this.updateVolumeUI();

        const setVolumeFromPosition = (clientX) => {
            const rect = ctrlLineB.getBoundingClientRect();
            const x = clientX - rect.left;
            const clampedX = Math.max(0, Math.min(rect.width, x));
            const volume = clampedX / rect.width;
            this.audioPlayer.volume = volume;
            this.updateVolumeUI(volume);
            if (volume > 0) {
                lastVolume = volume;
            }
            return volume;
        };

        const doDrag = (e) => {
            if (!isDragging) return;
            setVolumeFromPosition(e.clientX);
        };

        const stopDrag = () => {
            isDragging = false;
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
        };

        const startDrag = (e) => {
            isDragging = true;
            e.preventDefault();
            document.addEventListener('mousemove', doDrag);
            document.addEventListener('mouseup', stopDrag);
            setVolumeFromPosition(e.clientX);
        };

        const handleTrackDown = (e) => {
            startDrag(e);
        };

        const adjustVolume = (delta) => {
            const next = Math.max(0, Math.min(1, this.audioPlayer.volume + delta));
            this.audioPlayer.volume = next;
            this.updateVolumeUI(next);
            if (next > 0) {
                lastVolume = next;
            }
        };

        // Eventos para arrastrar el control
        ctrlCircle.addEventListener('mousedown', startDrag);
        ctrlLineB.addEventListener('mousedown', handleTrackDown);
        ctrlLineF.addEventListener('mousedown', handleTrackDown);

        if (volumeSvg) {
            volumeSvg.addEventListener('wheel', (e) => {
                e.preventDefault();
                const direction = e.deltaY < 0 ? 1 : -1;
                adjustVolume(direction * 0.05);
            }, { passive: false });
        }

        // Click en el ícono del parlante para mutear/restaurar
        if (speakerSvg) {
            speakerSvg.addEventListener('click', () => {
                if (this.audioPlayer.volume > 0) {
                    lastVolume = this.audioPlayer.volume;
                    this.audioPlayer.volume = 0;
                } else {
                    this.audioPlayer.volume = Math.max(0.05, lastVolume);
                }
                this.updateVolumeUI();
            });
        }

        // Sincronizar cuando se cambie el volumen desde otros controles
        this.audioPlayer.addEventListener('volumechange', () => {
            if (!isDragging) {
                this.updateVolumeUI();
            }
            if (this.audioPlayer.volume > 0) {
                lastVolume = this.audioPlayer.volume;
            }
        });
    }
}

// =============== INICIALIZACIÓN ===============
// Crear instancia global
window.RadioPlayer = RadioPlayer;

// Auto-inicializar si no se hace manualmente
if (typeof window !== 'undefined') {
    // Pequeño delay para asegurar que el DOM esté listo
    setTimeout(() => {
        if (!window.radioPlayerInstance) {
            window.radioPlayerInstance = new RadioPlayer();
        }
    }, 100);
}
