#!/bin/bash

# Performance Testing Script
# Tests your photography portfolio with modern metrics

SITE_URL="https://photos.mitchellcarter.dev"
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}🚀 Photography Portfolio Performance Test${NC}"
echo -e "Testing: ${SITE_URL}\n"

# Test 1: Basic Server Metrics
echo -e "${BOLD}📊 Server Response Metrics${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

curl -w "\
Time to Connect:     %{time_connect}s
Time to First Byte:  %{time_starttransfer}s (TTFB)
Total Time:          %{time_total}s
Download Size:       %{size_download} bytes (%.2f KB)
Download Speed:      %{speed_download} bytes/sec (%.2f KB/s)
HTTP Status:         %{http_code}
" -o /dev/null -s "${SITE_URL}" | awk '{if (NR<=3 || NR==6) print $0; else if (NR==4) printf "%s %d bytes (%.2f KB)\n", $1, $2, $2/1024; else if (NR==5) printf "%s %d bytes/sec (%.2f KB/s)\n", $1, $2, $2/1024}'

# Evaluate TTFB
TTFB=$(curl -w "%{time_starttransfer}" -o /dev/null -s "${SITE_URL}")
TTFB_MS=$(echo "$TTFB * 1000" | bc)
TTFB_INT=${TTFB_MS%.*}

echo ""
if [ "$TTFB_INT" -lt 600 ]; then
    echo -e "${GREEN}✓ TTFB is EXCELLENT (< 600ms)${NC}"
elif [ "$TTFB_INT" -lt 1500 ]; then
    echo -e "${YELLOW}⚠ TTFB is OK (600-1500ms)${NC}"
else
    echo -e "${RED}✗ TTFB needs improvement (> 1500ms)${NC}"
fi

echo ""

# Test 2: Compression Check
echo -e "${BOLD}📦 Compression Check${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ENCODING=$(curl -sI -H "Accept-Encoding: gzip, deflate, br" "${SITE_URL}/assets/css/main.css" | grep -i "content-encoding" | cut -d' ' -f2 | tr -d '\r')

if [ ! -z "$ENCODING" ]; then
    if [ "$ENCODING" = "br" ]; then
        echo -e "Compression: ${GREEN}Brotli (br)${NC} ✓"
        echo -e "${GREEN}✓ EXCELLENT - Brotli is better than gzip!${NC}"
    elif [ "$ENCODING" = "gzip" ]; then
        echo -e "Compression: ${GREEN}gzip${NC} ✓"
        echo -e "${GREEN}✓ GOOD - gzip compression active${NC}"
    else
        echo -e "Compression: ${YELLOW}$ENCODING${NC}"
    fi
else
    echo -e "Compression: ${RED}None detected${NC} ✗"
    echo -e "${RED}✗ WARNING - No compression detected${NC}"
fi

echo ""

# Test 3: Cache Headers
echo -e "${BOLD}💾 Cache Headers${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CACHE_HTML=$(curl -sI "${SITE_URL}" | grep -i "cache-control" | cut -d' ' -f2- | tr -d '\r')
CACHE_CSS=$(curl -sI "${SITE_URL}/assets/css/main.css" | grep -i "cache-control" | cut -d' ' -f2- | tr -d '\r')

echo "HTML Cache:  $CACHE_HTML"
echo "CSS Cache:   $CACHE_CSS"

# Extract max-age from CSS
MAX_AGE=$(echo "$CACHE_CSS" | grep -o 'max-age=[0-9]*' | cut -d'=' -f2)
if [ ! -z "$MAX_AGE" ]; then
    MAX_AGE_HOURS=$((MAX_AGE / 3600))
    MAX_AGE_DAYS=$((MAX_AGE / 86400))

    echo ""
    if [ "$MAX_AGE_DAYS" -ge 365 ]; then
        echo -e "${GREEN}✓ EXCELLENT - Long-term caching (${MAX_AGE_DAYS} days)${NC}"
    elif [ "$MAX_AGE_HOURS" -ge 24 ]; then
        echo -e "${YELLOW}⚠ OK - Medium-term caching (${MAX_AGE_DAYS} days / ${MAX_AGE_HOURS} hours)${NC}"
    else
        echo -e "${YELLOW}⚠ Short-term caching (${MAX_AGE_HOURS} hours)${NC}"
    fi
fi

echo ""

# Test 4: Image Optimization Check
echo -e "${BOLD}🖼️  Image Optimization${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Fetch albums.json and check image format
ALBUMS_JSON=$(curl -s "https://pub-5824bb858aa94e4b8c091ec16ed5c3c0.r2.dev/data/albums.json")

WEBP_COUNT=$(echo "$ALBUMS_JSON" | grep -o '\.webp"' | wc -l | xargs)
JPEG_COUNT=$(echo "$ALBUMS_JSON" | grep -o '\.\(jpg\|jpeg\)"' | wc -l | xargs)
TOTAL_IMAGES=$((WEBP_COUNT + JPEG_COUNT))

echo "Total Images:  $TOTAL_IMAGES"
echo "WebP Images:   $WEBP_COUNT"
echo "JPEG Images:   $JPEG_COUNT"

if [ "$TOTAL_IMAGES" -gt 0 ]; then
    WEBP_PERCENT=$((WEBP_COUNT * 100 / TOTAL_IMAGES))
    echo "WebP Usage:    ${WEBP_PERCENT}%"
    echo ""

    if [ "$WEBP_PERCENT" -ge 95 ]; then
        echo -e "${GREEN}✓ EXCELLENT - ${WEBP_PERCENT}% WebP format${NC}"
    elif [ "$WEBP_PERCENT" -ge 80 ]; then
        echo -e "${YELLOW}⚠ GOOD - ${WEBP_PERCENT}% WebP format${NC}"
    else
        echo -e "${RED}✗ NEEDS WORK - Only ${WEBP_PERCENT}% WebP format${NC}"
    fi
fi

echo ""

# Test 5: HTTP/2 Check
echo -e "${BOLD}🌐 HTTP Protocol${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HTTP_VERSION=$(curl -sI --http2 "${SITE_URL}" | head -1 | cut -d' ' -f1)
echo "Protocol: $HTTP_VERSION"

if [[ "$HTTP_VERSION" == *"HTTP/2"* ]] || [[ "$HTTP_VERSION" == *"HTTP/3"* ]]; then
    echo -e "${GREEN}✓ EXCELLENT - Using modern HTTP protocol${NC}"
    echo "  → Multiplexing enabled (many requests over one connection)"
else
    echo -e "${YELLOW}⚠ Using HTTP/1.1 (upgrade to HTTP/2 recommended)${NC}"
fi

echo ""

# Summary
echo -e "${BOLD}📋 Summary & Next Steps${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "For detailed Core Web Vitals testing, use one of these:"
echo ""
echo "1. ${BOLD}Chrome DevTools Lighthouse${NC} (Most accurate)"
echo "   • Open ${SITE_URL} in Chrome"
echo "   • Right-click → Inspect → Lighthouse tab"
echo "   • Run performance audit"
echo ""
echo "2. ${BOLD}PageSpeed Insights${NC} (Google's official tool)"
echo "   • Visit: https://pagespeed.web.dev/"
echo "   • Enter: ${SITE_URL}"
echo ""
echo "3. ${BOLD}WebPageTest${NC} (Most detailed)"
echo "   • Visit: https://www.webpagetest.org/"
echo "   • Enter: ${SITE_URL}"
echo ""
echo "See PERFORMANCE.md for detailed metrics and targets."
echo ""
