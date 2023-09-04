import React from 'react';
import styled from 'styled-components';
import { DataFetchingTable } from '../../components/Table/DataFetchingTable';
import { DateDisplay } from '../../components/DateDisplay';
import { Colors, CLINICAL_COLORS_BY_STATUS } from '../../constants';
import { Heading3 } from '../../components/Typography';

const Container = styled.div`
  background-color: ${Colors.white};
  padding: 15px 15px 30px 15px;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: center;
`;

const Statusbadge = styled.div`
  padding: 15px 10px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  width: fit-content;
  height: 20px;
  background-color: ${props => CLINICAL_COLORS_BY_STATUS[props.children].background};
  color: ${props => CLINICAL_COLORS_BY_STATUS[props.children].color};
`;
export const ProgramRegistryStatusHistory = ({ program }) => {
  const columns = [
    {
      key: 'status',
      title: 'Status',
      accessor: row => {
        return <Statusbadge>{row.status}</Statusbadge>;
      },
      sortable: false,
    },
    { key: 'recordedBy', title: 'Recorded By', sortable: false },
    {
      key: 'date',
      title: 'Date recorded',
      accessor: row => <DateDisplay date={row.date} />,
      sortable: false,
    },
    ...(program.removedOnce
      ? [
          {
            key: 'registrationDate',
            title: 'Date of registration',
            accessor: row => <DateDisplay date={row.date} />,
            sortable: false,
          },
        ]
      : []),
  ];
  return (
    <Container>
      <Heading3>Program Status History</Heading3>
      <br />
      <DataFetchingTable
        endpoint={`/programRegistry/history/${program.id}`}
        columns={columns}
        initialSort={{
          orderBy: 'date',
          order: 'asc',
        }}
        allowExport={false}
        lazyLoading
        noDataMessage="No program responses found"
        // onRowClick={onSelectResponse}
        elevated={false}
      />
    </Container>
  );
};
