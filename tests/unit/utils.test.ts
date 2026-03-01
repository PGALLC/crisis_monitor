import { add, greet } from '../../src/utils';

describe('Utility Functions', () => {
  describe('add()', () => {
    it('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(add(-1, 1)).toBe(0);
    });

    it('should return zero when both args are zero', () => {
      expect(add(0, 0)).toBe(0);
    });
  });

  describe('greet()', () => {
    it('should return a greeting with the given name', () => {
      expect(greet('World')).toBe('Hello, World!');
    });

    it('should include the name in the greeting', () => {
      expect(greet('Crisis Monitor')).toContain('Crisis Monitor');
    });
  });
});
