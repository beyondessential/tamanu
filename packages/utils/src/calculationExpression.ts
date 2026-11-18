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
 * Checks every variable a calculation reads is one of `scope`'s own keys, so no name falls through
 * to math.js' own namespace of units and functions.
 */
function assertVariablesInScope(variables: string[], scope: Record<string, unknown>): void {
  const missing = variables.find(name => !Object.prototype.hasOwnProperty.call(scope, name));
  if (missing !== undefined) {
    throw new UnsupportedCalculationError(`Unknown variable: ${missing}`);
  }
}

/**
 * A math.js expression compiled for evaluation. What a calculation evaluates to depends on the
 * expression, so the value is typed as math.js types its own `evaluate`, for the caller to check.
 */
export interface CompiledCalculation {
  evaluate(scope: Record<string, unknown>): any;
}

/** A math.js parse node, which this reads for its vocabulary and compiles to evaluate. */
export interface ParsedCalculation extends CalculationExpressionNode {
  compile(): CompiledCalculation;
}

/** A calculation ready to evaluate, with the question codes it reads. */
export interface PreparedCalculation {
  variables: string[];
  evaluate(): any;
}

const DEFAULT_CACHE_SIZE = 200;

/**
 * Builds the calculation pipeline — parse, check against the vocabulary, check every variable is in
 * scope, compile — over a math.js `parse`, so each package supplies its own math.js instance and
 * this one needs none. Both the web/server and mobile calculation paths run calculations through
 * it, so the checks are made in one place.
 *
 * A survey's calculation strings are fixed while it is being filled in, and the calculations rerun
 * on every answer change, so each distinct string is parsed, checked and compiled once and kept,
 * up to `cacheSize` of them. Whether a calculation's variables are in scope still depends on the
 * survey it runs against, so that is checked on every call.
 */
export function createCalculationPreparer(
  parse: (calculation: string) => ParsedCalculation,
  { cacheSize = DEFAULT_CACHE_SIZE }: { cacheSize?: number } = {},
): (calculation: string, scope: Record<string, unknown>) => PreparedCalculation {
  type Entry =
    | { supported: true; variables: string[]; compiled: CompiledCalculation }
    | { supported: false; message: string };
  const cache = new Map<string, Entry>();

  const entryFor = (calculation: string): Entry => {
    const cached = cache.get(calculation);
    if (cached) return cached;

    let entry: Entry;
    try {
      const expression = parse(calculation);
      entry = {
        supported: true,
        variables: getCalculationVariables(expression),
        compiled: expression.compile(),
      };
    } catch (error) {
      entry = { supported: false, message: (error as Error).message };
    }

    if (cache.size >= cacheSize) {
      // Oldest first, so a survey's own calculations outlast one-off strings
      cache.delete(cache.keys().next().value!);
    }
    cache.set(calculation, entry);
    return entry;
  };

  return (calculation, scope) => {
    const entry = entryFor(calculation);
    if (!entry.supported) throw new UnsupportedCalculationError(entry.message);

    assertVariablesInScope(entry.variables, scope);

    return {
      variables: entry.variables,
      evaluate: () => entry.compiled.evaluate(scope),
    };
  };
}
