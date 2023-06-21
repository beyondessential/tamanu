export const arrayToDbString = array => array.map(item => `'${item}'`).join(', ');
