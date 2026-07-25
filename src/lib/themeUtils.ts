// Utility functions for handling platform theme customization

export interface PlatformTheme {
  nome_plataforma?: string;
  cor_primaria?: string;
  cor_secundaria?: string;
  cor_navbar?: string;
  cor_footer?: string;
  cor_section_header?: string;
  cor_section_produtos?: string;
  cor_section_comprar?: string;
  cor_section_contato?: string;
  cor_botoes?: string;
  cor_icones?: string;
}

/**
 * Converts a hex color to HSL format
 * @param hex - Hex color string (e.g., "#3b82f6")
 * @returns HSL string (e.g., "210 100% 50%")
 */
export const hexToHsl = (hex: string): string => {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse r, g, b values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Find min and max values
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h = h * 60;
  }
  
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

/**
 * Applies the platform theme to the document
 * @param theme - The theme configuration
 */
export const applyPlatformTheme = (theme: PlatformTheme) => {
  // Apply navbar color
  if (theme.cor_navbar) {
    const hslNavbar = hexToHsl(theme.cor_navbar);
    document.documentElement.style.setProperty('--navbar-bg', hslNavbar);
    // Also update the primary color to match navbar if it's not set
    if (!theme.cor_primaria) {
      document.documentElement.style.setProperty('--primary', hslNavbar);
    }
  }
  
  // Apply footer color
  if (theme.cor_footer) {
    const hslFooter = hexToHsl(theme.cor_footer);
    document.documentElement.style.setProperty('--footer-bg', hslFooter);
    // Also update the secondary color to match footer if it's not set
    if (!theme.cor_secundaria) {
      document.documentElement.style.setProperty('--secondary', hslFooter);
    }
  }
  
  // Apply section colors
  if (theme.cor_section_header) {
    const hslSectionHeader = hexToHsl(theme.cor_section_header);
    document.documentElement.style.setProperty('--section-header-bg', hslSectionHeader);
  }
  
  if (theme.cor_section_produtos) {
    const hslSectionProdutos = hexToHsl(theme.cor_section_produtos);
    document.documentElement.style.setProperty('--section-produtos-bg', hslSectionProdutos);
  }
  
  if (theme.cor_section_comprar) {
    const hslSectionComprar = hexToHsl(theme.cor_section_comprar);
    document.documentElement.style.setProperty('--section-comprar-bg', hslSectionComprar);
  }
  
  if (theme.cor_section_contato) {
    const hslSectionContato = hexToHsl(theme.cor_section_contato);
    document.documentElement.style.setProperty('--section-contato-bg', hslSectionContato);
  }
  
  // Apply button color
  if (theme.cor_botoes) {
    const hslBotoes = hexToHsl(theme.cor_botoes);
    document.documentElement.style.setProperty('--button-primary-bg', hslBotoes);
    // Also update the primary color to match buttons
    document.documentElement.style.setProperty('--primary', hslBotoes);
  }
  
  // Apply icon color
  if (theme.cor_icones) {
    const hslIcones = hexToHsl(theme.cor_icones);
    document.documentElement.style.setProperty('--icon-color', hslIcones);
  }
  
  // Update meta theme color for mobile browsers
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta && theme.cor_navbar) {
    themeColorMeta.setAttribute('content', theme.cor_navbar);
  }
};

/**
 * Gets the default platform theme
 */
export const getDefaultPlatformTheme = (): PlatformTheme => ({
  nome_plataforma: 'Meu Delivery',
  cor_primaria: '#3b82f6',
  cor_secundaria: '#1e40af',
  cor_navbar: '#3b82f6',
  cor_footer: '#1e40af',
  cor_section_header: '#f3f4f6',
  cor_section_produtos: '#ffffff',
  cor_section_comprar: '#f9fafb',
  cor_section_contato: '#3b82f6',
  cor_botoes: '#3b82f6',
  cor_icones: '#3b82f6'
});

/**
 * Updates the document title with the platform name
 * @param nome_plataforma - The platform name
 */
export const updateDocumentTitle = (nome_plataforma?: string) => {
  if (nome_plataforma) {
    document.title = nome_plataforma;
  }
};
