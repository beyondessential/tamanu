export function* enumerate(iterable) {
  let n = 0;
  for (const el of iterable) {
    yield [n, el];
    n += 1;
  }
}

class Quote {
  toString() {
    return '';
  }
}
class QuoteOpen extends Quote {}
class QuoteClose extends Quote {}

class FieldSeparator {
  toString() {
    return '';
  }
}

class Char {
  constructor(char) {
    this.char = char;
  }

  toString() {
    return this.char;
  }
}
class EscapeOpen extends Char {
  toString() {
    return '';
  }
}
class EscapeClose extends Char {}

function isQuoting(tokens) {
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const token = tokens[i];
    if (token instanceof QuoteClose) return false;
    if (token instanceof QuoteOpen) return true;
  }

  return false;
}

function fieldLength(tokens) {
  let distance = 0;
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    if (tokens[i] instanceof FieldSeparator) break;
    distance += 1;
  }

  return distance;
}

/**
 * Implements a simple tuple tokeniser and parser for a composite record literal.
 *
 * > The composite output routine will put double quotes around field values if they are empty
 * > strings or contain parentheses, commas, double quotes, backslashes, or white space. (Doing
 * > so for white space is not essential, but aids legibility.) Double quotes and backslashes
 * > embedded in field values will be doubled.
 *
 * @see https://www.postgresql.org/docs/current/rowtypes.html#ROWTYPES-IO-SYNTAX
 */
export function parse(raw) {
  if (raw[0] !== '(') {
    throw new Error(`not a composite value: missing left paren\nRAW: ${raw}`);
  }
  if (raw[raw.length - 1] !== ')') {
    throw new Error(`not a composite value: missing right paren\nRAW: ${raw}`);
  }

  const tokens = [];
  for (const c of raw.slice(1, raw.length - 1)) {
    const last = tokens[tokens.length - 1];
    const lastIsEscapeBackslash = last instanceof EscapeOpen && last.char === '\\';

    if (c === '"') {
      if (last instanceof EscapeOpen) {
        tokens.push(new EscapeClose(c));
        continue;
      } else if (
        last instanceof Quote &&
        fieldLength(tokens) > 1 &&
        isQuoting(tokens.slice(0, -1))
      ) {
        tokens[tokens.length - 1] = new EscapeOpen('"');
        tokens.push(new EscapeClose(c));
        continue;
      } else if (isQuoting(tokens)) {
        tokens.push(new QuoteClose());
        continue;
      } else {
        tokens.push(new QuoteOpen());
        continue;
      }
    }

    if (c === '\\') {
      if (lastIsEscapeBackslash) {
        tokens.push(new EscapeClose(c));
        continue;
      } else {
        tokens.push(new EscapeOpen(c));
        continue;
      }
    }

    if (c === ',') {
      if (lastIsEscapeBackslash) {
        tokens.push(new EscapeClose(c));
        continue;
      } else if (isQuoting(tokens)) {
        tokens.push(new Char(c));
        continue;
      } else {
        tokens.push(new FieldSeparator());
        continue;
      }
    }

    if (lastIsEscapeBackslash) {
      tokens.push(new EscapeClose(c));
    } else {
      tokens.push(new Char(c));
    }
  }

  // return tokens;
  if (tokens.length === 0) return [];

  const fields = [];
  let accum = '';
  let previous = null;
  while (tokens.length > 0) {
    const token = tokens.shift();
    if (token instanceof FieldSeparator) {
      if (!previous || previous instanceof FieldSeparator) {
        fields.push(null);
      } else {
        fields.push(accum);
      }
      accum = '';
    } else {
      accum += token;
    }

    previous = token;
  }

  if (previous instanceof FieldSeparator) {
    fields.push(null);
  } else {
    fields.push(accum);
  }

  return fields;
}
