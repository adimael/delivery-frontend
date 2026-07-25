# Platform Color Relationships

This document explains how the platform customization system manages the relationship between primary/secondary colors and component-specific colors.

## Color Hierarchy

The platform customization system uses a hierarchical approach to color management:

1. **Primary and Secondary Colors** - These are the main brand colors that serve as defaults for other components
2. **Component-Specific Colors** - These are colors for individual UI components that can inherit from or override the primary/secondary colors

## Default Relationships

By default, the following relationships exist between primary/secondary colors and component-specific colors:

| Component | Default Color | Relationship to Primary/Secondary |
|-----------|---------------|-----------------------------------|
| Navigation Bar | Primary Color | Inherits from `cor_primaria` |
| Footer | Secondary Color | Inherits from `cor_secundaria` |
| Header Section | Light Gray | Independent |
| Products Section | White | Independent |
| How to Buy Section | Very Light Gray | Independent |
| Contact Section | Primary Color | Inherits from `cor_primaria` |
| Buttons | Primary Color | Inherits from `cor_primaria` |
| Icons | Primary Color | Inherits from `cor_primaria` |

## How Inheritance Works

When a manager sets or changes a primary/secondary color, the system automatically updates dependent component colors if they currently match the previous primary/secondary color value. This ensures consistency while still allowing individual customization.

### Example Workflow

1. Manager sets `cor_primaria` to `#3b82f6` (blue)
2. Components that inherit from primary color are automatically set to `#3b82f6`:
   - Navigation Bar
   - Contact Section
   - Buttons
   - Icons
3. Manager later changes `cor_primaria` to `#ef4444` (red)
4. All components that were using the previous blue color are automatically updated to red
5. Components that were manually customized to a different color (e.g., green) remain unchanged

## Implementation Details

### Frontend Implementation

The Manager Settings page implements this relationship through:

1. **Initial State Setup**: Component colors default to primary/secondary colors when loading configuration
2. **Dynamic Updates**: When primary/secondary colors change, dependent component colors are updated if they match the previous value
3. **Manual Override**: Individual component colors can be manually changed to break the inheritance relationship

### Backend Implementation

The configuration is stored in the `configuracao_estabelecimento` table with separate fields for each color:

- `cor_primaria` - Primary brand color
- `cor_secundaria` - Secondary brand color
- `cor_navbar` - Navigation bar color
- `cor_footer` - Footer color
- `cor_section_header` - Header section color
- `cor_section_produtos` - Products section color
- `cor_section_comprar` - "How to Buy" section color
- `cor_section_contato` - Contact section color
- `cor_botoes` - Button color
- `cor_icones` - Icon color

### CSS Implementation

Colors are applied through CSS variables in `src/index.css`:

```css
:root {
  --navbar-bg: 210 100% 50%; /* Derived from cor_navbar */
  --footer-bg: 220 100% 30%; /* Derived from cor_footer */
  --section-header-bg: 210 100% 50%; /* Derived from cor_section_header */
  --section-produtos-bg: 210 100% 50%; /* Derived from cor_section_produtos */
  --section-comprar-bg: 210 100% 50%; /* Derived from cor_section_comprar */
  --section-contato-bg: 210 100% 50%; /* Derived from cor_section_contato */
  --button-primary-bg: 210 100% 50%; /* Derived from cor_botoes */
  --icon-color: 210 100% 50%; /* Derived from cor_icones */
}
```

## Best Practices for Managers

1. **Start with Primary/Secondary Colors**: Set your main brand colors first
2. **Customize Components as Needed**: Only manually change component colors when you need them to differ from the brand colors
3. **Use Consistent Color Scheme**: Maintain visual consistency by using related colors
4. **Test Across Pages**: Check how colors appear on different pages after making changes

## Technical Implementation

### Color Conversion

All hex colors are converted to HSL format for better CSS integration and theming capabilities:

```typescript
const hexToHsl = (hex: string): string => {
  // Convert #RRGGBB to HSL format
  // Returns "H S L" string for CSS variable usage
};
```

### Theme Application

The theme is applied through the `applyPlatformTheme` function:

```typescript
export const applyPlatformTheme = (theme: PlatformTheme) => {
  // Apply each color to its corresponding CSS variable
  // Update meta theme color for mobile browsers
};
```

## Database Schema

The configuration table structure supports the color relationship system:

```sql
CREATE TABLE configuracao_estabelecimento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome_plataforma VARCHAR(255) DEFAULT 'ADR Modas',
  cor_primaria VARCHAR(7) DEFAULT '#3b82f6',
  cor_secundaria VARCHAR(7) DEFAULT '#1e40af',
  cor_navbar VARCHAR(7) DEFAULT '#3b82f6',
  cor_footer VARCHAR(7) DEFAULT '#1e40af',
  cor_section_header VARCHAR(7) DEFAULT '#f3f4f6',
  cor_section_produtos VARCHAR(7) DEFAULT '#ffffff',
  cor_section_comprar VARCHAR(7) DEFAULT '#f9fafb',
  cor_section_contato VARCHAR(7) DEFAULT '#3b82f6',
  cor_botoes VARCHAR(7) DEFAULT '#3b82f6',
  cor_icones VARCHAR(7) DEFAULT '#3b82f6',
  -- other fields...
);
```

This structure allows for both inheritance (through default values) and individual customization (through explicit values).