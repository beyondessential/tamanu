import { isArray } from 'lodash';

export const concatSelf = (array, ...items) => {
  items.map(item => {
    if (isArray(item)) {
      item.forEach(variable => array.push(variable));
    } else {
      array.push(item)
    }
  });
}