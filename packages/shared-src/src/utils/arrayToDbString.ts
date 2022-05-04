export const arrayToDbString = (array: any[]): string => array.map(item => `'${item}'`).join(', ');
