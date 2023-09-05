import React from 'react';
import styled from 'styled-components';
import { DataFetchingTable } from '../../components/Table/DataFetchingTable';
import { DateDisplay } from '../../components/DateDisplay';
import { Colors, STATUS_COLOR } from '../../constants';
import { Heading3 } from '../../components/Typography';

const Container = styled.div`
  background-color: ${Colors.white};
  padding: 15px 15px 30px 15px;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: center;
`;

const StatusBadge = styled.div`
  padding: 15px 10px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  width: fit-content;
  height: 20px;
  background-color: ${props => STATUS_COLOR[props.color].background};
  color: ${props => STATUS_COLOR[props.color].color};
`;
export const ProgramRegistryStatusHistory = ({ patient, program }) => {
  const columns = [
    {
      key: 'status',
      title: 'Status',
      accessor: row => {
        return <StatusBadge color={row.status.color}>{row.status.name}</StatusBadge>;
      },
      sortable: false,
    },
    {
      key: 'clinicianId',
      title: 'Recorded By',
      sortable: false,
      accessor: row => row.clinician.displayName,
    },
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
        endpoint={`/patient/${patient.id}/programRegistration/${program.id}`}
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
