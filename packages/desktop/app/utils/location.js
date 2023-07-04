/**
 * @param location: { name: string, locationGroup: { name: string } }
 * @returns {string}
 */
export const getFullLocationName = location => {
  // Attempt to return the location group name and the location name. eg. Ward 2, Bed 1
  if (location?.locationGroup?.name) {
    return `${location.locationGroup.name}, ${location.name}`;
  }

  if (location?.name) {
    return location.name;
  }

  return '-';
};
