export const dummyPrograms = [
  {
    name: 'Covid-19',
    questions: [],
  },
  {
    name: 'PEN NCD Assessment',
    questions: [
      {
        title: 'Please enter the date the patient attended for screening', 
        list: [
          {
            id: 'NCDScreen3',
            type: 'date',
            required: true,
          },
        ]
      },
      {
        title: 'What is the name of the staff member undertaking this assessment?', 
        list: [
          {
            id: 'NCDScreen4',
            type: 'text',
            required: true,
          },
        ],
      },
      {
        title: 'What is the estimated (or known) age of the patient in years?', 
        list: [
          {
            id: 'NCDScreen5',
            type: 'text',
            required: true,
          },
        ],
      },
    ],
  },
];
