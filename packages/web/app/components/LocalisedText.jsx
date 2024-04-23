import { useSettings } from '../contexts/Settings';

export const LocalisedText = ({ path }) => {
  const { getSetting } = useSettings();
  if (!path) {
    return '<no path specified>';
  }
  const value = getSetting(`localisation.${path}`);
  if (typeof value !== 'string') {
    return `<path not set to text: ${path}>`;
  }
  return value;
};

// Better name for using LocalisedText as a hook
export const useLocalisedText = props => LocalisedText(props);
