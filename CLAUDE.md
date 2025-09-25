# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a professional photography portfolio website built as a static web application using vanilla HTML5, CSS3, and JavaScript (ES6+). The project showcases photography through an intelligent masonry gallery layout with AI-powered categorization and is designed for deployment on Cloudflare Pages.

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

The import script automatically optimizes images, creates WebP versions, generates thumbnails, applies AI analysis for categorization, and updates the albums.json configuration.

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
- **AI Analysis**: Integrated photo analysis for automatic tagging
- **Data Storage**: JSON-based metadata in `data/albums.json` with AI-generated tags
- **CSS Architecture**: Advanced masonry layout with responsive landscape image handling
- **Routing**: Cloudflare Pages compatible with `_redirects` configuration

### Key Files Structure
- **Pages**: `index.html` (gallery), `about.html`, `contact.html`, `album.html`
- **Styles**: `assets/css/` - 4 modular CSS files (main, gallery, responsive, contact-form)
- **Scripts**: `assets/js/` - 6 ES6 modules (gallery, masonry, album-loader, contact-form, mobile-menu, timeline)
- **Configuration**: `data/albums.json` - Central metadata store with AI tags
- **Routing**: `_redirects` - Cloudflare Pages routing configuration
- **Tools**: `scripts/` - Photo import, AI analysis, and processing utilities

### CSS Architecture Pattern
Advanced JavaScript-powered masonry layout with intelligent landscape image handling. Landscape images automatically span 2 columns on desktop (≥769px) for enhanced visual impact. CSS Variables for theming, modular responsive design.

### JavaScript Architecture Pattern
Pure ES6+ modules with direct browser imports (no bundling). Smart masonry positioning algorithm handles multi-column items. Tag-based filtering system powered by AI analysis.

## Photo Management System

### Album Structure & AI Tagging
Photos are organized in `data/albums.json` with comprehensive metadata including:
- Image paths (WebP + JPEG fallbacks)
- Titles, dates, dimensions, technical camera data
- AI-powered categorization with multiple tags per photo
- Accessibility alt-text and detailed scene analysis
- Smart album categorization (Maritime, Golden Hour, Candid, Action, Nature, Events, Portraits)

### Enhanced Image Processing Pipeline
1. Source photos placed in designated directory
2. `./scripts/import.sh` processes images via Sharp
3. AI analysis generates accessibility alt-text and scene descriptions
4. Automatic categorization based on content, lighting, and composition
5. WebP optimization and thumbnail generation
6. Updates albums.json with AI tags and metadata
7. Maintains consistent naming with unique IDs

### AI-Powered Category System
**7 Intelligent Filter Categories:**
- **Maritime**: Sailing, boats, marina photography (AI detects water vessels, sailing scenes)
- **Golden Hour**: Sunset/sunrise lighting conditions (AI analyzes warm tones, lighting quality)
- **Candid**: Documentary style, authentic moments (AI identifies unposed subjects)
- **Action**: Sports, motion, dynamic shots (AI detects movement, shallow DoF)
- **Nature**: Landscapes, wildlife, natural environments
- **Events**: Weddings, celebrations, formal gatherings
- **Portraits**: Individual and group photography

## Advanced Features

### Intelligent Masonry Layout
- **Responsive Design**: 1-5 columns based on screen size
- **Landscape Enhancement**: Automatic 2-column span for landscape images on desktop
- **Smart Positioning**: Advanced algorithm handles multi-column item placement
- **Aspect Ratio Preservation**: Natural image proportions maintained

### Enhanced Navigation & UX
- **Albums Timeline**: Chronological sidebar component showing all albums with photo counts
- **Click-to-Navigate**: Images link directly to their album pages
- **Tag-Based Filtering**: AI-powered category system with 7 filter options
- **Album Name Display**: Hover shows album name only (no technical filenames)

### Gallery Interaction Patterns
- **Smart Image Sizing**: Landscape images get prominent display treatment
- **Intuitive Navigation**: Timeline provides quick album access
- **Professional Presentation**: Clean hover states without technical details
- **Mobile Responsive**: Touch-friendly interface with collapsible filters

## Node.js Dependencies

Located in `scripts/package.json`:
- **Sharp ^0.33.0**: Image processing and optimization
- **ExifTool-vendored**: EXIF data extraction and timezone handling
- **@photostructure/tz-lookup**: Geographic timezone detection
- **Luxon**: Date/time handling and formatting
- **Ollama**: AI model integration for photo analysis
- **ESLint ^8.0.0**: Code quality (dev dependency)
- **Node.js**: Requires ^18.17.0 || ^20.3.0 || >=21.0.0

## SEO & Performance Features

- JSON-LD structured data for enhanced image galleries
- Complete sitemap.xml with image references and categorization
- WebP format with JPEG fallbacks for optimal performance
- Hardware-accelerated CSS animations
- Advanced masonry layout with efficient positioning
- Lazy loading with intersection observers
- Accessibility-first design with comprehensive alt-text

## Deployment & Routing

### Cloudflare Pages Configuration
- **Static Hosting**: Optimized for Cloudflare Pages deployment
- **URL Routing**: `_redirects` file handles SPA-style album navigation
- **Build Compatibility**: No server-side processing required
- **Performance**: CDN-optimized with automatic image optimization

### Routing Patterns
- `/` - Main gallery with tag filtering
- `/album.html?id=[album-key]` - Individual album pages
- `/about.html` - Photographer information
- `/contact.html` - Contact form

### Album URL Structure
Albums use key-based routing:
- `Mills Race 2023` → `/album.html?id=Mills%20Race%202023`
- `nature` → `/album.html?id=nature`
- `portraits` → `/album.html?id=portraits`

## Key Integrations

### AI Photo Analysis
- **Scene Analysis**: Detailed technical and compositional analysis
- **Automatic Tagging**: Content-based category assignment
- **Accessibility**: Auto-generated descriptive alt-text
- **Quality Assessment**: Lighting, composition, and mood analysis

### Professional Photography Features
- **EXIF Integration**: Camera settings, lens data, technical metadata
- **Geographic Data**: Location and timezone handling
- **Professional Metadata**: Capture dates, processing information
- **Portfolio Organization**: Chronological and categorical organization

This architecture supports a professional photography portfolio with intelligent categorization, enhanced user experience, and scalable content management.