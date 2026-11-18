import { describe, expect, it } from 'vitest';
import {
  assertCalculationInScope,
  getCalculationVariables,
  UnsupportedCalculationError,
  type CalculationExpressionNode,
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

describe('assertCalculationInScope', () => {
  it('returns the variables when every one is in scope', () => {
    expect(assertCalculationInScope(symbol('A'), { A: 1 })).toEqual(['A']);
  });

  it('accepts a variable whose value is empty', () => {
    expect(assertCalculationInScope(symbol('A'), { A: undefined })).toEqual(['A']);
  });

  it('refuses a variable missing from scope', () => {
    expect(() => assertCalculationInScope(symbol('cm'), { A: 1 })).toThrow('Unknown variable: cm');
  });

  it('refuses a name only inherited by the scope object', () => {
    expect(() => assertCalculationInScope(symbol('toString'), {})).toThrow(
      UnsupportedCalculationError,
    );
  });
});
