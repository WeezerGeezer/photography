# Data Directory - Metadata Storage

Central data storage for the photography portfolio using JSON-based metadata management.

## Albums JSON Structure (`albums.json`)

### Schema
```json
{
  "album-key": {
    "title": "Album Display Name",
    "description": "Album description",
    "cover": "album-key/cover.jpg",
    "images": [
      {
        "id": "unique-image-id",
        "title": "Image filename without extension",
        "thumbnail": "assets/images/thumbnails/album-key/image.webp",
        "full": "assets/images/full/album-key/image.webp",
        "date": "YYYY-MM-DD",
        "accessibility": {
          "altText": "AI-generated descriptive text"
        },
        "tags": ["Maritime", "Golden Hour", "Action"],
        "technical": {
          "camera": "Camera model",
          "lens": "Lens information",
          "settings": "Aperture, shutter, ISO",
          "dimensions": { "width": 6000, "height": 4000 }
        }
      }
    ]
  }
}
```

### Key Features
- **Album Keys**: Directory names used as JSON keys for direct path mapping
- **AI Tags**: 7 categories (Maritime, Golden Hour, Candid, Action, Nature, Events, Portraits)
- **Technical Metadata**: Full EXIF data including camera settings and dimensions
- **Accessibility**: AI-generated alt-text for screen readers
- **WebP Paths**: Optimized image formats with fallback support

### Management
- **Automatic Updates**: Scripts maintain JSON integrity during imports and renames
- **Path Synchronization**: Directory renames automatically update all image paths
- **Metadata Preservation**: AI analysis and technical data retained during operations
- **Unique IDs**: Generated identifiers for reliable image tracking

This JSON structure serves as the single source of truth for all portfolio content, enabling the frontend to render galleries, filters, and album pages dynamically.