# CLAUDE.md

Professional photography portfolio website built with vanilla HTML5, CSS3, and JavaScript. Features AI-powered photo categorization and advanced masonry gallery layout.

## Development Commands

### Running Locally
```bash
python3 -m http.server 8080  # Serve at http://localhost:8080
```

### Photo Management
```bash
cd scripts
./import.sh [album-name]     # Add/process photos
./import.sh --sync          # Sync renamed directories
./import.sh --cleanup       # Remove orphaned entries
```

## Architecture

**Stack**: Vanilla HTML/CSS/JS, Node.js + Sharp for processing, JSON data storage
**Deployment**: Cloudflare Pages static hosting with `_redirects` routing

### Key Files
- **Pages**: `index.html`, `album.html`, `about.html`, `contact.html`
- **Styles**: `assets/css/` - Modular CSS with masonry layout
- **Scripts**: `assets/js/` - ES6 modules (gallery, masonry, timeline, mobile-menu)
- **Data**: `data/albums.json` - Central metadata with AI tags
- **Tools**: `scripts/` - Photo import and AI analysis utilities

### CSS Features
- JavaScript masonry layout with 2-column landscape image spanning
- CSS Variables, responsive design (1-5 columns)
- Sharp rectangles with black hover effects using Futura-style fonts

### JavaScript Patterns
- ES6+ modules, no build process required
- Tag-based filtering with 7 AI categories
- Timeline sidebar, album navigation, mobile responsive

## Photo System

### AI Categories (7 filters)
**Maritime**, **Golden Hour**, **Candid**, **Action**, **Nature**, **Events**, **Portraits**

### Processing Pipeline
1. Place photos in album directories
2. Run `./import.sh` - Sharp optimization + AI analysis
3. Generates WebP + thumbnails, updates JSON with tags/metadata
4. Albums accessible at `/album.html?id=[album-key]`

### Directory Sync
- Rename folders in Finder → Run `./sync.sh` to update JSON paths
- Detects renames, updates all image paths automatically

## Dependencies
**Node.js**: Sharp, ExifTool, Ollama (AI), Luxon (dates)
**Requires**: Node.js ^18.17.0 || ^20.3.0 || >=21.0.0

## Admin Panel (WIP)
- **URL**: `/admin.html`
- **Backend**: Cloudflare Pages Functions in `functions/api/`
- **Auth**: Requires `ADMIN_PASSWORD` and `ADMIN_SECRET` secrets in Cloudflare Pages
- **Status**: Authentication not yet working (env vars not being read by Functions)

## Recent Changes (Nov 2025)
- Timeline redesigned with collapsible year sections
- Filter UI hidden (logic preserved)
- Gallery hover text always white (fixed dark mode issue)
- Sidebar updated: removed About/Contact nav, added contact info text
- Import script now uploads to R2 automatically (requires `.env` config)
- R2 public URL: `https://pub-5824bb858aa94e4b8c091ec16ed5c3c0.r2.dev`