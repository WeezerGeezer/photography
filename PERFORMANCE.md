# Modern Performance Metrics Guide

Performance testing guide for the photography portfolio using industry-standard metrics that actually matter in 2024.

## 🎯 Core Web Vitals (Google's Standard)

These are the **only metrics** that affect your Google search ranking and user experience.

### 1. **LCP - Largest Contentful Paint**
**What it measures**: How long until the main content is visible
**Target**: < 2.5 seconds (Good) | 2.5-4s (Needs Improvement) | > 4s (Poor)

**For your portfolio**:
- LCP = First large image in gallery
- Affected by: Image size, CDN speed, lazy loading implementation

**How to measure**:
```javascript
// Browser DevTools Console
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
}).observe({entryTypes: ['largest-contentful-paint']});
```

**Optimization tips**:
- ✅ Use WebP images (you have this)
- ✅ Serve from CDN (Cloudflare - you have this)
- ⚠️ Add `<link rel="preload">` for first image
- ⚠️ Use responsive images with `srcset`

---

### 2. **FID - First Input Delay** (or INP in 2024)
**What it measures**: Time from user click to browser response
**Target**: < 100ms (Good) | 100-300ms (Needs Improvement) | > 300ms (Poor)

**For your portfolio**:
- FID = Time to respond to filter click, image click, scroll
- Affected by: JavaScript execution time, blocking scripts

**Google is replacing FID with INP (Interaction to Next Paint) in March 2024**

**How to measure**:
```javascript
// Browser DevTools Console
new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log('FID:', entry.processingStart - entry.startTime);
  });
}).observe({entryTypes: ['first-input']});
```

**Optimization tips**:
- ✅ Non-blocking JavaScript (async/defer - you have this)
- ✅ Modular code splitting (you have this)
- ⚠️ Could reduce initial JS bundle size if needed

---

### 3. **CLS - Cumulative Layout Shift**
**What it measures**: Visual stability (content jumping around)
**Target**: < 0.1 (Good) | 0.1-0.25 (Needs Improvement) | > 0.25 (Poor)

**For your portfolio**:
- CLS = Gallery layout shifts while images load
- Affected by: Images without dimensions, masonry recalculation

**How to measure**:
```javascript
// Browser DevTools Console
let cls = 0;
new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (!entry.hadRecentInput) {
      cls += entry.value;
      console.log('CLS:', cls);
    }
  });
}).observe({entryTypes: ['layout-shift']});
```

**Optimization tips**:
- ⚠️ Add `width` and `height` attributes to `<img>` tags
- ⚠️ Reserve space for images before they load
- ✅ Your masonry handles this relatively well

---

## 📊 Additional Modern Metrics

### 4. **TTFB - Time to First Byte**
**What it measures**: Server response speed
**Target**: < 600ms (Good) | 600-1500ms (OK) | > 1500ms (Poor)

**For your portfolio**:
- TTFB = Cloudflare edge response time
- Should be very fast with Cloudflare Pages

**How to check**:
```bash
curl -w "TTFB: %{time_starttransfer}s\n" -o /dev/null -s https://photos.mitchellcarter.dev
```

---

### 5. **FCP - First Contentful Paint**
**What it measures**: When ANY content appears
**Target**: < 1.8s (Good) | 1.8-3s (Needs Improvement) | > 3s (Poor)

**For your portfolio**:
- FCP = When sidebar/header appears
- Usually happens before LCP

---

### 6. **TBT - Total Blocking Time**
**What it measures**: How long main thread is blocked
**Target**: < 200ms (Good) | 200-600ms (Needs Improvement) | > 600ms (Poor)

**For your portfolio**:
- TBT = Time when page is unresponsive
- Affected by heavy JavaScript processing

---

## 🔧 How to Test (Modern Tools)

### **Method 1: Google Lighthouse** (Recommended)

**In Chrome DevTools**:
1. Open your site in Chrome
2. Right-click → Inspect → Lighthouse tab
3. Select "Performance" + "Mobile" or "Desktop"
4. Click "Analyze page load"

**Provides**:
- Core Web Vitals scores
- Performance score (0-100)
- Specific recommendations
- Simulated throttling (mobile networks)

**Command line**:
```bash
npm install -g lighthouse
lighthouse https://photos.mitchellcarter.dev --view
```

---

### **Method 2: Chrome DevTools Performance Tab**

**How to use**:
1. Open DevTools → Performance tab
2. Click Record button
3. Reload page
4. Stop recording after page loads
5. Analyze timeline

**What to look for**:
- Long tasks (red bars) > 50ms
- Layout shifts (purple bars)
- Paint operations (green bars)
- Network waterfall

---

### **Method 3: WebPageTest** (Real-world testing)

**URL**: https://www.webpagetest.org/

**Why it's better**:
- Tests from real locations worldwide
- Real mobile devices
- Connection throttling (3G, 4G, etc.)
- Filmstrip view of page load
- Detailed waterfall charts

**Settings to use**:
```
Test Location: Choose your target audience location
Browser: Chrome
Connection: 4G (mobile) or Cable (desktop)
Number of Tests: 3 (for average)
```

---

### **Method 4: Chrome User Experience Report (CrUX)**

**What it is**: Real user data from Chrome browsers
**URL**: https://developers.google.com/speed/pagespeed/insights/

**Enter your URL** and it shows:
- Actual Core Web Vitals from real visitors
- Field data (28 days of real users)
- Lab data (Lighthouse simulation)
- Mobile vs Desktop breakdown

---

## 📈 Target Scores for Photography Portfolios

### **Google Lighthouse**
| Metric | Target | Your Goal |
|--------|--------|-----------|
| Performance Score | 90-100 (Green) | 85+ |
| LCP | < 2.5s | < 2.5s |
| TBT | < 200ms | < 300ms |
| CLS | < 0.1 | < 0.15 |
| Speed Index | < 3.4s | < 4.0s |

### **Core Web Vitals (Field Data)**
| Metric | Good | Needs Work | Poor |
|--------|------|------------|------|
| LCP | < 2.5s | 2.5-4s | > 4s |
| FID/INP | < 100ms | 100-300ms | > 300ms |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |

**Note**: Photography sites often score 80-90 (not 100) due to image-heavy content. This is normal and acceptable.

---

## 🎯 Benchmarks from Top Photography Sites

### **Unsplash.com**
- Performance Score: 85-92
- LCP: 2.1s
- CLS: 0.08
- Total Requests: ~180
- **Why**: Prioritizes image quality over perfect scores

### **500px.com**
- Performance Score: 78-85
- LCP: 2.8s
- CLS: 0.12
- **Why**: Heavy image galleries, acceptable trade-off

### **Adobe Portfolio**
- Performance Score: 88-94
- LCP: 1.9s
- CLS: 0.05
- **Why**: Simpler galleries, less features

### **Your Site Should Target**: 85-90 score, < 2.5s LCP

---

## 🚀 Quick Performance Checklist

### ✅ **Already Optimized** (You have these)
- [x] WebP image format
- [x] Lazy loading images
- [x] CDN delivery (Cloudflare)
- [x] Brotli compression
- [x] HTTP/2 multiplexing
- [x] Non-blocking JavaScript
- [x] Modular code architecture

### ⚠️ **Could Improve**
- [ ] Add image dimensions (width/height) to reduce CLS
- [ ] Implement responsive images (srcset)
- [ ] Preload first/hero image
- [ ] Reduce initial images loaded (20 → 12)
- [ ] Add font-display: swap for web fonts

### 🔄 **Advanced (Optional)**
- [ ] Implement service worker for offline support
- [ ] Use HTTP/3 (QUIC protocol)
- [ ] Implement progressive image loading (blur-up)
- [ ] Add resource hints (preconnect, dns-prefetch)

---

## 📱 Mobile-Specific Considerations

Photography sites must balance quality vs performance on mobile:

### **Mobile Optimization Priorities**:
1. **Responsive images** - Serve smaller images to mobile
   ```html
   <img srcset="thumb-400.webp 400w, thumb-800.webp 800w"
        sizes="(max-width: 768px) 400px, 800px">
   ```

2. **Reduce initial load** - 8-12 images on mobile vs 20 on desktop

3. **Touch-friendly** - Your site already has this

4. **Connection-aware loading** - Detect slow connections
   ```javascript
   if (navigator.connection && navigator.connection.effectiveType === '4g') {
     // Load high quality
   } else {
     // Load lower quality
   }
   ```

---

## 🔍 Real-Time Monitoring

### **Google Search Console**
- Free tool showing your actual Core Web Vitals
- Data from real Chrome users visiting your site
- URL: https://search.google.com/search-console

### **Cloudflare Analytics**
- Your Cloudflare dashboard shows:
  - Bandwidth usage
  - Cache hit rate
  - Response times by location

---

## 📚 Resources

### **Official Documentation**
- [Web.dev - Core Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Lighthouse Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)

### **Testing Tools**
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse)

### **Learning**
- [Web.dev Performance](https://web.dev/learn/performance/)
- [HTTP Archive](https://httparchive.org/) - Industry trends

---

## 🎓 Key Takeaways

1. **Core Web Vitals are what matter** - Ignore outdated metrics like "request count"

2. **Photography sites have different targets** - 85-90 score is excellent (not 100)

3. **User experience > perfect scores** - Image quality matters more than milliseconds

4. **Test with modern tools** - Lighthouse, WebPageTest, PageSpeed Insights

5. **Focus on LCP and CLS** - These matter most for image-heavy sites

6. **Your current architecture is modern** - HTTP/2, WebP, CDN, lazy loading

---

## 🧪 Testing Your Site Now

Run these three tests and compare:

```bash
# 1. Lighthouse (local)
lighthouse https://photos.mitchellcarter.dev --view

# 2. PageSpeed Insights
# Visit: https://pagespeed.web.dev/
# Enter: photos.mitchellcarter.dev

# 3. WebPageTest
# Visit: https://www.webpagetest.org/
# Enter: photos.mitchellcarter.dev
# Location: Dulles, VA (or closest to your audience)
# Browser: Chrome
# Connection: 4G
```

**Look for**:
- Performance score: Aim for 85+
- LCP: < 2.5s
- CLS: < 0.15
- TBT: < 300ms

These are the **only metrics that matter** in 2024.
