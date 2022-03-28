import * as Icons from '../Icons';

export const data = [
  {
    id: '0',
    encounterType: 'clinic',
    startDate: new Date(Date.now() - 10000000000),
    endDate: null,
    reasonForEncounter: 'Injured',
    practitioner: {
      name: 'Kim Catherine Jones',
    },
  },
  {
    id: '1',
    encounterType: 'admission',
    startDate: new Date(Date.now() - 10000000000000),
    endDate: new Date(Date.now() - 100000),
    reasonForEncounter: 'Sickly',
    practitioner: {
      name: 'Kim Catherine Jones',
    },
  },
];
