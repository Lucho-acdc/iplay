# Sistema de Noticias IPlay Radio - Documentación

## 📰 Características Implementadas

### ✅ Sistema de Noticias RSS → JSON
- **Fuentes RSS**: Google News con feeds específicos para Zárate y noticias generales
- **Conversión**: RSS a JSON usando rss2json.com (gratuito)
- **Cache Local**: localStorage con TTL de 10 minutos
- **Fallback**: Sistema de respaldo si las fuentes fallan
- **Lazy Loading**: Carga diferida de imágenes de noticias

### ✅ Reproductor de Radio Mejorado
- **Múltiples Fuentes**: Fallback automático entre streams
- **Now Playing**: Polling cada 15 segundos para información de canciones
- **Reconexión**: Automática en caso de errores
- **Control de Volumen**: Visual con animaciones

## 🚀 Archivos Creados/Modificados

### Nuevos Archivos
- `js/news.js` - Sistema completo de noticias RSS
- `js/player.js` - Reproductor de radio mejorado
- `README_NOTICIAS.md` - Esta documentación

### Archivos Modificados
- `IplayPrueba.html` - Incluye los nuevos scripts
- `js/scriptPrueba.js` - Limpiado, mantiene fallbacks
- `css/stylePrueba.css` - Estilos para imágenes de noticias

## ⚙️ Configuración

### Feeds RSS Configurados
```javascript
const RSS_FEEDS = {
    zarate: [
        'https://news.google.com/rss/search?q=Zárate+Argentina&hl=es-419&gl=AR&ceid=AR:es-419',
        'https://news.google.com/rss/search?q=Z%C3%A1rate+Buenos+Aires&hl=es-419&gl=AR&ceid=AR:es-419'
    ],
    general: [
        'https://news.google.com/rss?hl=es-419&gl=AR&ceid=AR:es-419',
        'https://news.google.com/rss/headlines/section/topic/NATION?hl=es-419&gl=AR&ceid=AR:es-419'
    ],
    deportes: [
        'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=es-419&gl=AR&ceid=AR:es-419'
    ],
    espectaculos: [
        'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=es-419&gl=AR&ceid=AR:es-419'
    ]
};
```

### Configuración del Reproductor
```javascript
const STREAM_URL = 'https://168.90.252.40/listen/intelinet_play/stream';
const NOWPLAYING_URL = 'https://168.90.252.40/api/nowplaying/intelinet_play';
const STREAM_SOURCES = [
    'https://168.90.252.40/listen/intelinet_play/stream',
    'http://168.90.252.40/listen/intelinet_play/stream' // fallback HTTP
];
```

## 🔧 Cómo Agregar/Quitar Feeds

### Para Agregar un Nuevo Feed RSS:
1. Abrir `js/news.js`
2. Buscar la constante `RSS_FEEDS`
3. Agregar la URL del feed en la categoría deseada:

```javascript
const RSS_FEEDS = {
    // ... feeds existentes ...
    nueva_categoria: [
        'https://ejemplo.com/rss/feed.xml',
        'https://otro-ejemplo.com/rss.xml'
    ]
};
```

### Para Cambiar la URL del Stream:
1. Abrir `js/player.js`
2. Modificar las constantes al inicio del archivo:

```javascript
const STREAM_URL = 'tu_nueva_url_de_stream';
const NOWPLAYING_URL = 'tu_url_de_now_playing';
```

## 📱 Funcionalidades

### Sistema de Noticias
- **Prioridad Zárate**: Las noticias de Zárate aparecen primero
- **Cache Inteligente**: Guarda noticias por 10 minutos para mejor rendimiento
- **Fallback Robusto**: Si una fuente falla, usa las demás
- **Lazy Loading**: Las imágenes se cargan solo cuando son visibles
- **Responsive**: Se adapta a móviles y desktop

### Reproductor de Radio
- **Auto-reconexión**: Se reconecta automáticamente si se pierde la conexión
- **Múltiples Fuentes**: Cambia automáticamente entre streams si uno falla
- **Now Playing**: Muestra la canción actual cada 15 segundos
- **Control Visual**: Volumen con animaciones y efectos visuales

## 🐛 Manejo de Errores

### Noticias
- Si rss2json falla → usa cache local
- Si cache expirado → muestra noticias de emergencia
- Si imagen no carga → se oculta automáticamente

### Reproductor
- Si stream falla → intenta siguiente fuente
- Si todas fallan → programa reconexión con delay progresivo
- Si now playing falla → muestra texto por defecto

## 📊 Rendimiento

### Optimizaciones Implementadas
- **Cache Local**: Reduce peticiones a APIs externas
- **Lazy Loading**: Las imágenes se cargan solo cuando son necesarias
- **Pre-carga**: Otras categorías se cargan en background
- **Debounce**: Evita peticiones excesivas
- **Fragmentos DOM**: Renderizado eficiente de noticias

### Límites de API
- **rss2json**: Gratuito con límites (verificar en su sitio web)
- **Google News**: Sin límites conocidos
- **Cache**: 10 minutos TTL para balancear frescura y rendimiento

## 🔄 Actualizaciones Futuras

### Posibles Mejoras
1. **Más Fuentes RSS**: Agregar feeds de medios locales de Zárate
2. **Filtros Avanzados**: Por fecha, fuente, palabras clave
3. **Notificaciones**: Push notifications para noticias importantes
4. **Modo Offline**: PWA con service workers
5. **Analytics**: Tracking de noticias más leídas

### Mantenimiento
- **Monitoreo**: Verificar que rss2json siga funcionando
- **Feeds**: Actualizar URLs si cambian
- **Cache**: Limpiar localStorage periódicamente si es necesario

## 📞 Soporte

Si necesitas ayuda o encuentras problemas:
1. Revisar la consola del navegador para errores
2. Verificar que las URLs de feeds RSS estén activas
3. Comprobar que rss2json.com esté funcionando
4. Limpiar cache del navegador si hay problemas de carga

---

**Desarrollado para IPlay Radio** 🎵
*Sistema de noticias RSS con prioridad en Zárate y reproductor de radio mejorado*
