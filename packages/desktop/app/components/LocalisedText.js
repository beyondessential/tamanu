import { useConfig } from '../contexts/Localisation';

export const LocalisedText = ({ path }) => {
  const value = useConfig(path);
  if (!path) {
    return '<no path specified>';
  }
  if (typeof value !== 'string') {
    return `<path not set to text: ${path}>`;
  }
  return value;
};
