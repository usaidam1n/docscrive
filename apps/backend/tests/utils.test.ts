import { estimateTokenCount, getDefaultConfiguration } from '../src/lib/utils';

describe('Backend Utilities', () => {
  describe('estimateTokenCount', () => {
    it('should return 0 for empty string', () => {
      expect(estimateTokenCount('')).toBe(0);
    });

    it('should estimate tokens correctly (approx 4 chars/token)', () => {
      expect(estimateTokenCount('1234')).toBe(1);
      expect(estimateTokenCount('12345678')).toBe(2);
      expect(estimateTokenCount('Hello World')).toBe(3); // 11 chars -> 2.75 -> 3
    });
  });

  describe('getDefaultConfiguration', () => {
    it('should return valid default configuration', () => {
      const config = getDefaultConfiguration();
      expect(config.style).toBe('comprehensive');
      expect(config.maxTotalFiles).toBe(500);
      expect(config.aiModel).toBeDefined();
    });
  });
});
