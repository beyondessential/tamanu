import React from 'react';
import { storiesOf } from '@storybook/react';
import { ProgramRegistryFormHistory } from '../app/views/programRegistry/ProgramRegistryFormHistory';

import { ApiContext } from '../app/api';
const dummyData = [
  {
    id: 1,
    date: '6/26/2023',
    submittedBy: 'Hyacinthie',
    from: 'Engineering',
    result: '9851',
  },
  {
    id: 2,
    date: '3/30/2023',
    submittedBy: 'Mame',
    from: 'Marketing',
    result: '1160',
  },
  {
    id: 3,
    date: '10/5/2022',
    submittedBy: 'Orland',
    from: 'Product Management',
    result: '3634',
  },
  {
    id: 4,
    date: '6/4/2023',
    submittedBy: 'Noell',
    from: 'Engineering',
    result: '8025',
  },
  {
    id: 5,
    date: '11/11/2022',
    submittedBy: 'Hinda',
    from: 'Services',
    result: '9631',
  },
  {
    id: 6,
    date: '10/12/2022',
    submittedBy: 'Abbey',
    from: 'Marketing',
    result: '6816',
  },
  {
    id: 7,
    date: '1/8/2023',
    submittedBy: 'Ginelle',
    from: 'Human Resources',
    result: '4687',
  },
  {
    id: 8,
    date: '3/19/2023',
    submittedBy: 'Vaughn',
    from: 'Business Development',
    result: '9343',
  },
  {
    id: 9,
    date: '4/11/2023',
    submittedBy: 'Raddie',
    from: 'Legal',
    result: '3987',
  },
  {
    id: 10,
    date: '7/12/2023',
    submittedBy: 'Donni',
    from: 'Accounting',
    result: '9429',
  },
  {
    id: 11,
    date: '1/12/2023',
    submittedBy: 'Laurens',
    from: 'Support',
    result: '8660',
  },
  {
    id: 12,
    date: '8/31/2023',
    submittedBy: 'Linette',
    from: 'Research and Development',
    result: '5142',
  },
  {
    id: 13,
    date: '5/13/2023',
    submittedBy: 'Gnni',
    from: 'Human Resources',
    result: '8082',
  },
  {
    id: 14,
    date: '6/6/2023',
    submittedBy: 'Dexter',
    from: 'Human Resources',
    result: '8847',
  },
  {
    id: 15,
    date: '8/13/2023',
    submittedBy: 'Ulberto',
    from: 'Human Resources',
    result: '9859',
  },
  {
    id: 16,
    date: '9/10/2022',
    submittedBy: 'Northrup',
    from: 'Training',
    result: '9104',
  },
  {
    id: 17,
    date: '12/2/2022',
    submittedBy: 'Aland',
    from: 'Support',
    result: '0359',
  },
  {
    id: 18,
    date: '8/20/2023',
    submittedBy: 'Benoite',
    from: 'Business Development',
    result: '3798',
  },
  {
    id: 19,
    date: '10/15/2022',
    submittedBy: 'Daloris',
    from: 'Legal',
    result: '2099',
  },
  {
    id: 20,
    date: '12/2/2022',
    submittedBy: 'Anstice',
    from: 'Sales',
    result: '6693',
  },
];
function sleep(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

const dummyApi = {
  get: async (endpoint, { order, orderBy, page, rowsPerPage }) => {
    await sleep(1000);
    const sortedData = dummyData.sort(({ [orderBy]: a }, { [orderBy]: b }) => {
      if (typeof a === 'string') {
        return order === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
      }
      return order === 'asc' ? a - b : b - a;
    });
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;

    return {
      data: sortedData.slice(startIndex, endIndex),
      count: dummyData.length,
    };
  },
};
storiesOf('Program Registry', module).add('ProgramRegistryFormHistory', () => (
  <ApiContext.Provider value={dummyApi}>
    <ProgramRegistryFormHistory
      program={{
        id: '23242234234',
        date: '2023-08-28T02:40:16.237Z',
        programRegistryClinicalStatusId: 'Low risk',
      }}
    />
  </ApiContext.Provider>
));
