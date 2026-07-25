# Detailed Platform Customization Guide

This document explains the enhanced platform customization system that allows managers to customize each part of the platform separately.

## Overview

The detailed platform customization system allows managers to change the platform name and customize colors for each specific part of the platform through the dashboard settings page. These changes are applied consistently across all pages of the application.

## Customizable Components

The following components can be customized with separate colors:

1. **Platform Name** - The name that appears in the browser tab
2. **Primary Color** - Main brand color (fallback for other components)
3. **Secondary Color** - Secondary brand color (fallback for other components)
4. **Navigation Bar** - Header/navigation background color
5. **Footer** - Footer background color
6. **Header Section** - Main header/banner background color
7. **Products Section** - Product listing section background color
8. **How to Buy Section** - "Como Comprar" section background color
9. **Contact Section** - Contact section background color
10. **Buttons** - Primary button background color
11. **Icons** - Icon color throughout the platform

## How It Works

### 1. Configuration Storage

The customization settings are stored in the `configuracao_estabelecimento` table with these fields:

- `nome_plataforma`: The platform name (default: "ADR Modas")
- `cor_primaria`: Primary color in hex format (default: "#3b82f6")
- `cor_secundaria`: Secondary color in hex format (default: "#1e40af")
- `cor_navbar`: Navigation bar color (default: "#3b82f6")
- `cor_footer`: Footer color (default: "#1e40af")
- `cor_section_header`: Header section color (default: "#f3f4f6")
- `cor_section_produtos`: Products section color (default: "#ffffff")
- `cor_section_comprar`: "Como Comprar" section color (default: "#f9fafb")
- `cor_section_contato`: Contact section color (default: "#3b82f6")
- `cor_botoes`: Button color (default: "#3b82f6")
- `cor_icones`: Icon color (default: "#3b82f6")

### 2. Theme Application

The theme is applied through these mechanisms:

1. **CSS Variables**: Each color is converted to HSL format and applied as CSS variables
2. **Component Classes**: Predefined CSS classes use these variables for consistent styling
3. **Dynamic Updates**: Changes are applied immediately when settings are saved

### 3. CSS Implementation

The theme is implemented using CSS variables in `src/index.css`:

```css
:root {
  --navbar-bg: 210 100% 50%; /* #3b82f6 */
  --footer-bg: 220 100% 30%; /* #1e40af */
  --section-header-bg: 210 100% 50%; /* #3b82f6 */
  --section-produtos-bg: 210 100% 50%; /* #3b82f6 */
  --section-comprar-bg: 210 100% 50%; /* #3b82f6 */
  --section-contato-bg: 210 100% 50%; /* #3b82f6 */
  --button-primary-bg: 210 100% 50%; /* #3b82f6 */
  --button-secondary-bg: 220 100% 30%; /* #1e40af */
  --icon-color: 210 100% 50%; /* #3b82f6 */
}
```

### 4. Component Updates

All main components have been updated to use specific colors:

#### Navigation Bar (`MainNavbar.tsx`)
- Uses `navbar-themed` class for background
- Icons use `icon-themed` class for consistent coloring

#### Footer (`Footer.tsx`)
- Uses `footer-themed` class for background
- Links use `link-themed` class for consistent coloring

#### Main Pages
- **Index Page**: Each section uses its specific background color
- **Product Detail Page**: Prices and buttons use button color
- **Cart Page**: Total price and buttons use button color
- **Login Page**: Tabs and buttons use button color

## Customization Classes

The following CSS classes are available for consistent theme application:

| Class | Purpose | Usage |
|-------|---------|-------|
| `navbar-themed` | Navigation bar background | `<nav className="navbar-themed">` |
| `footer-themed` | Footer background | `<footer className="footer-themed">` |
| `btn-primary` | Primary buttons | `<Button className="btn-primary">` |
| `btn-secondary` | Secondary buttons | `<Button className="btn-secondary">` |
| `link-themed` | Themed links | `<a className="link-themed">` |
| `icon-themed` | Themed icons | `<Icon className="icon-themed">` |

## Color Variables

The following CSS variables are available for direct use:

| Variable | Purpose | Example Usage |
|----------|---------|---------------|
| `--navbar-bg` | Navbar background | `background-color: hsl(var(--navbar-bg))` |
| `--footer-bg` | Footer background | `background-color: hsl(var(--footer-bg))` |
| `--section-header-bg` | Header section background | `background-color: hsl(var(--section-header-bg))` |
| `--section-produtos-bg` | Products section background | `background-color: hsl(var(--section-produtos-bg))` |
| `--section-comprar-bg` | "Como Comprar" section background | `background-color: hsl(var(--section-comprar-bg))` |
| `--section-contato-bg` | Contact section background | `background-color: hsl(var(--section-contato-bg))` |
| `--button-primary-bg` | Primary button background | `background-color: hsl(var(--button-primary-bg))` |
| `--button-secondary-bg` | Secondary button background | `background-color: hsl(var(--button-secondary-bg))` |
| `--icon-color` | Icon color | `color: hsl(var(--icon-color))` |

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
  backgroundColor: 'hsl(var(--section-header-bg))',
  color: 'white'
}}>
  Themed Content
</div>
```

## Testing Theme Changes

To test theme changes:

1. Access the Manager Dashboard
2. Navigate to Configurações
3. Modify the platform name and colors for each component
4. Save the settings
5. Observe changes across all pages

The changes should be immediately visible without requiring a page refresh.

## Database Migration

To apply the new customization fields to an existing database:

### MySQL
```sql
ALTER TABLE configuracao_estabelecimento 
ADD COLUMN IF NOT EXISTS nome_plataforma VARCHAR(255) DEFAULT 'ADR Modas' AFTER id,
ADD COLUMN IF NOT EXISTS cor_primaria VARCHAR(7) DEFAULT '#3b82f6' AFTER nome_plataforma,
ADD COLUMN IF NOT EXISTS cor_secundaria VARCHAR(7) DEFAULT '#1e40af' AFTER cor_primaria,
ADD COLUMN IF NOT EXISTS cor_navbar VARCHAR(7) DEFAULT '#3b82f6' AFTER cor_secundaria,
ADD COLUMN IF NOT EXISTS cor_footer VARCHAR(7) DEFAULT '#1e40af' AFTER cor_navbar,
ADD COLUMN IF NOT EXISTS cor_section_header VARCHAR(7) DEFAULT '#f3f4f6' AFTER cor_footer,
ADD COLUMN IF NOT EXISTS cor_section_produtos VARCHAR(7) DEFAULT '#ffffff' AFTER cor_section_header,
ADD COLUMN IF NOT EXISTS cor_section_comprar VARCHAR(7) DEFAULT '#f9fafb' AFTER cor_section_produtos,
ADD COLUMN IF NOT EXISTS cor_section_contato VARCHAR(7) DEFAULT '#3b82f6' AFTER cor_section_comprar,
ADD COLUMN IF NOT EXISTS cor_botoes VARCHAR(7) DEFAULT '#3b82f6' AFTER cor_section_contato,
ADD COLUMN IF NOT EXISTS cor_icones VARCHAR(7) DEFAULT '#3b82f6' AFTER cor_botoes;
```

### Supabase
```sql
ALTER TABLE public.configuracao_estabelecimento 
ADD COLUMN IF NOT EXISTS nome_plataforma TEXT DEFAULT 'ADR Modas',
ADD COLUMN IF NOT EXISTS cor_primaria TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS cor_secundaria TEXT DEFAULT '#1e40af',
ADD COLUMN IF NOT EXISTS cor_navbar TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS cor_footer TEXT DEFAULT '#1e40af',
ADD COLUMN IF NOT EXISTS cor_section_header TEXT DEFAULT '#f3f4f6',
ADD COLUMN IF NOT EXISTS cor_section_produtos TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS cor_section_comprar TEXT DEFAULT '#f9fafb',
ADD COLUMN IF NOT EXISTS cor_section_contato TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS cor_botoes TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS cor_icones TEXT DEFAULT '#3b82f6';
```