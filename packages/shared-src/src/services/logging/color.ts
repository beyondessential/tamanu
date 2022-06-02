/*
// import chalk from 'chalk';

// defensive destructure to allow for testing shared-src directly
const {
  color,
} = config?.log || {};

const colorise = color
  ? (hex) => chalk.hex(hex)
  : (ignoredHex) => (text => text);
*/
export type ColorFn = (text: string) => string;

// TEMP: Disable chalk & its import as it seems to not run correctly on AWS
const colorise = (_hex: string): ColorFn => (text: string) => text;

export const COLORS = {
  grey: colorise('999'),
  green: colorise('8ae234'),
  blue: colorise('729fcf'),
  red: colorise('ef2929'),
  yellow: colorise('e9b96e'),
};
