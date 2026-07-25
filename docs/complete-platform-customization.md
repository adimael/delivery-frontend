# Complete Platform Customization Guide

This document explains how the platform customization system works across all pages of the ADR Modas application.

## Overview

The platform customization system allows managers to change the platform name and colors through the dashboard settings page. These changes are applied consistently across all pages of the application, including:

1. Navigation bar (header)
2. Main content sections
3. Footer
4. Buttons and links
5. Special sections (like contact areas)

## How It Works

### 1. Configuration Storage

The customization settings are stored in the `configuracao_estabelecimento` table with these fields:

- `nome_plataforma`: The platform name (default: "ADR Modas")
- `cor_primaria`: Primary color in hex format (default: "#3b82f6")
- `cor_secundaria`: Secondary color in hex format (default: "#1e40af")

### 2. Theme Application

The theme is applied through these mechanisms:

1. **CSS Variables**: The theme colors are converted to HSL format and applied as CSS variables
2. **Component Classes**: Predefined CSS classes use these variables for consistent styling
3. **Dynamic Updates**: Changes are applied immediately when settings are saved

### 3. CSS Implementation

The theme is implemented using CSS variables in `src/index.css`:

```css
:root {
  --platform-primary: 210 100% 50%; /* #3b82f6 */
  --platform-secondary: 220 100% 30%; /* #1e40af */
  --navbar-bg: 210 100% 50%; /* #3b82f6 */
  --footer-bg: 220 100% 30%; /* #1e40af */
  --button-primary-bg: 210 100% 50%; /* #3b82f6 */
  --button-secondary-bg: 220 100% 30%; /* #1e40af */
  --link-color: 210 100% 50%; /* #3b82f6 */
}
```

### 4. Component Updates

All main components have been updated to use themed colors:

#### Navigation Bar (`MainNavbar.tsx`)
- Uses `navbar-themed` class for background
- Links use `link-themed` class for consistent coloring

#### Footer (`Footer.tsx`)
- Uses `footer-themed` class for background
- Links use `link-themed` class for consistent coloring

#### Main Pages
- **Index Page**: Buttons use `btn-primary` class, contact section uses primary color
- **Product Detail Page**: Prices and buttons use primary color
- **Cart Page**: Total price and buttons use primary color
- **Login Page**: Tabs and buttons use primary color

## Customization Classes

The following CSS classes are available for consistent theme application:

| Class | Purpose | Usage |
|-------|---------|-------|
| `navbar-themed` | Navigation bar background | `<nav className="navbar-themed">` |
| `footer-themed` | Footer background | `<footer className="footer-themed">` |
| `btn-primary` | Primary buttons | `<Button className="btn-primary">` |
| `btn-secondary` | Secondary buttons | `<Button className="btn-secondary">` |
| `link-themed` | Themed links | `<a className="link-themed">` |
| `platform-primary` | Primary color background | `<div className="platform-primary">` |
| `platform-secondary` | Secondary color background | `<div className="platform-secondary">` |

## Color Variables

The following CSS variables are available for direct use:

| Variable | Purpose | Example Usage |
|----------|---------|---------------|
| `--platform-primary` | Primary color (HSL) | `color: hsl(var(--platform-primary))` |
| `--platform-secondary` | Secondary color (HSL) | `background-color: hsl(var(--platform-secondary))` |
| `--navbar-bg` | Navbar background | `background-color: hsl(var(--navbar-bg))` |
| `--footer-bg` | Footer background | `background-color: hsl(var(--footer-bg))` |
| `--button-primary-bg` | Primary button background | `background-color: hsl(var(--button-primary-bg))` |
| `--button-secondary-bg` | Secondary button background | `background-color: hsl(var(--button-secondary-bg))` |
| `--link-color` | Link color | `color: hsl(var(--link-color))` |

## Implementation Details

### Theme Utility Functions

The `src/lib/themeUtils.ts` file contains functions for:

1. Converting hex colors to HSL format
2. Applying theme to document CSS variables
3. Updating document title with platform name

### Real-time Updates

The theme updates automatically when:

1. The configuration is loaded on app startup
2. Settings are saved in the Manager Settings page
3. Any component re-renders with new theme data

## Adding New Themed Components

To add theme support to new components:

1. Use existing themed classes where appropriate
2. Reference CSS variables directly for custom styling
3. Ensure components respond to theme changes by using reactive data

Example:
```tsx
// Using themed button class
<Button className="btn-primary">Primary Action</Button>

// Using CSS variables directly
<div style={{ 
  backgroundColor: 'hsl(var(--platform-primary))',
  color: 'white'
}}>
  Themed Content
</div>
```

## Testing Theme Changes

To test theme changes:

1. Access the Manager Dashboard
2. Navigate to Configurações
3. Modify the platform name and colors
4. Save the settings
5. Observe changes across all pages

The changes should be immediately visible without requiring a page refresh.