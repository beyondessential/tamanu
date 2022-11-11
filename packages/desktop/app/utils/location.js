/**
 *
 * @param location: { name: string, locationGroup: { name: string } }
 * @returns {string}
 */
export const getFullLocationName = location => {
  if (location?.locationGroup?.name) {
    return `${location.locationGroup.name}, ${location.name}`;
  }

  if (location?.name) {
    return `${location.locationGroup.name}, ${location.name}`;
  }

  return '-';
};
