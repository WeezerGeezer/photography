# Scripts Directory - Photo Processing Tools

Node.js-based photo processing and management scripts for the photography portfolio.

## Key Scripts

### Main Tools
- **import-photos.js**: Core photo processor with AI analysis and Sharp optimization
- **import.sh**: Bash wrapper with cleanup, sync, and batch processing options
- **sync-albums.js**: Directory rename detection and JSON path synchronization
- **cleanup-photos.js**: Removes orphaned JSON entries and unused files
- **reorder-photos.js**: Interactive CLI tool for manual photo ordering within albums

### Utility Scripts
- **image-analyzer.js**: Ollama-based AI analysis for categorization and alt-text
- **analyze-existing.js**: Batch analysis for existing photo collections
- **sync.sh**: Standalone directory sync tool
- **reorder.sh**: Bash wrapper for reorder-photos.js

## Architecture

### Processing Pipeline
1. **Sharp Integration**: WebP conversion, thumbnail generation, EXIF extraction
2. **AI Analysis**: Ollama integration for scene analysis and auto-categorization
3. **Metadata Management**: JSON updates with technical specs and accessibility data
4. **Directory Sync**: Smart matching for renamed albums with path updates

### Dependencies (package.json)
- **Sharp ^0.33.0**: High-performance image processing
- **ExifTool-vendored**: Camera metadata extraction
- **Ollama**: AI photo analysis
- **Luxon**: Date/time handling with timezone support

## Usage Patterns

### Photo Import
```bash
./import.sh [album-name]  # Process specific album
./import.sh --cleanup     # Clean orphaned entries first
./import.sh --sync        # Sync directory renames
```

### Directory Management
```bash
./sync.sh                 # Apply directory renames to JSON
./sync.sh --dry-run      # Preview changes
node cleanup-photos.js --confirm  # Remove orphaned data
```

### Photo Ordering
```bash
./reorder.sh             # Interactive photo reordering tool
```
**Features:**
- Set sequential order (1, 2, 3...) for all photos in album
- Move specific photo to new position
- Swap two photos
- Clear all order values (revert to date sorting)
- Preview before saving changes

Photos with `order` field sort first (ascending), then by date (newest first). Import script preserves existing order values on re-import.

## File Organization
- Source photos: `../assets/images/albums/[album]/`
- Processed output: `../assets/images/thumbnails/` and `../assets/images/full/`
- Metadata: `../data/albums.json` with AI tags and technical specs

Scripts handle WebP optimization, AI categorization across 7 categories, EXIF processing, and maintain data integrity during album management operations.