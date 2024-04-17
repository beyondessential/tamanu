// This module is responsible for taking a string, interpreting it as an
// arithmetic expression, substituting in some provided values,
// and then calculating the result of that expression.
//
// runArithmetic("5 + (apples * 2)", { apples: 10 })
// => 25
//
// It handles parentheses and +, -, * and /. It doesn't do powers.
// It also handles the unary minus (for eg the "-" in "4 * -2").
// It also accommodates using 'x' instead of '*' just because that's bound
// to happen eventually.
//
// It uses an algorithm called the shunting-yard algorithm to parse the
// expression into a postfix operator queue. If you're not familiar with
// that, don't sweat! There're unit tests and you can validate that things
// work over there.

function isOperator(token) {
  switch (token) {
    case '+':
    case '-':
    case '/':
    case '*':
    case 'x':
    case 'u':
      return true;
    default:
      return false;
  }
}

function getPrecedence(operator) {
  switch (operator) {
    case 'u':
      return 4;
    case '*':
    case 'x':
    case '/':
      return 3;
    case '+':
    case '-':
      return 2;
    default:
      throw new Error('Invalid operator');
  }
}

const unaryRegex = /(^|[*x/+\-u])-/g;
function replaceUnaryMinus(text) {
  const replaced = text.replace(unaryRegex, (match, p1) => `${p1}u`);
  if (replaced !== text) {
    // if we made a changed, do another pass - this is because the regex
    // won't catch consecutive unaries (it detects them correctly but the
    // restrictions on replacing partial matches means it's difficult to
    // actually sub them all out in one pass - this is the least complicated
    // way to achieve it)
    return replaceUnaryMinus(replaced);
  }
  return replaced;
}

function shouldPopOperator(token, topOfStack) {
  if (!topOfStack) return false;
  if (topOfStack === '(') return false;
  const topPrecedence = getPrecedence(topOfStack);
  const tokenPrecedence = getPrecedence(token);
  if (topPrecedence < tokenPrecedence) return false;
  return true;
}

const tokenizer = /([+\-*/()ux])/g;

function shuntingYard(text) {
  const stack = [];
  const queue = [];

  const tokens = text.split(tokenizer);

  while (tokens.length > 0) {
    const token = tokens.shift();
    if (!token) continue;

    if (isOperator(token)) {
      while (shouldPopOperator(token, stack[0])) {
        queue.push(stack.shift());
      }
      stack.unshift(token);
      continue;
    }
    if (token === '(') {
      stack.unshift(token);
      continue;
    }
    if (token === ')') {
      while (stack.length > 0 && stack[0] !== '(') {
        queue.push(stack.shift());
      }
      if (stack[0] === '(') {
        stack.shift();
      } else {
        throw new Error('Unmatched parenthesis');
      }
      continue;
    }

    const float = parseFloat(token);
    if (!Number.isNaN(float)) {
      queue.push(float);
      continue;
    }

    throw new Error('Unrecognised token');
  }

  while (stack.length > 0) {
    queue.push(stack.shift());
  }

  return queue;
}

function processQueue(queue) {
  const stack = [];
  const operations = {
    '+': () => stack.pop() + stack.pop(),
    '-': () => -stack.pop() + stack.pop(),
    '*': () => stack.pop() * stack.pop(),
    '/': () => (1 / stack.pop()) * stack.pop(),
    u: () => -stack.pop(),

    // alias just in case
    x: () => operations['*'](),
  };

  while (queue.length > 0) {
    const item = queue.shift();
    if (typeof item === 'number') {
      stack.push(item);
      continue;
    }
    if (operations[item]) {
      stack.push(operations[item]());
      continue;
    }
    throw new Error('Unexpected token', item);
  }

  return stack[0];
}

const noWhitespace = /\s/g;

export function runArithmetic(formulaText, values = {}) {
  // first replace variables with their actual values
  // (we do this here rather than treating the variable names as tokens,
  // so that the tokeniser doesn't get confused by variable names with
  // u and x in them)
  let valuedText = formulaText;
  Object.entries(values).forEach(([key, value]) => {
    if (Number.isNaN(parseFloat(value))) {
      throw new Error('Invalid value substitution');
    }

    valuedText = valuedText.replace(new RegExp(key, 'g'), value);
  });

  // strip out all whitespace
  const strippedText = valuedText.replace(noWhitespace, '');

  // then replace the unary minus with a 'u' so we can
  // handle it differently to subtraction in the tokeniser
  const replacedText = replaceUnaryMinus(strippedText);

  // then create a postfix queue using the shunting yard algorithm
  const queue = shuntingYard(replacedText);

  // then process the queue
  return processQueue(queue);
}
