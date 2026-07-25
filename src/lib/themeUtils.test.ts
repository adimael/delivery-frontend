import { hexToHsl } from './themeUtils';

describe('Theme Utilities', () => {
  describe('hexToHsl', () => {
    it('should convert blue hex to HSL', () => {
      const result = hexToHsl('#3b82f6');
      expect(result).toBe('210 94% 60%');
    });

    it('should convert dark blue hex to HSL', () => {
      const result = hexToHsl('#1e40af');
      expect(result).toBe('221 70% 40%');
    });

    it('should handle hex without #', () => {
      const result = hexToHsl('3b82f6');
      expect(result).toBe('210 94% 60%');
    });
  });
});