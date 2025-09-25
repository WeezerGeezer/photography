# JavaScript Directory - Frontend Modules

ES6+ JavaScript modules for the photography portfolio with no build process required.

## Module Architecture

### Core Gallery System
- **gallery.js**: Main gallery with tag filtering, infinite scroll, masonry initialization
- **masonry.js**: Advanced positioning algorithm with landscape 2-column spanning
- **album-loader.js**: Individual album pages, lightbox functionality, metadata display

### Navigation & UX
- **timeline.js**: Chronological album sidebar, fetches albums.json, date sorting
- **mobile-menu.js**: Hamburger menu, overlay controls, filter synchronization

## Key Patterns

### ES6 Module Structure
```javascript
// Direct browser imports, no bundling
import MasonryLayout from './masonry.js';

// Self-contained modules with DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Module logic here
});
```

### Advanced Masonry Algorithm
- **Intelligent Positioning**: Multi-column item placement with collision detection
- **Landscape Detection**: `img.naturalWidth > img.naturalHeight` triggers 2-column span
- **Performance Optimized**: `requestAnimationFrame` for smooth layouts
- **Responsive**: Column count adapts from 1-5 based on screen width

### Event-Driven Architecture
- **Custom Events**: `filterChange` event for cross-module communication
- **State Management**: Gallery state, filter state, mobile menu state
- **Touch Interactions**: Swipe navigation, touch-friendly controls

### Image Loading Strategy
- **Lazy Loading**: Intersection Observer API for performance
- **WebP Support**: `<picture>` elements with JPEG fallbacks
- **Progressive Enhancement**: Images load with fade-in transitions
- **Error Handling**: Graceful degradation for failed image loads

All modules work together through clean interfaces and custom events. No external dependencies or build tools required - runs directly in modern browsers with ES6+ support.