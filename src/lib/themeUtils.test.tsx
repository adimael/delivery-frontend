import { render, screen } from '@testing-library/react';
import { applyPlatformTheme } from './themeUtils';

// Mock the document object
const mockDocument = {
  documentElement: {
    style: {
      setProperty: jest.fn(),
    },
  },
  querySelector: jest.fn().mockReturnValue({
    setAttribute: jest.fn(),
  }),
  title: '',
};

// Replace the global document with our mock
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

describe('Theme Utilities', () => {
  describe('applyPlatformTheme', () => {
    it('should apply all theme properties to CSS variables', () => {
      const theme = {
        nome_plataforma: 'Test Platform',
        cor_primaria: '#ff0000',
        cor_secundaria: '#00ff00',
        cor_navbar: '#111111',
        cor_footer: '#222222',
        cor_section_header: '#333333',
        cor_section_produtos: '#444444',
        cor_section_comprar: '#555555',
        cor_section_contato: '#666666',
        cor_botoes: '#777777',
        cor_icones: '#888888',
      };

      applyPlatformTheme(theme);

      // Verify that setProperty was called for each color
      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--navbar-bg',
        '0 0% 7%'
      );
      
      expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith(
        '--footer-bg',
        '0 0% 13%'
      );
      
      // Verify that the document title was set
      expect(mockDocument.title).toBe('Test Platform');
    });

    it('should handle missing theme properties gracefully', () => {
      const theme = {
        nome_plataforma: 'Test Platform',
      };

      applyPlatformTheme(theme);

      // Verify that the document title was set
      expect(mockDocument.title).toBe('Test Platform');
      
      // Verify that setProperty was not called for missing colors
      expect(mockDocument.documentElement.style.setProperty).not.toHaveBeenCalledWith(
        '--navbar-bg',
        expect.anything()
      );
    });
  });
});