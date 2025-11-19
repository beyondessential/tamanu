import { customAlphabet } from 'nanoid';

const generator = customAlphabet('123456789ABCDEFGHIJKLMNPQRSTUVWXYZ', 10);

export const generateInvoiceDisplayId = () => {
  return generator();
};
