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
- **Data**: R2 `data/albums.json` - Central metadata with AI tags (single source of truth)
- **Data (local)**: `data/albums.json` - Backup/reference copy (not used by live site)
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
1. Place photos in `assets/images/albums/[album-name]/` directory
2. Run `./import.sh [album-name]` - Sharp optimization + AI analysis
3. Generates WebP + thumbnails, updates JSON with tags/metadata
4. Albums accessible at `/album.html?id=[album-key]`

**IMPORTANT**: Source album photos are always in `~/Documents/Github/photography-portfolio-standalone/assets/images/albums/[album-name]/`

### Directory Sync
- Rename folders in Finder → Run `./sync.sh` to update JSON paths
- Detects renames, updates all image paths automatically

## Dependencies
**Node.js**: Sharp, ExifTool, Ollama (AI), Luxon (dates)
**Requires**: Node.js ^18.17.0 || ^20.3.0 || >=21.0.0

## Data Architecture

### R2 as Single Source of Truth (Nov 2025)
All frontend pages fetch album data from R2 instead of static files:
- **R2 URL**: `https://pub-5824bb858aa94e4b8c091ec16ed5c3c0.r2.dev/data/albums.json`
- **CORS Enabled**: Allow all origins, GET/HEAD methods, 24hr cache
- **Benefits**: Admin uploads appear instantly, no git sync required

### Data Flow
```
Photo Upload (Admin) → R2 albums.json
                          ↓
    ┌─────────────────────┴─────────────────────┐
    ↓                     ↓                     ↓
Gallery (index.html)  Albums (album.html)  Timeline (sidebar)
```

### Syncing Local ↔ R2
```bash
# Download from R2 to local (for backup/reference)
curl -o data/albums.json "https://pub-5824bb858aa94e4b8c091ec16ed5c3c0.r2.dev/data/albums.json"

# Upload local to R2 (for bulk updates)
source ~/.nvm/nvm.sh && nvm use 20
wrangler r2 object put photography-portfolio/data/albums.json --file=data/albums.json --content-type="application/json"
```

## Admin Panel
- **URL**: `/admin.html`
- **Backend**: Cloudflare Pages Functions in `functions/api/`
- **Auth**: Uses `ADMIN_PASSWORD` and `ADMIN_SECRET` environment variables
- **Storage**: All operations read/write to R2 bucket

### Admin Functions
- ✅ **Albums**: Create, edit, delete albums
- ✅ **Photos**: Upload, delete photos (instant visibility on public site)
- ✅ **Upload**: Drag-and-drop upload with optional AI analysis
- ⚠️ **Sync Data**: Button exists but incomplete implementation
- ✅ **Storage Status**: R2 connection check

### Important Notes
- Album keys with spaces/special chars are URL-encoded automatically
- Uploads bypass git - changes are immediate via R2
- Local `data/albums.json` is just a backup (not used by live site)

## Recent Changes (Nov-Dec 2025)

### Performance Optimization (Dec 2025)
- **Admin Upload Fixed**: Added WebP processing to admin panel uploads using @cf-wasm/photon
  - Thumbnails: 800px width, 85% quality WebP
  - Full-size: 2000px width, 90% quality WebP
  - Matches local import script settings
- **Caching Headers**: Added `_headers` file for optimal Cloudflare caching
  - Images: 1 year cache with immutable flag
  - CSS/JS: 1 year cache
  - HTML: 1 hour cache with revalidation
- **Safari Pagination**: Automatic detection disables infinite scroll for Safari users
  - Shows "Load More" button instead of auto-loading
  - Reduces memory usage and improves performance on Safari
  - Other browsers continue using infinite scroll
- **AI Analysis**: Disabled by default in import scripts for faster processing
- **CDMX-Wired Album**: Reprocessed from raw JPEGs to WebP (85% size reduction)

### R2 Migration (Nov 2025)
- **R2 Migration**: Switched all data fetching to R2 (instant admin updates)
- **CORS Enabled**: Configured R2 bucket for cross-origin requests
- **Admin Panel**: Fixed photo deletion, URL encoding for special characters
- Timeline redesigned with collapsible year sections
- Filter UI hidden (logic preserved)
- Gallery hover text always white (fixed dark mode issue)
- Sidebar updated: removed About/Contact nav, added contact info text
- Import script uploads to R2 automatically (requires `.env` config)