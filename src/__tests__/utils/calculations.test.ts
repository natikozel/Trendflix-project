import { calculateMatchPercentage } from '@/components/ui/MovieScore';
import { jest } from '@jest/globals';

describe('MovieScore utility functions', () => {
  describe('calculateMatchPercentage', () => {
    test('returns 0 for undefined or empty input', () => {
      expect(calculateMatchPercentage(undefined)).toBe(0);
      expect(calculateMatchPercentage('')).toBe(0);
    });

    test('handles string inputs by converting to numbers', () => {
      expect(calculateMatchPercentage('0.05')).toBe(calculateMatchPercentage(0.05));
      expect(calculateMatchPercentage('0.2')).toBe(calculateMatchPercentage(0.2));
    });

    test('returns max 99% for very high similarity scores', () => {
      expect(calculateMatchPercentage(0.5)).toBe(99);
      expect(calculateMatchPercentage(0.9)).toBe(99);
      expect(calculateMatchPercentage(1.0)).toBe(99);
    });

    test('returns appropriate values for high similarity scores', () => {
      const score = calculateMatchPercentage(0.15);
      expect(score).toBeGreaterThan(80);
      expect(score).toBeLessThanOrEqual(98);
    });

    test('returns appropriate values for medium similarity scores', () => {
      const score = calculateMatchPercentage(0.07);
      expect(score).toBeGreaterThanOrEqual(60);
      expect(score).toBeLessThanOrEqual(80);
    });

    test('returns appropriate values for low similarity scores', () => {
      const score = calculateMatchPercentage(0.03);
      expect(score).toBeGreaterThanOrEqual(50);
      expect(score).toBeLessThan(60);
    });

    test('ensures percentage never exceeds 99%', () => {
      // Test with extremely high value
      expect(calculateMatchPercentage(5.0)).toBe(99);
    });
  });
}); 