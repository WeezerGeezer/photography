# Assets Directory - Frontend Resources

Static assets for the photography portfolio website including stylesheets, JavaScript modules, and processed images.

## Structure

### CSS Architecture (`css/`)
- **main.css**: Core styles, CSS variables, sidebar navigation with Futura fonts
- **gallery.css**: Masonry layout, timeline, filter buttons, lightbox components
- **responsive.css**: Mobile breakpoints, hamburger menu, touch interactions
- **contact-form.css**: Form styling and validation states

### JavaScript Modules (`js/`)
- **gallery.js**: Main gallery with tag filtering, infinite scroll, image loading
- **masonry.js**: Advanced positioning algorithm, landscape 2-column spanning
- **album-loader.js**: Individual album pages, lightbox, metadata display
- **timeline.js**: Chronological album sidebar with photo counts
- **mobile-menu.js**: Hamburger menu, overlay, filter synchronization

### Image Assets (`images/`)
- **albums/**: Source photo directories organized by album name
- **thumbnails/**: WebP optimized thumbnails (800px wide, 85% quality)
- **full/**: WebP full-size images (2000px wide, 90% quality)

## Key Features

### CSS Patterns
- **CSS Variables**: Centralized theming system in `:root`
- **Masonry Layout**: JavaScript-powered with responsive column counts (1-5)
- **Sharp Design**: Black hover effects, Futura typography, rectangular shapes
- **Mobile-First**: Progressive enhancement with sidebar → hamburger menu

### JavaScript Architecture
- **ES6+ Modules**: Direct browser imports, no build process required
- **Event-Driven**: Custom events for filter changes, mobile menu interactions
- **Performance**: Intersection observers, lazy loading, smooth animations
- **Accessibility**: Keyboard navigation, screen reader support, semantic markup

Images are processed by scripts/ directory tools and organized automatically. All JavaScript modules are standalone and work together through clean interfaces and custom events.