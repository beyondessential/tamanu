const reverse = list => Array.prototype.slice.call(list, 0).reverse();

/**
 * @typedef {Function} Compose
 * @param {any} value
 * @param {...any} args
 * @returns {any} result
 */

/**
 * Performs right-to-left function composition
 *
 * @param {...Function} fns functions
 * @returns {Compose} composed function
 */
const compose = (...fns) => (value, ...args) => {
  let result = value;
  const reversedFns = reverse(fns);

  for (let i = 0; i < reversedFns.length; i += 1) {
    const fn = reversedFns[i];
    result = fn(result, ...args);
  }

  return result;
};

const castArray = value => {
  return Array.isArray(value) ? value : [value];
};

const compact = array => array.filter(Boolean);

/**
 * Merges style objects array
 *
 * @param {Object[]} styles style objects array
 * @returns {Object} merged style object
 */
const mergeStyles = styles =>
  styles.reduce((acc, style) => {
    const s = Array.isArray(style) ? flatten(style) : style;

    Object.keys(s).forEach(key => {
      if (s[key] !== null && s[key] !== undefined) {
        acc[key] = s[key];
      }
    });

    return acc;
  }, {});

export const flatten = compose(mergeStyles, compact, castArray);
