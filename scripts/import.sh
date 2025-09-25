#!/bin/bash

# Photo Import Script Wrapper with Cleanup Support
# Usage: ./import.sh [album-name] [options]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Initialize variables
ALBUM_NAME=""
CLEANUP_FLAG=""
SCAN_ALL=""

# Parse arguments
for arg in "$@"; do
    case $arg in
        --cleanup)
            CLEANUP_FLAG="true"
            ;;
        --help|-h)
            echo "📷 Photo Import Tool with Cleanup Support"
            echo ""
            echo "Usage: ./import.sh [album-name] [options]"
            echo ""
            echo "Options:"
            echo "  --cleanup    Run cleanup before import to remove orphaned entries"
            echo "  --help, -h   Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./import.sh                       # Scan and import all albums (interactive)"
            echo "  ./import.sh nature                # Import nature album"
            echo "  ./import.sh nature --cleanup      # Clean up first, then import nature"
            echo "  ./import.sh --cleanup             # Clean up, then scan all albums"
            echo ""
            echo "Cleanup removes orphaned entries from albums.json when source images are deleted"
            exit 0
            ;;
        -*)
            echo "Unknown option: $arg"
            echo "Use --help for usage information"
            exit 1
            ;;
        *)
            if [ -z "$ALBUM_NAME" ]; then
                ALBUM_NAME="$arg"
            else
                echo "Error: Multiple album names provided"
                echo "Usage: ./import.sh [album-name] [--cleanup]"
                exit 1
            fi
            ;;
    esac
done

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

# Run cleanup if requested
if [ "$CLEANUP_FLAG" = "true" ]; then
    echo "🧹 Running cleanup to remove orphaned entries..."
    node cleanup-photos.js --confirm --no-new-albums
    echo ""
fi

# Handle album import
if [ -z "$ALBUM_NAME" ]; then
    # No album specified - interactive mode
    echo "Usage: ./import.sh [album-name] [--cleanup]"
    echo ""
    echo "Examples:"
    echo "  ./import.sh nature        # Import specific album"
    echo "  ./import.sh               # Scan and import ALL album folders"
    echo "  ./import.sh --cleanup     # Clean up first, then scan all"
    echo ""
    echo "The script will automatically detect album folders in assets/images/albums/"
    echo "and create new entries in albums.json if they don't exist."
    echo ""
    read -p "Would you like to scan and import all albums? (y/n): " response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "🔍 Scanning all album folders..."
        node import-photos.js
    else
        echo "Operation cancelled."
        exit 0
    fi
else
    # Import specific album
    echo "🚀 Starting photo import for album: $ALBUM_NAME"
    node import-photos.js "$ALBUM_NAME"
fi
