import { describe, expect, it, vi } from 'vitest';
import {
  createCalculationPreparer,
  getCalculationVariables,
  UnsupportedCalculationError,
  type CalculationExpressionNode,
  type ParsedCalculation,
} from '../src/calculationExpression';

// Hand-built trees in the shape math.js' parser produces, so this package needs no math.js
const constant = (): CalculationExpressionNode => ({ type: 'ConstantNode' });
const symbol = (name: string): CalculationExpressionNode => ({ type: 'SymbolNode', name });
const operator = (fn: string, ...args: CalculationExpressionNode[]): CalculationExpressionNode => ({
  type: 'OperatorNode',
  fn,
  args,
});
const call = (
  fn: CalculationExpressionNode,
  ...args: CalculationExpressionNode[]
): CalculationExpressionNode => ({ type: 'FunctionNode', fn, args });

describe('getCalculationVariables', () => {
  it('returns each question code an arithmetic expression reads, once', () => {
    const tree = operator('add', symbol('A'), operator('multiply', symbol('B'), symbol('A')));
    expect(getCalculationVariables(tree)).toEqual(['A', 'B']);
  });

  it('reads through brackets, conditionals and allowed functions', () => {
    const tree: CalculationExpressionNode = {
      type: 'ConditionalNode',
      condition: operator('larger', symbol('A'), constant()),
      trueExpr: call(
        symbol('round'),
        { type: 'ParenthesisNode', content: symbol('B') },
        constant(),
      ),
      falseExpr: call(symbol('max'), symbol('C'), symbol('pi')),
    };
    expect(getCalculationVariables(tree)).toEqual(['A', 'B', 'C']);
  });

  it('does not count pi or e as variables', () => {
    expect(getCalculationVariables(operator('multiply', symbol('pi'), symbol('e')))).toEqual([]);
  });

  it.each([
    ['an assignment', { type: 'AssignmentNode' }],
    ['a function definition', { type: 'FunctionAssignmentNode' }],
    ['property access', { type: 'AccessorNode', object: symbol('A') }],
    ['an object literal', { type: 'ObjectNode' }],
    ['an array literal', { type: 'ArrayNode' }],
    ['several statements', { type: 'BlockNode' }],
    ['a range', { type: 'RangeNode' }],
  ])('refuses %s', (_, tree) => {
    expect(() => getCalculationVariables(tree)).toThrow(UnsupportedCalculationError);
  });

  it.each(['import', 'evaluate', 'parse', 'createUnit', 'unit'])('refuses a call to %s', name => {
    expect(() => getCalculationVariables(call(symbol(name), constant()))).toThrow(
      `Unsupported function: ${name}`,
    );
  });

  it('refuses an operator outside the vocabulary', () => {
    expect(() => getCalculationVariables(operator('to', symbol('A'), symbol('B')))).toThrow(
      'Unsupported operator: to',
    );
  });

  it('refuses a call whose function is not a plain name', () => {
    const tree = call({ type: 'AccessorNode' }, constant());
    expect(() => getCalculationVariables(tree)).toThrow(UnsupportedCalculationError);
  });

  it('checks inside function arguments', () => {
    const tree = call(symbol('max'), symbol('A'), { type: 'AssignmentNode' });
    expect(() => getCalculationVariables(tree)).toThrow(UnsupportedCalculationError);
  });
});

describe('createCalculationPreparer', () => {
  // Stands in for math.js: "A+B" parses to a sum of its named variables, anything else is refused
  const parsed = (calculation: string): ParsedCalculation => {
    const names = calculation.split('+');
    if (names.some(name => !/^[A-Za-z]+$/.test(name)))
      throw new Error(`Syntax error: ${calculation}`);
    return {
      ...names.map(symbol).reduce((left, right) => operator('add', left, right)),
      compile: () => ({
        evaluate: (scope: Record<string, unknown>) =>
          names.reduce((total, name) => total + Number(scope[name] ?? 0), 0),
      }),
    } as ParsedCalculation;
  };

  it('prepares a calculation, giving its variables and its value in the scope', () => {
    const prepare = createCalculationPreparer(parsed);
    const { variables, evaluate } = prepare('A+B', { A: 2, B: 3 });
    expect(variables).toEqual(['A', 'B']);
    expect(evaluate()).toEqual(5);
  });

  it('parses and compiles each calculation once, however often it is prepared', () => {
    const parse = vi.fn(parsed);
    const prepare = createCalculationPreparer(parse);
    expect(prepare('A+B', { A: 1, B: 1 }).evaluate()).toEqual(2);
    expect(prepare('A+B', { A: 5, B: 5 }).evaluate()).toEqual(10);
    expect(prepare('A', { A: 7 }).evaluate()).toEqual(7);
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it('accepts a variable whose value is empty', () => {
    const prepare = createCalculationPreparer(parsed);
    expect(prepare('A', { A: undefined }).variables).toEqual(['A']);
  });

  it('checks the scope on every call, not only the first', () => {
    const prepare = createCalculationPreparer(parsed);
    prepare('A+B', { A: 1, B: 1 });
    expect(() => prepare('A+B', { A: 1 })).toThrow('Unknown variable: B');
  });

  it('refuses a name only inherited by the scope object', () => {
    const prepare = createCalculationPreparer(parsed);
    expect(() => prepare('toString', {})).toThrow('Unknown variable: toString');
  });

  it('refuses a calculation that does not parse, without reparsing it', () => {
    const parse = vi.fn(parsed);
    const prepare = createCalculationPreparer(parse);
    expect(() => prepare('1 + + /', {})).toThrow(UnsupportedCalculationError);
    expect(() => prepare('1 + + /', {})).toThrow('Syntax error: 1 + + /');
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it('keeps no more than the cache holds, dropping the oldest first', () => {
    const parse = vi.fn(parsed);
    const prepare = createCalculationPreparer(parse, { cacheSize: 2 });
    prepare('A', { A: 1 });
    prepare('B', { B: 1 });
    prepare('C', { C: 1 });
    expect(parse).toHaveBeenCalledTimes(3);

    prepare('C', { C: 1 });
    expect(parse).toHaveBeenCalledTimes(3);

    prepare('A', { A: 1 });
    expect(parse).toHaveBeenCalledTimes(4);
  });
});
