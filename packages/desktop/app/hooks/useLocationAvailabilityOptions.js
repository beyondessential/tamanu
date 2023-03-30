import { LOCATION_AVAILABILITY_STATUS, LOCATION_AVAILABILITY_TAG_CONFIG } from 'shared/constants';

export const useLocationAvailabilityOptions = () => {
  const options = Object.keys(LOCATION_AVAILABILITY_STATUS).map(status => ({
    value: status,
    label: LOCATION_AVAILABILITY_TAG_CONFIG[status].label,
  }));

  return [{ value: '', label: 'All' }, ...options];
};
