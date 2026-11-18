// spec: PROGRAMS
/**
 * The vocabulary a survey calculation (CalculatedQuestion and Result) may use, checked against a
 * math.js expression tree before it is evaluated. Calculations arrive by sync from whoever authored
 * the survey, so anything outside this vocabulary is refused rather than handed to math.js.
 *
 * Works on the shape of math.js parse nodes, so it needs no math.js instance of its own.
 */

const CALCULATION_OPERATORS = new Set([
  'add',
  'subtract',
  'multiply',
  'divide',
  'mod',
  'pow',
  'unaryMinus',
  'unaryPlus',
  'equal',
  'unequal',
  'smaller',
  'smallerEq',
  'larger',
  'largerEq',
  'and',
  'or',
  'xor',
  'not',
]);

const CALCULATION_FUNCTIONS = new Set([
  ...CALCULATION_OPERATORS,
  'abs',
  'sign',
  'round',
  'ceil',
  'floor',
  'fix',
  'sqrt',
  'cbrt',
  'nthRoot',
  'square',
  'cube',
  'exp',
  'log',
  'log10',
  'log2',
  'min',
  'max',
  'sum',
  'prod',
  'mean',
  'median',
  'hypot',
  'gcd',
  'lcm',
  'compare',
  'isNaN',
  'isZero',
  'isPositive',
  'isNegative',
  'isInteger',
  'number',
]);

const CALCULATION_CONSTANTS = new Set(['pi', 'e']);

/** The parts of a math.js parse node this check reads. */
export interface CalculationExpressionNode {
  type: string;
  name?: string;
  fn?: string | CalculationExpressionNode;
  args?: CalculationExpressionNode[];
  content?: CalculationExpressionNode;
  condition?: CalculationExpressionNode;
  trueExpr?: CalculationExpressionNode;
  falseExpr?: CalculationExpressionNode;
}

export class UnsupportedCalculationError extends Error {}

function collectVariables(node: CalculationExpressionNode, variables: Set<string>): void {
  switch (node.type) {
    case 'ConstantNode':
      return;
    case 'SymbolNode':
      if (!CALCULATION_CONSTANTS.has(node.name!)) variables.add(node.name!);
      return;
    case 'ParenthesisNode':
      collectVariables(node.content!, variables);
      return;
    case 'ConditionalNode':
      collectVariables(node.condition!, variables);
      collectVariables(node.trueExpr!, variables);
      collectVariables(node.falseExpr!, variables);
      return;
    case 'OperatorNode':
      if (typeof node.fn !== 'string' || !CALCULATION_OPERATORS.has(node.fn)) {
        throw new UnsupportedCalculationError(`Unsupported operator: ${String(node.fn)}`);
      }
      node.args!.forEach(arg => collectVariables(arg, variables));
      return;
    case 'FunctionNode': {
      const { fn } = node;
      const functionName = typeof fn === 'object' && fn.type === 'SymbolNode' ? fn.name! : null;
      if (functionName === null || !CALCULATION_FUNCTIONS.has(functionName)) {
        throw new UnsupportedCalculationError(
          `Unsupported function: ${functionName ?? String(fn)}`,
        );
      }
      node.args!.forEach(arg => collectVariables(arg, variables));
      return;
    }
    default:
      throw new UnsupportedCalculationError(`Unsupported expression: ${node.type}`);
  }
}

/**
 * Checks a parsed calculation against the calculation vocabulary, throwing
 * {@link UnsupportedCalculationError} for anything outside it, and returns the names of the
 * variables (question codes) it reads.
 */
export function getCalculationVariables(node: CalculationExpressionNode): string[] {
  const variables = new Set<string>();
  collectVariables(node, variables);
  return [...variables];
}

/**
 * Checks a parsed calculation as {@link getCalculationVariables} does, and also that every variable
 * it reads is one of `scope`'s own keys, so no name falls through to math.js' own namespace.
 */
export function assertCalculationInScope(
  node: CalculationExpressionNode,
  scope: Record<string, unknown>,
): string[] {
  const variables = getCalculationVariables(node);
  const missing = variables.find(name => !Object.prototype.hasOwnProperty.call(scope, name));
  if (missing !== undefined) {
    throw new UnsupportedCalculationError(`Unknown variable: ${missing}`);
  }
  return variables;
}
