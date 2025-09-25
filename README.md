# Photography Portfolio - Professional Website

A professional photography portfolio website built as a static web application using vanilla HTML5, CSS3, and JavaScript (ES6+). The project showcases photography through an intelligent masonry gallery layout with AI-powered categorization and is designed for deployment on static hosting services like Cloudflare Pages.

## 🚀 Quick Start

### Local Development
```bash
# Serve locally (Python 3)
python3 -m http.server 8080
# Access at http://localhost:8080
```

### Photo Management
```bash
cd scripts
./import.sh [album-name]     # Add/process new photos
./import.sh --sync          # Sync renamed album directories
./import.sh --cleanup       # Remove orphaned entries
./sync.sh --dry-run         # Preview directory sync changes
```

## 📁 Project Structure

```
photography-portfolio/
├── assets/
│   ├── css/             # Modular stylesheets
│   ├── js/              # ES6 modules
│   └── images/          # Processed photos
│       ├── albums/      # Source album directories
│       ├── thumbnails/  # WebP thumbnails
│       └── full/        # Optimized full-size images
├── data/
│   └── albums.json      # Central metadata store
├── scripts/             # Photo processing tools
└── *.html               # Website pages
```

## 🎨 Features

### Intelligent Gallery System
- **AI-Powered Categorization**: 7 smart filter categories (Maritime, Golden Hour, Candid, Action, Nature, Events, Portraits)
- **Advanced Masonry Layout**: Landscape images automatically span 2 columns on desktop for enhanced visual impact
- **Responsive Design**: 1-5 columns based on screen size with mobile-optimized navigation
- **Album Timeline**: Chronological sidebar showing all albums with photo counts
- **Professional Hover Effects**: Clean album name display without technical filenames

### Enhanced User Experience
- **Click-to-Navigate**: Images link directly to their album pages
- **Tag-Based Filtering**: AI-powered category system with intuitive controls
- **Mobile Responsive**: Touch-friendly interface with hamburger menu and collapsible filters
- **Sharp Modern Design**: Black hover effects with Futura-style typography and sharp rectangles
- **Accessibility-First**: Comprehensive alt-text and screen reader support

### Technical Excellence
- **WebP Optimization**: Modern image format with JPEG fallbacks
- **Lazy Loading**: Intersection Observer-based performance optimization
- **Hardware Acceleration**: CSS3 animations and transforms
- **SEO Optimized**: JSON-LD structured data and complete sitemap
- **CDN Ready**: Optimized for Cloudflare Pages deployment

## 🤖 AI-Powered Photo Analysis

### Automatic Categorization System
The system uses advanced AI analysis to automatically categorize photos into 7 intelligent categories:

- **Maritime**: Sailing, boats, marina photography (AI detects water vessels, sailing scenes)
- **Golden Hour**: Sunset/sunrise lighting conditions (AI analyzes warm tones, lighting quality)
- **Candid**: Documentary style, authentic moments (AI identifies unposed subjects)
- **Action**: Sports, motion, dynamic shots (AI detects movement, shallow depth of field)
- **Nature**: Landscapes, wildlife, natural environments
- **Events**: Weddings, celebrations, formal gatherings
- **Portraits**: Individual and group photography

### Scene Analysis & Accessibility
- **Detailed Technical Analysis**: Lighting conditions, composition, camera angle, mood assessment
- **Automatic Alt-Text**: AI-generated descriptive text for screen readers
- **Professional Metadata**: Camera settings, lens data, technical specifications
- **Geographic Integration**: Location and timezone handling for accurate timestamps

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript (no frameworks or build process)
- **Image Processing**: Node.js with Sharp library for optimization and WebP conversion
- **AI Analysis**: Integrated Ollama for photo analysis and automatic tagging
- **Data Storage**: JSON-based metadata with comprehensive image information
- **CSS Architecture**: Advanced masonry layout with responsive landscape image handling
- **Routing**: Cloudflare Pages compatible with `_redirects` configuration file

### CSS Architecture Pattern
The project uses an advanced JavaScript-powered masonry layout system:
- **Intelligent Positioning**: Smart algorithm handles multi-column items and landscape image enhancement
- **Landscape Enhancement**: Automatic 2-column span for landscape images on desktop (≥769px)
- **Aspect Ratio Preservation**: Natural image proportions maintained throughout scaling
- **CSS Variables**: Comprehensive theming system with modular, responsive design
- **Modern Typography**: Futura PT font family with professional letter-spacing and weights

### JavaScript Architecture Pattern
Built with pure ES6+ modules using direct browser imports:
- **No Build Process**: JavaScript runs directly in browser without bundling or compilation
- **Modular Design**: Separate modules for gallery, masonry, timeline, mobile menu, and album loading
- **Smart Positioning Algorithm**: Advanced masonry system handles multi-column item placement
- **Tag-Based Filtering**: AI-powered category system with smooth transitions and state management
- **Professional Interactions**: Timeline navigation, mobile responsiveness, and accessibility features

## 📸 Photo Management System

### Album Structure & Metadata
Photos are organized in `data/albums.json` with comprehensive metadata including:
- **Image Paths**: WebP format with JPEG fallbacks for maximum compatibility
- **Technical Data**: Camera settings, lens information, capture dates, dimensions
- **AI Analysis**: Multiple tags per photo, accessibility alt-text, detailed scene analysis
- **Professional Organization**: Chronological sorting, batch processing, unique ID generation
- **Smart Categorization**: Content-based automatic tagging across 7 categories

### Enhanced Image Processing Pipeline
1. **Source Management**: Photos placed in designated album directories under `assets/images/albums/`
2. **Automated Processing**: `./scripts/import.sh` handles Sharp-based optimization and AI analysis
3. **AI Integration**: Automatic scene analysis, accessibility alt-text generation, and categorization
4. **Content Analysis**: Lighting assessment, composition analysis, mood detection, and technical evaluation
5. **Optimization**: WebP format conversion, thumbnail generation, and progressive loading preparation
6. **Metadata Integration**: EXIF data extraction, geographic location handling, and timezone processing
7. **JSON Updates**: Comprehensive metadata storage with AI tags, technical specifications, and accessibility data

### Directory Sync System
Advanced directory synchronization handles album management:
- **Automatic Detection**: Identifies when album directories are renamed in Finder
- **Smart Matching**: Uses similarity algorithms to match renamed directories with JSON entries
- **Path Updates**: Automatically updates all image paths, thumbnails, and full-size image references
- **Metadata Preservation**: Maintains all AI analysis, tags, technical data, and accessibility information
- **Dry Run Mode**: Preview changes before applying them to ensure data integrity

## 🔧 Advanced Features

### Intelligent Masonry Layout System
- **Responsive Columns**: 1-5 columns automatically adjust based on screen size and device capabilities
- **Landscape Enhancement**: Automatic 2-column span for landscape-oriented images on desktop displays
- **Smart Positioning**: Advanced algorithm optimally places multi-column items for visual balance
- **Aspect Ratio Intelligence**: Natural image proportions preserved while maintaining grid alignment
- **Performance Optimized**: Efficient DOM manipulation and smooth scrolling with hardware acceleration

### Enhanced Navigation & User Experience
- **Albums Timeline**: Chronological sidebar component displaying all albums with photo counts and dates
- **Intuitive Click Navigation**: Images serve as direct links to their respective album pages
- **Advanced Filtering**: AI-powered category system with 7 distinct filter options and smooth transitions
- **Professional Presentation**: Clean hover states displaying only album names, no technical filenames
- **Mobile Excellence**: Touch-optimized interface with collapsible filters and gesture-friendly navigation

### Gallery Interaction Patterns
- **Smart Image Sizing**: Landscape images receive prominent 2-column display treatment for maximum impact
- **Timeline Navigation**: Quick access to all albums through chronological organization
- **Professional Polish**: Sophisticated hover effects and transitions without overwhelming technical details
- **Accessibility Focus**: Comprehensive keyboard navigation, screen reader support, and semantic markup
- **Mobile Responsive**: Hamburger menu, full-screen overlays, and touch-friendly button sizing

## 🛠️ Dependencies & Requirements

### Node.js Dependencies (scripts/package.json)
- **Sharp ^0.33.0**: High-performance image processing and optimization library
- **ExifTool-vendored**: EXIF data extraction, camera settings, and timezone handling
- **@photostructure/tz-lookup**: Geographic timezone detection and location processing
- **Luxon**: Advanced date/time handling, formatting, and timezone management
- **Ollama**: AI model integration for sophisticated photo analysis and categorization
- **ESLint ^8.0.0**: Code quality assurance and style consistency (development dependency)

### System Requirements
- **Node.js**: Version ^18.17.0 || ^20.3.0 || >=21.0.0
- **Python 3**: For local development server
- **Modern Browser**: ES6+ support required for client-side functionality

## 🚀 SEO & Performance Features

### Search Engine Optimization
- **JSON-LD Structured Data**: Enhanced image galleries with comprehensive metadata for search engines
- **Complete Sitemap**: XML sitemap with image references, categorization, and update frequencies
- **Semantic HTML**: Proper heading hierarchy, alt attributes, and accessibility markup
- **Meta Tags**: Comprehensive OpenGraph, Twitter Cards, and standard meta tag implementation

### Performance Optimization
- **WebP Format**: Modern image format with automatic JPEG fallbacks for older browsers
- **Lazy Loading**: Intersection Observer-based image loading for improved initial page load
- **Hardware Acceleration**: CSS3 transforms and animations utilizing GPU acceleration
- **Efficient Masonry**: Advanced positioning algorithm minimizes layout recalculation
- **CDN Optimization**: Static asset organization optimized for content delivery networks

## 🌐 Deployment & Routing

### Cloudflare Pages Configuration
- **Static Hosting**: Fully optimized for Cloudflare Pages deployment with zero server requirements
- **URL Routing**: `_redirects` file provides SPA-style album navigation without server-side processing
- **Build Compatibility**: No build process required - direct deployment of source files
- **Performance Enhancement**: CDN optimization with automatic image compression and caching

### URL Structure & Routing Patterns
- **Main Gallery**: `/` - Primary gallery interface with comprehensive tag filtering
- **Album Pages**: `/album.html?id=[album-key]` - Individual album displays with full metadata
- **About Page**: `/about.html` - Photographer information and professional background
- **Contact Form**: `/contact.html` - Professional contact interface with validation

### Album URL Examples
Albums utilize key-based routing for clean, semantic URLs:
- `Mills Race 2023` → `/album.html?id=Mills%20Race%202023`
- `nature` → `/album.html?id=nature`
- `portraits` → `/album.html?id=portraits`

## 🧠 Key Integrations

### AI Photo Analysis System
- **Scene Analysis**: Comprehensive technical and compositional analysis of each photograph
- **Automatic Tagging**: Intelligent content-based category assignment across multiple dimensions
- **Accessibility Integration**: Automatic generation of descriptive alt-text for screen readers
- **Quality Assessment**: Advanced evaluation of lighting conditions, composition, and artistic mood

### Professional Photography Features
- **EXIF Integration**: Complete camera settings extraction including lens data and technical metadata
- **Geographic Data**: Location information processing with accurate timezone handling
- **Professional Metadata**: Capture dates, processing information, and technical specifications
- **Portfolio Organization**: Sophisticated chronological and categorical organization systems

## 🔄 Workflow Examples

### Adding New Photos
1. **Organize**: Place photos in `assets/images/albums/[album-name]/`
2. **Process**: Run `./scripts/import.sh [album-name]`
3. **AI Analysis**: Automatic categorization, alt-text generation, and metadata extraction
4. **Optimization**: WebP conversion, thumbnail generation, and JSON updates
5. **Deploy**: Static files ready for immediate deployment

### Managing Album Names
1. **Rename**: Change album directory name in Finder
2. **Sync**: Run `./scripts/sync.sh` to update JSON references
3. **Verify**: Use `--dry-run` flag to preview changes before applying
4. **Deploy**: Updated paths and metadata automatically synchronized

This architecture supports a professional photography portfolio with intelligent categorization, enhanced user experience, scalable content management, and enterprise-ready deployment capabilities.

## License

© 2024 Mitchell Carter. All rights reserved.