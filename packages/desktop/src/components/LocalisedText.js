import { useLocalisation } from '../contexts/Localisation';

export const LocalisedText = ({ path }) => {
  const { getLocalisation } = useLocalisation();
  if (!path) {
    return '<no path specified>';
  }
  const value = getLocalisation(path);
  if (typeof value !== 'string') {
    return `<path not set to text: ${path}>`;
  }
  return value;
};
