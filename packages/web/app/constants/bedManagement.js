import { LOCATION_AVAILABILITY_STATUS, LOCATION_AVAILABILITY_TAG_CONFIG } from '@tamanu/constants';

export const LOCATION_AVAILABILITY_OPTIONS = [
  { value: '', label: 'All' },
  ...Object.keys(LOCATION_AVAILABILITY_STATUS).map(status => ({
    value: status,
    label: LOCATION_AVAILABILITY_TAG_CONFIG[status].label,
  })),
];
