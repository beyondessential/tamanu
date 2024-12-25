export const arrayToDbString = (array: string[]) => array.map(item => `'${item}'`).join(', ');
