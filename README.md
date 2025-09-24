# Photography Portfolio

A professional photography website showcasing nature, portraits, and event photography with a responsive masonry gallery layout.

## Features

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dynamic Gallery**: Masonry-style layout with lazy loading and filtering
- **Lightbox View**: Full-screen image viewing with navigation
- **Album Organization**: Photos organized by categories (nature, portraits, events)
- **Contact Forms**: Professional inquiry forms with validation
- **SEO Optimized**: Meta tags, schema markup, and sitemap included

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Images**: WebP format with JPEG fallbacks
- **Build Tools**: Image optimization scripts with Sharp
- **Deployment**: Static hosting (Cloudflare Pages)

## Local Development

1. Clone the repository
2. Serve the files using any static web server:
   ```bash
   python3 -m http.server 8080
   ```
3. Open `http://localhost:8080` in your browser

## Adding New Photos

Use the included import script to add new photos:

```bash
cd scripts
./import.sh path/to/your/photos album-name
```

This will automatically:
- Optimize images and create WebP versions
- Generate thumbnails
- Update the albums.json configuration
- Organize files into the proper directory structure

## Project Structure

```
├── index.html              # Gallery home page
├── about.html             # About page
├── contact.html           # Contact page
├── album.html            # Individual album view
├── assets/
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript modules
│   └── images/           # Photo assets
├── data/
│   └── albums.json       # Photo metadata and organization
└── scripts/              # Build and import tools
```

## License

© 2024 Mitchell Carter. All rights reserved.