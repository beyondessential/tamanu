import * as mathjs from 'mathjs';
import * as yup from 'yup';

export const mathjsString = () =>
  yup.string().test({
    name: 'is-valid-mathjs-expression',
    message: ({ originalValue }) => `${originalValue} is not a valid math.js expression`,
    test: value => {
      if (!value) {
        return true;
      }
      try {
        mathjs.parse(value);
      } catch (e) {
        return false;
      }
      return true;
    },
  });
