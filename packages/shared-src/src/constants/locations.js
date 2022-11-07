export const LOCATION_AVAILABILITY_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  OCCUPIED: 'OCCUPIED',
};

export const LOCATION_AVAILABILITY_TAG_CONFIG = {
  [LOCATION_AVAILABILITY_STATUS.AVAILABLE]: {
    label: 'Available',
    color: '#326699',
    background: '#EBF0F5',
  },
  [LOCATION_AVAILABILITY_STATUS.RESERVED]: {
    label: 'Reserved',
    color: '#F76853',
    background: '#FFF0EE',
  },
  [LOCATION_AVAILABILITY_STATUS.OCCUPIED]: {
    label: 'Occupied',
    color: '#F17F16;',
    background: '#F4EEE8',
  },
};
