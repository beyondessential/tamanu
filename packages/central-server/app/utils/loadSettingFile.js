import { promises as fs } from 'fs';
import { parse as parseJiK } from '@bgotink/kdl/json';

export async function loadSettingFile(filepath) {
  const file = (await fs.readFile(filepath)).toString();
  let value;
  if (filepath.endsWith('.json')) {
    value = JSON.parse(file);
  } else if (filepath.endsWith('.kdl')) {
    value = parseJiK(file);
  } else {
    throw new Error('File format not supported');
  }

  return value;
}
