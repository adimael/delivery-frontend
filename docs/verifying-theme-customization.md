# Verifying Theme Customization

This document explains how to verify that the platform theme customization feature is working correctly.

## How to Verify Theme Customization

### 1. Check Browser Console
Open the browser's developer tools and check the console for any errors when:
- Loading the page
- Saving configuration changes
- Navigating between pages

### 2. Verify Network Requests
In the browser's developer tools Network tab:
1. Look for the PUT request to `/api/configuracao` when saving settings
2. Verify that the request completes successfully (status 200)
3. Check that the response contains `{ success: true }`

### 3. Check Database Values
Verify that the configuration table in the database has been updated:
```sql
SELECT 
  nome_plataforma,
  cor_primaria,
  cor_secundaria,
  cor_navbar,
  cor_footer,
  cor_section_header,
  cor_section_produtos,
  cor_section_comprar,
  cor_section_contato,
  cor_botoes,
  cor_icones
FROM configuracao_estabelecimento 
LIMIT 1;
```

### 4. Verify CSS Variables
In the browser's developer tools:
1. Inspect elements on the page
2. Check that CSS variables are being applied correctly:
   - `--navbar-bg` should match the navbar color
   - `--footer-bg` should match the footer color
   - `--button-primary-bg` should match the button color
   - etc.

### 5. Visual Verification
Check that the following elements update with new colors:
- Navigation bar background
- Footer background
- Header section background
- Products section background
- "How to Buy" section background
- Contact section background
- Buttons
- Icons

### 6. Platform Name Verification
Check that:
- Browser tab title updates to the new platform name
- The platform name appears correctly on the page

## Common Issues and Solutions

### Issue: Changes Don't Appear After Saving
**Solution**: 
1. Hard refresh the page (Ctrl+F5)
2. Check browser console for errors
3. Verify network request was successful

### Issue: Database Columns Missing
**Solution**:
1. Run the database update script:
   ```bash
   cd backend
   node update_platform_fields.js
   ```

### Issue: CSS Variables Not Updating
**Solution**:
1. Check that the `applyPlatformTheme` function in `themeUtils.ts` is being called
2. Verify that all color properties are being passed to the function
3. Check that the function is setting all CSS variables correctly

### Issue: Component Not Using CSS Variables
**Solution**:
1. Inspect the component in browser dev tools
2. Verify that the component is using the correct CSS classes
3. Check that CSS variables are defined in `index.css`

## Testing Procedure

### Step 1: Set Test Values
1. Go to Manager Dashboard → Configurações
2. Set the following test values:
   - Platform Name: "Test Platform"
   - Primary Color: #ff0000 (Red)
   - Secondary Color: #00ff00 (Green)
   - Navbar Color: #111111 (Dark Gray)
   - Footer Color: #222222 (Darker Gray)

### Step 2: Save and Verify
1. Click "Salvar Configurações"
2. Check browser console for errors
3. Verify network request success
4. Refresh the page
5. Check that:
   - Browser tab title is "Test Platform"
   - Navbar is dark gray
   - Footer is darker gray
   - Other elements use appropriate colors

### Step 3: Reset Values
1. Change values back to defaults:
   - Platform Name: "ADR Modas"
   - Primary Color: #3b82f6 (Blue)
   - Secondary Color: #1e40af (Dark Blue)
2. Save and verify changes

## Debugging Tools

### Theme Debugger Component
A debugging component has been added to the bottom right of the home page that displays:
- Current platform name
- All color values being applied

This helps verify that the theme is being properly applied.

To remove the debugger in production:
1. Remove the import in `Index.tsx`:
   ```tsx
   import { ThemeDebugger } from "@/components/ThemeDebugger";
   ```
2. Remove the component from the JSX:
   ```tsx
   <ThemeDebugger />
   ```