import { useLocalisation } from '../contexts/Localisation';

export const useLocationDisplayName = () => {
  const { getLocalisation } = useLocalisation();

  /**
   * @param location: { name: string, locationGroup: { name: string } }
   * @returns {string}
   */
  const getFullLocationName = location => {
    if (getLocalisation('features.locationHierarchy') === true) {
      // If the locationHierarchy is set, attempt to return the location group name and the
      // location name. eg. Ward 2, Bed 1
      if (location?.locationGroup?.name) {
        return `${location.locationGroup.name}, ${location.name}`;
      }
    }

    if (location?.name) {
      return location.name;
    }

    return '-';
  };

  return { getFullLocationName };
};
