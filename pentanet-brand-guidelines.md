# Pentanet Brand Guidelines
## Web Development & Design Reference Document

---

## Table of Contents
1. [Brand Overview](#brand-overview)
2. [Logo Usage](#logo-usage)
3. [Color Palette](#color-palette)
4. [Typography](#typography)
5. [UI Components](#ui-components)
6. [Spacing System](#spacing-system)
7. [Design Principles](#design-principles)
8. [Voice & Tone](#voice--tone)
9. [Implementation Guidelines](#implementation-guidelines)

---

## Brand Overview

**Company:** Pentanet  
**Tagline:** "Perth's own internet, built and supported by Perth people"  
**Industry:** Telecommunications, Internet Service Provider  
**Location:** Perth, Western Australia  

### Brand Positioning
- Next-level internet provider
- 100% Perth locals with local support
- Innovation and technology focused
- Gaming and esports credibility
- "Penta-spec service" - accepting nothing less than the best

### Key Brand Messages
- **Local Identity:** "We're 100% Perth locals"
- **Quality:** "Penta-spec service - We accept nothing less than the best"
- **Support:** "Only a call away - local support"
- **Performance:** "Consistently fast"

---

## Logo Usage

### Primary Logo
The Pentanet logo consists of:
- **Pentagon Icon:** Stylized orange pentagon shape
- **PENTA Text:** Black color, bold sans-serif font
- **NET Text:** Orange color, bold sans-serif font  
- **Special Feature:** Letter 'A' in PENTA replaced with triangular geometric shape

### Logo Specifications
- **Primary Colors:** Orange (#FF6600) and Black (#000000)
- **Style:** Modern, geometric, tech-forward
- **Background:** Works on white, light backgrounds, and dark backgrounds
- **Minimum Size:** 120px width for digital, 1 inch for print
- **Clear Space:** Minimum clear space equal to the height of the pentagon icon

### Logo Variations
- **Full Color:** Orange pentagon + "PENTA" in black + "NET" in orange
- **Reverse:** White version for dark backgrounds
- **Monochrome:** Single color version when needed

---

## Color Palette

### Primary Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **Pentanet Orange** | #FF6600 | 255, 102, 0 | Primary brand color, CTAs, accents, logo |
| **Pentanet Black** | #000000 | 0, 0, 0 | Text, logo, headers |

### Secondary Colors

| Color Name | Hex Code | RGB | Usage |
|------------|----------|-----|-------|
| **White** | #FFFFFF | 255, 255, 255 | Background, text on dark |
| **Dark Grey** | #333333 | 51, 51, 51 | Secondary text, borders |
| **Light Grey** | #F5F5F5 | 245, 245, 245 | Backgrounds, cards |

### Color Usage Guidelines
- **Orange:** Use for primary CTAs, links, highlights, and brand accents
- **Black:** Primary text color, headers, navigation
- **Dark Grey:** Secondary text, captions, borders
- **White:** Clean backgrounds, text on dark backgrounds
- **Light Grey:** Card backgrounds, subtle sections

---

## Typography

### Font Stack
**Primary:** Modern sans-serif fonts (system fonts recommended for web)
- **Web:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- **Fallback:** Arial, Helvetica, sans-serif

### Type Scale

| Element | Font Size | Font Weight | Color | Line Height |
|---------|-----------|-------------|-------|-------------|
| **Primary Heading (H1)** | 48-64px | Bold (700-800) | Black (#000000) | 1.2 |
| **Secondary Heading (H2)** | 32-40px | Bold (700) | Black (#000000) | 1.3 |
| **Tertiary Heading (H3)** | 24-28px | Semi-bold (600) | Black (#000000) | 1.4 |
| **Body Text** | 16-18px | Regular (400) | Dark Grey (#333333) | 1.6 |
| **Small Text** | 12-14px | Regular (400) | Dark Grey (#333333) | 1.5 |
| **Button Text** | 16-18px | Bold (700) | White or Black | 1 |
| **Navigation** | 14-16px | Medium (500-600) | Black (#000000) | 1.2 |

### Typography Guidelines
- Maintain consistent vertical rhythm
- Use font weights strategically for hierarchy
- Ensure sufficient contrast for accessibility
- Keep line lengths between 45-75 characters for readability

---

## UI Components

### Buttons

| Button Type | Background | Text Color | Border | Hover State | Padding | Border Radius |
|-------------|------------|------------|---------|-------------|---------|---------------|
| **Primary CTA** | Orange (#FF6600) | White (#FFFFFF) | None | Darker orange (#E65500) | 12-16px 24-32px | 4-8px |
| **Secondary** | Black (#000000) | White (#FFFFFF) | None | Dark grey (#222222) | 12-16px 24-32px | 4-8px |
| **Outline** | Transparent | Orange (#FF6600) | 2px solid Orange | Orange bg, white text | 12-16px 24-32px | 4-8px |
| **Text Link** | None | Orange (#FF6600) | Underline on hover | Orange with underline | 0 | N/A |

### Cards
- **Style:** Clean, modern cards with subtle shadows
- **Background:** White with light shadow (0 2px 4px rgba(0,0,0,0.1))
- **Border Radius:** 8-12px
- **Padding:** 24px
- **Border:** None (shadow provides definition)

### Forms & Inputs
- **Background:** White with grey border (#CCCCCC)
- **Border Radius:** 4-8px
- **Padding:** 12-16px
- **Focus State:** Orange border (#FF6600)
- **Error State:** Red border with error message

### Navigation
- **Style:** Fixed/sticky, minimal design
- **Background:** White or transparent
- **Typography:** 14-16px, Medium (500-600)
- **Active State:** Orange color or underline

### Icons
- **Style:** Line icons or solid icons, consistent style
- **Size:** 16px, 24px, 32px (depending on context)
- **Color:** Inherit from parent or Orange for accents

---

## Spacing System

| Scale | Pixels | Usage |
|-------|--------|-------|
| **xs** | 4px | Icon spacing, borders |
| **sm** | 8px | Tight spacing between related elements |
| **md** | 16px | Standard spacing between components |
| **lg** | 24px | Section padding, card spacing |
| **xl** | 32px | Large section breaks |
| **2xl** | 48px | Hero section padding |

### Implementation
```css
:root {
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
}
```

---

## Design Principles

### 1. Simplicity
- **Description:** Clean, uncluttered design that's easy to navigate
- **Visual Expression:** Minimalist layouts, clear hierarchy
- **Implementation:** Whitespace usage, focused content areas

### 2. Speed
- **Description:** Fast-loading, optimized for performance
- **Visual Expression:** Optimized images, efficient code
- **Implementation:** Compressed assets, minimal dependencies

### 3. Local Identity
- **Description:** Perth-focused messaging and community connection
- **Visual Expression:** Local imagery, Perth-centric content
- **Implementation:** Australian English, local testimonials, Perth references

### 4. Innovation
- **Description:** Cutting-edge technology and forward-thinking design
- **Visual Expression:** Modern UI patterns, subtle animations
- **Implementation:** Progressive enhancement, modern web standards

### 5. Gaming Culture
- **Description:** Appeal to gamers and esports enthusiasts
- **Visual Expression:** Dynamic visuals, tech aesthetics
- **Implementation:** Gaming-related imagery, performance metrics

### 6. Accessibility
- **Description:** Ensure design is accessible to all users
- **Visual Expression:** High contrast, readable fonts
- **Implementation:** WCAG 2.1 AA compliance, keyboard navigation

---

## Voice & Tone

### Brand Voice Characteristics
- **Professional yet approachable:** Knowledgeable but not intimidating
- **Technology-forward:** Comfortable with technical terms but explains clearly
- **Local and community-focused:** Friendly, neighborly, Perth-proud
- **Gaming/esports friendly:** Understanding of gaming culture and terminology
- **Customer-centric:** Always focused on solving customer problems

### Tone Guidelines
- **Confident:** We know our technology and services
- **Friendly:** Approachable and helpful
- **Clear:** Direct communication without jargon when possible
- **Enthusiastic:** Passionate about technology and service
- **Reliable:** Consistent and trustworthy messaging

---

## Implementation Guidelines

### CSS Variables
```css
:root {
  /* Colors */
  --color-orange: #FF6600;
  --color-orange-hover: #E65500;
  --color-black: #000000;
  --color-dark-grey: #333333;
  --color-light-grey: #F5F5F5;
  --color-white: #FFFFFF;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-size-h1: clamp(48px, 5vw, 64px);
  --font-size-h2: clamp(32px, 4vw, 40px);
  --font-size-h3: clamp(24px, 3vw, 28px);
  --font-size-body: 16px;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  
  /* Components */
  --border-radius: 8px;
  --border-radius-small: 4px;
  --border-radius-large: 12px;
  --shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

### Responsive Breakpoints
- **Mobile:** 320px - 768px
- **Tablet:** 768px - 1024px  
- **Desktop:** 1024px - 1200px
- **Large Desktop:** 1200px+

### Performance Guidelines
- Optimize images (WebP format when possible)
- Use system fonts to reduce load times
- Minimize CSS and JavaScript
- Implement lazy loading for images
- Use CDN for static assets

### Accessibility Checklist
- [ ] Minimum color contrast ratio of 4.5:1 for normal text
- [ ] Minimum color contrast ratio of 3:1 for large text
- [ ] All interactive elements keyboard accessible
- [ ] Alt text for all images
- [ ] Proper heading hierarchy
- [ ] Focus indicators visible
- [ ] Form labels properly associated

---

## Product Lines Reference

### Service Categories
- **Fixed Wireless Internet:** High-speed wireless connections
- **nbn® Plans:** National Broadband Network services  
- **neXus:** Next-generation mesh network technology
- **GeForce NOW:** Cloud gaming service (partnership with NVIDIA)
- **Opticomm:** Fiber optic services
- **Apartment Broadband:** High-rise specific solutions
- **Business Internet:** Commercial grade services
- **Fibre Solutions:** Enterprise fiber optic connections

---

*This document serves as the comprehensive brand guidelines for Pentanet web development and digital design projects. All web assets should align with these standards to maintain brand consistency and optimal user experience.*

**Last Updated:** October 2025  
**Version:** 1.0