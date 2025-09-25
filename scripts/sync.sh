#!/bin/bash

# Album Directory Sync Wrapper
# Usage: ./sync.sh [--dry-run]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run the sync script
echo "📁 Album Directory Sync Tool"
echo "=============================="
echo ""

if [[ "$1" == "--dry-run" ]]; then
    echo "🔍 Running in DRY RUN mode..."
    node sync-albums.js --dry-run
else
    echo "💾 Syncing album directories with albums.json..."
    node sync-albums.js
fi

echo ""
echo "✅ Sync complete!"