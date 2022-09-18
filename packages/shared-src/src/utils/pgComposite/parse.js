export function* enumerate(iterable) {
  let n = 0;
  for (const el of iterable) {
    yield [n, el];
    n += 1;
  }
}

/**
 * Implements a simple tuple parser for a composite record literal.
 *
 * > The composite output routine will put double quotes around field values if they are empty
 * > strings or contain parentheses, commas, double quotes, backslashes, or white space. (Doing
 * > so for white space is not essential, but aids legibility.) Double quotes and backslashes
 * > embedded in field values will be doubled.
 *
 * @see https://www.postgresql.org/docs/current/rowtypes.html#ROWTYPES-IO-SYNTAX
 */
export function parse(raw) {
  if (raw[0] !== '(') throw new Error('not a composite value: missing left paren');
  if (raw[raw.length - 1] !== ')') throw new Error('not a composite value: missing right paren');

  const values = [];
  let accum = '';
  let quoted = false;
  let backescape = false;
  let quotescaped = false;
  for (const [i, c] of enumerate(raw.slice(1, raw.length - 1))) {
    const previous = raw[i];
    const next = raw[i + 2];

    if (!quoted && c === ',') {
      if (values[values.length - 1] === '') {
        // special case: empty string
      } else {
        // end of field
        values.push(accum.length > 0 ? accum : null);
      }
      accum = '';
      continue;
    }

    if (c === '"') {
      if (previous === '\\') {
        // escaping
        backescape = false;
        quotescaped = true;
        accum += c;
        continue;
      } else if (previous === '"' && !quotescaped) {
        if (accum.length > 0) {
          // escaping
          accum += '"';
          quotescaped = true;
          // we're still quoting
          quoted = true;
          continue;
        } else if (next === ',') {
          // empty string
          values.push('');
          quoted = false;
          continue;
        }
      } else if (!quoted) {
        // start of quoted section
        quoted = true;
        continue;
      } else {
        // end of quoted section
        quoted = false;
        continue;
      }
    }

    // backslash escapes
    if (c === '\\') {
      if (backescape) {
        // escaping a \
        backescape = false;
        accum += '\\';
        continue;
      } else {
        // start escape
        backescape = true;
        continue;
      }
    }

    // branches that set these flags diverge, so now we're one iteration later and can clear them.
    if (backescape) {
      backescape = false;
    }
    if (quotescaped) {
      quotescaped = false;
    }

    accum += c;
  }

  if (accum.length > 0) {
    values.push(accum);
  } else if (raw[raw.length - 2] === ',') {
    values.push(null);
  }

  return values;
}
