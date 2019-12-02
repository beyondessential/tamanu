import Icons from '../Icons';

export const data = [
  {
    id: 0,
    type: 'Hospital',
    typeDescription: 'Inpatient',
    content: 'Lorem ipsum...',
    location: 'Location 1',
    leftIcon: Icons.Clipboard,
    date: new Date(),
    diagnosis: 'Broken left leg',
    treament:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam et felis consecte',
    practitioner: {
      name: 'Kim Catherine Jones',
    },
    medications: [
      {
        id: 1,
        name: '3TB UAS',
      },
      {
        id: 2,
        name: '3TB UAS',
      },
    ],
  },
  {
    id: 1,
    type: 'Clinic',
    content: 'Lorem ipsum...2',
    location: 'Location 2',
    date: new Date(),
    diagnosis: 'Broken arm',
    treament: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    practitioner: {
      name: 'Kim Catherine Jones',
    },
    medications: [
      {
        id: 5,
        name: '4TB UAS',
      },
      {
        id: 8,
        name: '1TB UAS',
      },
      {
        id: 9,
        name: '1TB SAU',
      },
    ],
  },
];
