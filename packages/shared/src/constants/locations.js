export const LOCATION_AVAILABILITY_STATUS = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  OCCUPIED: 'OCCUPIED',
};

export const LOCATION_AVAILABILITY_TAG_CONFIG = {
  [LOCATION_AVAILABILITY_STATUS.AVAILABLE]: {
    label: 'Available',
    color: '#44AD72',
    background: '#EDF7F1',
  },
  [LOCATION_AVAILABILITY_STATUS.RESERVED]: {
    label: 'Reserved',
    color: '#888888',
    background: '#F4F4F4',
  },
  [LOCATION_AVAILABILITY_STATUS.OCCUPIED]: {
    label: 'Occupied',
    color: '#888888;',
    background: '#F4F4F4',
  },
};
