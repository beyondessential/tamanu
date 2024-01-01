import { runArithmetic } from '../dist/utils/arithmetic';

describe('Arithmetic', () => {
  describe('basics', () => {
    it('should perform an addition', () => {
      const result = runArithmetic('1 + 2');
      expect(result).toEqual(1 + 2);
    });

    it('should perform a subtraction', () => {
      const result = runArithmetic('1 - 2');
      expect(result).toEqual(1 - 2);
    });

    it('should handle double digits', () => {
      const result = runArithmetic('10 - 20');
      expect(result).toEqual(10 - 20);
    });

    it('should handle parentheses', () => {
      const result = runArithmetic('(4 + (1 + 2) + (2 + 5) + 1)');
      expect(result).toEqual(4 + (1 + 2) + (2 + 5) + 1);
    });
  });

  describe('decimals', () => {
    it('should handle adding decimals', () => {
      const result = runArithmetic('5.5 - 1.9');
      expect(result).toEqual(5.5 - 1.9);
    });

    it('should handle multiplying decimals', () => {
      const result = runArithmetic('2.5352 * 102.99');
      expect(result).toEqual(2.5352 * 102.99);
    });
  });

  describe('multiplication', () => {
    it('should handle a simple multiplication', () => {
      const result = runArithmetic('5 * 3');
      expect(result).toEqual(5 * 3);
    });

    it('should handle a bunch of operations', () => {
      const result = runArithmetic('(4 + (1 * 2) / (2 + 5) - 1)');
      expect(result).toEqual(4 + (1 * 2) / (2 + 5) - 1);
    });

    it('should handle putting x instead of *', () => {
      const result = runArithmetic('5 x 3');
      expect(result).toEqual(5 * 3);
    });

    it('should handle putting x in a more complicated expression', () => {
      const result = runArithmetic('(4 + (1 x 2) / (2 + 5) - 1)');
      expect(result).toEqual(4 + (1 * 2) / (2 + 5) - 1);
    });
  });

  describe('unary minus (for eg, -1)', () => {
    it('should handle multiplying by a negative', () => {
      const result = runArithmetic('4 / - 2');
      expect(result).toEqual(4 / -2);
    });

    it('should handle multiple negatives', () => {
      const result = runArithmetic('4 * - 2 * - 2');
      expect(result).toEqual(4 * -2 * -2);
    });

    it('should handle multiplying by a double negative', () => {
      const result = runArithmetic('4 / - - 2');
      expect(result).toEqual(4 / 2);
    });

    it('should handle negating a parenthesized expression', () => {
      const result = runArithmetic('-(4 / 2)');
      expect(result).toEqual(-(4 / 2));
    });

    it('should handle multiplying by a negative', () => {
      const result = runArithmetic('3 * -(4 / 2)');
      expect(result).toEqual(3 * -(4 / 2));
    });

    it('should handle varying whitespace', () => {
      const result = runArithmetic('1+1 - - 5');
      expect(result).toEqual(1 + 1 - -5);
    });
  });

  describe('substituting values', () => {
    const VALUES = {
      fingers: 10,
      eyes: 2,
      pi: 3.14159,
      sins: 7,
      negative: -5,
    };

    it('should handle simple value substitution', () => {
      const result = runArithmetic('fingers + eyes', VALUES);
      expect(result).toEqual(10 + 2);
    });

    it('should handle negative value substitution', () => {
      const result = runArithmetic('fingers + negative', VALUES);
      expect(result).toEqual(10 - 5);
    });

    it('should handle a more complicated case', () => {
      const result = runArithmetic('-eyes * (sins - pi * 3) / negative + (sins + 1)', VALUES);
      expect(result).toEqual((-2 * (7 - 3.14159 * 3)) / -5 + (7 + 1));
    });
  });

  describe('errors', () => {
    it('should fail on an unexpected token', () => {
      expect(() => runArithmetic('fail')).toThrow();
      expect(() => runArithmetic('1 + fail')).toThrow();
      expect(() => runArithmetic('4 + (1 * fail) / 2')).toThrow();
    });

    it('should fail on an unmatched parenthesis', () => {
      expect(() => runArithmetic(')')).toThrow();
      expect(() => runArithmetic('4 * (1 + 2')).toThrow();
      expect(() => runArithmetic('4 * 1) + 2')).toThrow();
      expect(() => runArithmetic('4 * 1 + 2)')).toThrow();
    });

    it('should fail if a substitution is not numeric', () => {
      expect(() => runArithmetic('check + 1', { check: "check" })).toThrow();
      expect(() => runArithmetic('check + 1', { check: "+" })).toThrow();
      expect(() => runArithmetic('check + 1', { check: "" })).toThrow();
    });
  });
});
