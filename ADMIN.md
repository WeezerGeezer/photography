# Admin Panel Documentation

## Overview
Web-based admin interface for managing albums and photos without git commits or command-line tools.

- **URL**: `https://photos.mitchellcarter.dev/admin.html`
- **Auth**: Password-protected using Cloudflare Pages environment variables
- **Storage**: All changes write directly to R2 bucket (instant visibility on public site)

## Authentication

### Environment Variables Required
Set in Cloudflare Pages dashboard:
- `ADMIN_PASSWORD` - Your admin password
- `ADMIN_SECRET` - Secret key for token hashing

### Login Process
1. Navigate to `/admin.html`
2. Enter password
3. Session stored in browser localStorage for 24 hours
4. Logout clears session

## Features

### 1. Albums Management

#### Create Album
1. Click **"+ New Album"** button
2. Fill in:
   - **Title** (required) - Display name
   - **Description** - Short description
   - **Date** - Album date (for timeline sorting)
   - **Private** - Hide from public gallery (still accessible via direct URL)
3. Album key is auto-generated from title (lowercase, hyphens)

#### Edit Album
1. Click **"Edit"** on album card
2. Modify metadata (title, description, date, privacy)
3. Changes save to R2 immediately

#### Delete Album
1. Click **"Delete"** on album card
2. Confirm deletion
3. Deletes all photos in album from R2
4. **Warning**: Cannot be undone

#### Manage Photos
1. Click **"Photos"** on album card
2. View all photos in album
3. Delete individual photos with X button

### 2. Photo Upload

#### Upload Process
1. Go to **Upload Photos** tab
2. Select album from dropdown
3. Drag-and-drop photos or click to browse
4. Optional: Check **"Skip AI analysis"** for faster uploads
5. Click **Upload Photos**
6. Progress bar shows upload status

#### What Happens During Upload
1. Photos are uploaded to R2 bucket
2. Sharp creates WebP optimized versions (thumbnail + full)
3. AI analysis runs (unless skipped) to categorize photos
4. `albums.json` is updated in R2
5. Photos appear instantly on public site (no deploy needed)

#### Upload Notes
- Accepts: JPG, PNG, WebP, HEIC
- Files are processed server-side
- Original filenames preserved in metadata
- AI categories: Maritime, Golden Hour, Candid, Action, Nature, Events, Portraits

### 3. Settings

#### R2 Storage Status
- Shows connection status to R2 bucket
- Displays bucket name
- Auto-checks on login

#### Clear Cache
- Clears browser localStorage albums cache
- Forces fresh fetch from R2
- Use if data seems stale

#### Sync Data
- **Status**: Incomplete implementation
- Button exists but doesn't perform useful sync yet
- Future: Will merge local metadata with R2 data

## API Endpoints

All endpoints require `Authorization: Bearer <token>` header (except `/api/auth`).

### Authentication
- `POST /api/auth` - Login with password, returns JWT token

### Albums
- `GET /api/albums` - List all albums
- `POST /api/albums` - Create new album
- `PUT /api/albums` - Update album metadata
- `DELETE /api/albums/:key` - Delete album and all photos

### Photos
- `POST /api/upload` - Upload photo(s) to album
- `DELETE /api/photos/:album/:photoId` - Delete single photo

### Status
- `GET /api/status` - Check R2 connection

### Sync
- `POST /api/sync` - Sync data (incomplete)
- `GET /api/sync` - Get current R2 data

## Technical Details

### URL Encoding
Album keys and photo IDs with spaces/special characters are automatically URL-encoded:
- Frontend: `encodeURIComponent(albumKey)`
- Backend: `decodeURIComponent(params.album)`

Examples:
- `"Near Park Avenue, La Crosse WI"` → `"Near%20Park%20Avenue%2C%20La%20Crosse%20WI"`
- `"Chicago September '24"` → `"Chicago%20September%20'24"`

### Data Flow
```
Admin Upload → Cloudflare Pages Function
                ↓
            R2 Bucket (albums.json + images)
                ↓
         Public Site (instant)
```

### R2 Structure
```
photography-portfolio/
├── data/
│   └── albums.json          # Metadata (single source of truth)
└── images/
    ├── full/                # Full-size WebP images
    │   └── [album]/[photo].webp
    └── thumbnails/          # Thumbnail WebP images
        └── [album]/[photo].webp
```

### Error Handling
- Network errors show toast notifications
- 401 Unauthorized → Redirects to login
- 404 Album not found → Shows available albums in console
- 500 Server error → Shows error message in toast

## Troubleshooting

### Photos not appearing after upload
1. Check browser console for errors
2. Verify R2 connection in Settings tab
3. Try **Clear Cache** and hard refresh (Cmd+Shift+R)
4. Check Cloudflare Pages Functions logs for errors

### Delete photo fails
- Ensure album key matches exactly (check available keys in error)
- Verify R2 bucket binding is set up in Cloudflare Pages
- Check photo ID is correct

### Login fails
- Verify `ADMIN_PASSWORD` and `ADMIN_SECRET` are set in Cloudflare Pages
- Check browser console for network errors
- Try clearing browser localStorage and login again

### Changes not visible on public site
- R2 migration complete (Nov 2025) - changes should be instant
- If delayed, check browser cache (hard refresh)
- Verify albums.json in R2 is updated: `curl https://pub-5824bb858aa94e4b8c091ec16ed5c3c0.r2.dev/data/albums.json`

## Security

### Authentication
- Password hashed with SHA-256 + secret salt
- Token stored in browser localStorage (24hr expiry)
- HTTPS enforced on production

### CORS
- R2 bucket allows cross-origin GET/HEAD from all origins
- API endpoints have CORS middleware
- Admin API endpoints require valid auth token

### Best Practices
- Use strong `ADMIN_PASSWORD`
- Keep `ADMIN_SECRET` secret (never commit to git)
- Logout when done to clear session
- Don't share admin URLs publicly

## Limitations

### Current Limitations
- No bulk photo delete
- No photo reordering within albums
- No photo editing (title, description, tags)
- No album reordering
- Cannot restore deleted photos (no trash/undo)
- Sync Data button doesn't work yet

### Future Enhancements
- Drag-and-drop photo reordering
- Bulk operations (select multiple, delete)
- Photo metadata editing
- Album cover photo selection
- Image cropping/rotation
- Complete Sync Data implementation
- Activity log/audit trail

## Development

### Local Testing
```bash
# Run Cloudflare Pages locally
npx wrangler pages dev

# Access admin at http://localhost:8788/admin.html
```

### Deploying Changes
Admin panel code deploys automatically via Cloudflare Pages on git push:
```bash
git add .
git commit -m "Update admin panel"
git push
```

Changes live in ~1 minute after push.

### Environment Variables
Set in Cloudflare Pages dashboard → Settings → Environment variables:
- Production: Set `ADMIN_PASSWORD` and `ADMIN_SECRET`
- Preview: Optionally set different values for testing
