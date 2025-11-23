# Admin Panel Setup Guide

This guide explains how to set up and use the admin panel for the photography portfolio.

## Overview

The admin panel allows you to:
- Create, edit, and delete albums
- Upload photos directly to Cloudflare R2 storage
- Manage photo metadata
- Control album visibility (public/private)

## Architecture

The admin system consists of:
- **Frontend**: `admin.html` with vanilla JavaScript
- **Backend**: Cloudflare Pages Functions (serverless)
- **Storage**: Cloudflare R2 for images, `albums.json` for metadata

## Prerequisites

1. A Cloudflare account with Pages enabled
2. A Cloudflare R2 bucket created
3. Your site deployed to Cloudflare Pages

## Setup Steps

### 1. Create R2 Bucket

1. Go to Cloudflare Dashboard > R2
2. Click "Create bucket"
3. Name it `photography-portfolio` (or update wrangler.toml accordingly)
4. Set public access if needed for serving images

### 2. Configure Environment Variables

In Cloudflare Dashboard > Pages > Your Project > Settings > Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `ADMIN_PASSWORD` | Password to access admin panel | `MySecureP@ssw0rd!` |
| `ADMIN_SECRET` | Secret key for token generation | `a1b2c3d4e5f6g7h8i9j0...` |

**Generate a secure secret:**
```bash
openssl rand -hex 32
```

### 3. Bind R2 Bucket

In Cloudflare Dashboard > Pages > Your Project > Settings > Functions:

1. Scroll to "R2 bucket bindings"
2. Click "Add binding"
3. Variable name: `R2_BUCKET`
4. R2 bucket: Select your `photography-portfolio` bucket

### 4. Deploy

Push your changes to trigger a Cloudflare Pages deployment:

```bash
git add .
git commit -m "Add admin panel"
git push
```

### 5. Upload Initial Data

If you have existing `albums.json` data, upload it to R2:

1. Go to R2 > Your bucket
2. Create folder: `data`
3. Upload `albums.json` to `data/albums.json`

## Usage

### Accessing the Admin Panel

1. Navigate to `https://your-site.com/admin`
2. Enter your admin password
3. You'll be logged in for 24 hours

### Creating an Album

1. Click "Albums" tab
2. Click "+ New Album"
3. Fill in:
   - Title (required)
   - Description
   - Date
   - Private checkbox (hides from public gallery)
4. Click "Save Album"

### Uploading Photos

1. Click "Upload Photos" tab
2. Select an album from the dropdown
3. Drag and drop photos or click to browse
4. (Optional) Check "Skip AI analysis" for faster uploads
5. Click "Upload Photos"
6. Wait for all uploads to complete

### Editing Albums

1. Click "Edit" on any album card
2. Modify the title, description, date, or privacy setting
3. Click "Save Album"

### Managing Photos in an Album

1. Click "Photos" on any album card
2. Hover over a photo to see the delete button
3. Click the X to delete a photo (with confirmation)

### Deleting an Album

1. Click "Delete" on any album card
2. Confirm the deletion
3. All photos in the album will also be deleted

## Local Development

For local development with Wrangler:

```bash
# Install wrangler globally
npm install -g wrangler

# Create local environment file
cp .env.example .env.local

# Edit .env.local with your settings

# Start local development server
wrangler pages dev . --local
```

The admin panel will be available at `http://localhost:8788/admin`

## Security Considerations

1. **Password**: Use a strong, unique password
2. **HTTPS**: Always access admin panel over HTTPS in production
3. **Token expiry**: Sessions expire after 24 hours
4. **No public access**: Admin routes are protected by authentication
5. **robots.txt**: Consider adding `/admin` to robots.txt disallow

### Adding to robots.txt

```txt
User-agent: *
Disallow: /admin
Disallow: /admin.html
```

## Limitations

1. **Image Processing**: Edge functions have limited compute, so images are stored as-is without resizing. Consider using:
   - Cloudflare Images for automatic resizing
   - A separate processing worker for image optimization
   - Pre-processing images before upload

2. **AI Analysis**: The admin panel skips AI analysis by default. For AI-powered tagging, use the local `import.sh` script.

3. **Batch Operations**: Large batch uploads may timeout. Upload in smaller batches for best results.

## Troubleshooting

### "Not connected" in Settings

- Check R2 bucket binding in Cloudflare dashboard
- Verify bucket name matches wrangler.toml
- Check for deployment errors in Cloudflare Pages logs

### "Invalid password" error

- Verify ADMIN_PASSWORD environment variable is set
- Environment variables are case-sensitive
- Redeploy after changing environment variables

### Upload failures

- Check file size limits (R2 has a 25MB limit per request)
- Verify R2 bucket has write permissions
- Check browser console for detailed errors

### Photos not appearing

- Wait a few seconds for CDN propagation
- Clear browser cache
- Check R2 bucket for uploaded files
- Verify albums.json was updated

## API Reference

The admin panel uses these API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth` | POST | Authenticate with password |
| `/api/status` | GET | Check R2 connection status |
| `/api/albums` | POST | Create new album |
| `/api/albums` | PUT | Update album |
| `/api/albums/[key]` | DELETE | Delete album |
| `/api/upload` | POST | Upload photo |
| `/api/photos/[album]/[id]` | DELETE | Delete photo |
| `/api/sync` | POST | Sync albums.json |

All endpoints except `/api/auth` require Authorization header:
```
Authorization: Bearer <token>
```
