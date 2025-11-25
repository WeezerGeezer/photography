# Changelog

## 2025-11-24 - Admin Panel Fixes & R2 Migration

### Session Overview
Fixed critical admin panel bugs and migrated data architecture to use R2 as single source of truth.

### Changes Made

#### 1. Fixed Photo Deletion Bug
**Problem:** Deleting photos via admin panel returned 404 "Album not found" error
**Root Causes:**
- R2 `albums.json` only had 2 albums while static had 14 (out of sync)
- Album keys with spaces/special chars weren't URL-encoded properly

**Fixes:**
- Added URL encoding/decoding for album keys and photo IDs (`assets/js/admin.js:445`, `functions/api/photos/[album]/[photoId].js:54`)
- Improved error messages to show actual HTTP status and error details
- Added debug logging showing requested vs. available album keys
- Synced local `albums.json` to R2 using `wrangler r2 object put`

**Commits:**
- `72f3bcd` - Improve delete photo error messages in admin panel
- `2e18cf9` - Fix URL encoding for album keys with spaces/special chars
- `2df6b17` - Add debug info to album not found error

#### 2. Migrated to R2 as Single Source of Truth
**Problem:** Data architecture had two separate sources creating sync issues:
- Public site loaded from static `/data/albums.json` (git)
- Admin API read/wrote to R2 `data/albums.json`
- Uploading via admin required manual git sync to be visible on public site

**Solution:** Switched all frontend data fetching to R2 public URL

**Files Modified:**
- `assets/js/gallery.js` - Main gallery page
- `assets/js/album-loader.js` - Individual album pages
- `assets/js/timeline.js` - Timeline sidebar
- `assets/js/photo-detail.js` - Photo detail pages
- `assets/js/admin.js` - Admin panel

All now fetch from: `https://pub-5824bb858aa94e4b8c091ec16ed5c3c0.r2.dev/data/albums.json`

**Infrastructure:**
- Configured R2 bucket CORS policy to allow cross-origin requests
- CORS rules: Allow all origins, GET/HEAD methods, all headers, 24hr cache

**Benefits:**
- ✅ Instant visibility - uploads via admin appear immediately on public site
- ✅ Single source of truth - no more sync issues
- ✅ Simpler workflow - no git commits needed for photo uploads

**Commits:**
- `2161e19` - Sync albums.json from R2 - add cdmxwired album
- `2cc65db` - Switch all album data fetching to R2

### Admin Panel Functions Tested
1. ✅ Create Album
2. ✅ Upload Photos
3. ✅ Delete Photo (fixed)
4. Edit Album (not tested)
5. Delete Album (not tested)
6. Clear Cache (not tested)
7. Sync Data (incomplete implementation - needs work)

### Technical Details

#### R2 CORS Configuration
```json
{
  "rules": [
    {
      "allowed": {
        "origins": ["*"],
        "methods": ["GET", "HEAD"],
        "headers": ["*"]
      },
      "maxAgeSeconds": 86400
    }
  ]
}
```

#### Data Flow (Before)
```
Admin Upload → R2 albums.json
Public Site → Static /data/albums.json (git)
❌ Out of sync
```

#### Data Flow (After)
```
Admin Upload → R2 albums.json
Public Site → R2 albums.json
✅ Single source of truth
```

### Files Changed
- `assets/js/admin.js` - Error handling + R2 fetch + URL encoding
- `assets/js/gallery.js` - R2 fetch
- `assets/js/album-loader.js` - R2 fetch
- `assets/js/timeline.js` - R2 fetch
- `assets/js/photo-detail.js` - R2 fetch
- `functions/api/photos/[album]/[photoId].js` - URL decoding + debug logging

### Known Issues / Future Work
- **Sync Data button** in admin settings doesn't do anything useful yet
- Local `data/albums.json` is now just a backup/reference (not used by live site)
- R2 egress costs should be monitored (though unlikely to be an issue)
- Consider implementing fallback to static file if R2 is unreachable

### Migration Notes
If reverting R2 migration is needed, change all fetch URLs back from:
```javascript
fetch('https://pub-5824bb858aa94e4b8c091ec16ed5c3c0.r2.dev/data/albums.json')
```
to:
```javascript
fetch('/data/albums.json')
```
