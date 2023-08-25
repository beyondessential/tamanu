export const mockProgramRegistrytFormEndpoints = {
  'suggestions/programRegistry/all': () => [
    { id: '1', name: 'Arm' },
    { id: '2', name: 'Leg' },
    { id: '3', name: 'Shoulder' },
  ],
  'suggestions/registeringFacility/all': () => [
    { id: '1', name: 'Hospital 1' },
    { id: '2', name: 'Hospital 2' },
  ],
  'suggestions/registeredBy/all': () => [
    { id: '1', name: 'Normal' },
    { id: '2', name: 'Urgent' },
  ],
  'suggestions/programRegistryStatus/all': () => [
    { id: '1', name: 'Pending' },
    { id: '2', name: 'Inprogress' },
    { id: '3', name: 'Complete' },
  ],
};
