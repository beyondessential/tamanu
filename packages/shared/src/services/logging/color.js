/*
// import chalk from 'chalk';

// defensive destructure to allow for testing shared directly
const {
  color,
} = config?.log || {};

const colorise = color
  ? (hex) => chalk.hex(hex)
  : (ignoredHex) => (text => text);
*/
// TEMP: Disable chalk & its import as it seems to not run correctly on AWS
const colorise = () => text => text;

export const COLORS = {
  grey: colorise('999'),
  green: colorise('8ae234'),
  blue: colorise('729fcf'),
  red: colorise('ef2929'),
  yellow: colorise('e9b96e'),
  magenta: colorise('ff00ff'),
};
