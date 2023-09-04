import React from 'react';
import { DataFetchingTable } from '../../components/Table/DataFetchingTable';
import { DateDisplay } from '../../components/DateDisplay';
import { MenuButton } from '../../components/MenuButton';

export const ProgramRegistryFormHistory = ({ program }) => {
  const columns = [
    {
      key: 'date',
      title: 'Date submitted',
      accessor: row => <DateDisplay date={row.date} />,
    },
    { key: 'submittedBy', title: 'Submitted By', sortable: false },
    {
      key: 'from',
      title: 'From',
      sortable: false,
    },
    { key: 'result', title: 'Result', sortable: false },
    {
      sortable: false,
      accessor: () => (
        <MenuButton
          actions={{
            Print: () => {},
            Edit: () => {},
            Delete: () => {},
          }}
        />
      ),
    },
  ];
  return (
    <DataFetchingTable
      endpoint={`/programRegistry/history/${program.id}`}
      columns={columns}
      initialSort={{
        orderBy: 'date',
        order: 'asc',
      }}
      noDataMessage="No program responses found"
      // onRowClick={onSelectResponse}
      elevated={false}
    />
  );
};
