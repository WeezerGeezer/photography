# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a professional photography portfolio website built as a static web application using vanilla HTML5, CSS3, and JavaScript (ES6+). The project showcases photography through a responsive masonry gallery layout and is designed for deployment on static hosting services.

## Development Commands

### Running the Application
```bash
# Serve locally (Python 3)
python3 -m http.server 8080
# Access at http://localhost:8080
```

### Adding New Photos
```bash
cd scripts
./import.sh [album-name]
```

The import script automatically optimizes images, creates WebP versions, generates thumbnails, and updates the albums.json configuration.

### Build Tools
```bash
# In scripts/ directory
npm install              # Install Sharp and other dependencies
npm run import          # Run photo import script directly
```

## Architecture

### Technology Stack
- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript (no frameworks)
- **Image Processing**: Node.js with Sharp library for optimization
- **Data Storage**: JSON-based metadata in `data/albums.json`
- **CSS Architecture**: Modular CSS with CSS Variables and Multi-column layout (not CSS Grid)

### Key Files Structure
- **Pages**: `index.html` (gallery), `about.html`, `contact.html`, `album.html`
- **Styles**: `assets/css/` - 4 modular CSS files (main, gallery, responsive, contact-form)
- **Scripts**: `assets/js/` - 5 ES6 modules (gallery, masonry, album-loader, contact-form, mobile-menu)
- **Configuration**: `data/albums.json` - Central metadata store for all photos
- **Tools**: `scripts/` - Photo import and processing utilities

### CSS Architecture Pattern
Uses CSS Multi-column layout for masonry effect (not CSS Grid). CSS Variables defined in `:root` for theming. Modular approach with separate files for different concerns.

### JavaScript Architecture Pattern
Pure ES6+ modules with direct browser imports (no bundling). Each module handles specific functionality. No build process required - JavaScript runs directly in browser.

## Photo Management System

### Album Structure
Photos are organized in `data/albums.json` with metadata including:
- Image paths (WebP + JPEG fallbacks)
- Titles, dates, dimensions
- Album categorization (nature, portraits, events)
- Unique IDs and batch handling

### Image Processing Pipeline
1. Source photos placed in designated directory
2. `./scripts/import.sh` processes images via Sharp
3. Generates WebP versions and thumbnails automatically
4. Updates albums.json with new metadata
5. Maintains consistent file naming conventions

## Important Patterns

### Masonry Gallery Implementation
Uses CSS Multi-column layout (`column-count`, `column-gap`) rather than JavaScript-based masonry. Responsive breakpoints handle 1-5 columns based on screen size.

### Image Loading Strategy
WebP images with JPEG fallbacks using `<picture>` elements. Lazy loading implemented for performance. Lightbox functionality with keyboard navigation.

### Contact Form System
Mailto-based contact form with client-side validation. Fallback modal with copy-to-clipboard functionality if email client unavailable.

## Node.js Dependencies

Located in `scripts/package.json`:
- **Sharp ^0.33.0**: Image processing and optimization
- **ESLint ^8.0.0**: Code quality (dev dependency)
- **Node.js**: Requires ^18.17.0 || ^20.3.0 || >=21.0.0

## SEO & Performance Features

- JSON-LD structured data for image galleries
- Complete sitemap.xml with image references
- WebP format with JPEG fallbacks
- Hardware-accelerated CSS animations
- CSS-only masonry layout (no JavaScript calculations)

## Deployment

Configured for static hosting (Cloudflare Pages). No server-side processing required. All files can be served statically.