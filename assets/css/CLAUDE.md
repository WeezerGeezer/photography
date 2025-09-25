# CSS Directory - Stylesheet Architecture

Modular CSS architecture for the photography portfolio with advanced masonry layout and responsive design.

## File Structure

### Core Stylesheets
- **main.css**: Base styles, CSS variables, sidebar navigation, typography (Futura PT)
- **gallery.css**: Masonry grid, timeline, filter buttons, lightbox components
- **responsive.css**: Mobile breakpoints, tablet layouts, touch interactions
- **contact-form.css**: Form validation, input styling, submission states

## Key Design Patterns

### CSS Variables (`:root`)
```css
--primary-color: #2c3e50;
--secondary-color: #3498db;
--text-color: #333;
--white: #ffffff;
```

### Masonry Layout
- **JavaScript-Powered**: CSS provides base grid, JS handles positioning
- **Responsive Columns**: 1-5 columns based on screen size
- **Landscape Enhancement**: 2-column span for landscape images on desktop (≥769px)
- **Sharp Rectangles**: `border-radius: 0` throughout for modern aesthetic

### Typography System
- **Primary Font**: Futura PT with Avenir Next, Helvetica Neue fallbacks
- **Hover Effects**: Complete black backgrounds (#000) with white text
- **Smooth Transitions**: 0.4s cubic-bezier timing for professional feel
- **Letter Spacing**: Strategic spacing (0.02em navigation, 0.1em headings)

### Mobile-First Approach
- **Progressive Enhancement**: Desktop sidebar → Mobile hamburger menu
- **Touch Optimization**: Larger buttons, full-screen overlays
- **Gesture-Friendly**: Swipe interactions, touch targets ≥44px

The CSS architecture supports the JavaScript masonry system while maintaining clean separation of concerns. All hover states use consistent black/white theming with sharp rectangular design language.