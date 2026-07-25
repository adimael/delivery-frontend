# Testing Theme Customization

This document explains how to test the platform theme customization feature to ensure it's working correctly.

## How to Test Theme Customization

### 1. Access the Manager Dashboard
1. Log in as a manager user
2. Navigate to the Dashboard
3. Go to "Configurações" (Settings)

### 2. Modify Platform Customization
1. In the "Personalização da Plataforma" section:
   - Change the "Nome da Plataforma" to a new name
   - Modify the "Cor Primária" to a different color
   - Modify the "Cor Secundária" to a different color
   - Customize individual component colors as desired
2. Click "Salvar Configurações" (Save Settings)

### 3. Verify Changes on Home Page
1. Navigate to the home page (http://localhost:8081/)
2. Check that the following elements have updated:
   - Browser tab title should match the new platform name
   - Page sections should use the new colors
   - Buttons should use the button color
   - Icons should use the icon color

### 4. Using the Theme Debugger
A theme debugger component has been added to the bottom right of the home page that displays:
- Current platform name
- All color values being applied

This helps verify that the theme is being properly applied.

## Troubleshooting

### If Changes Don't Appear
1. **Check browser console**: Look for any JavaScript errors
2. **Verify network requests**: Check if the PUT request to `/api/configuracao` is successful
3. **Check database**: Verify that the configuration table has been updated with new values
4. **Clear browser cache**: Hard refresh the page (Ctrl+F5)

### Common Issues
1. **Database columns missing**: Ensure all required columns exist in the `configuracao_estabelecimento` table
2. **CSS variables not updating**: Check that the `applyPlatformTheme` function is being called with all color values
3. **Component not using CSS variables**: Verify that components are using the correct CSS variable references

## Expected Behavior

When you save configuration changes:
1. The browser tab title should immediately update to the new platform name
2. All page sections should reflect the new colors
3. Buttons and icons should use their respective colors
4. The changes should persist across page refreshes

## Removing the Theme Debugger

For production deployment, remove the ThemeDebugger component from the Index page:

```tsx
// Remove this line from Index.tsx
import { ThemeDebugger } from "@/components/ThemeDebugger";

// Remove this element from the JSX
<ThemeDebugger />
```