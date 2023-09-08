import React, { useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { Table } from '../../components/Table/Table';
import { DateDisplay } from '../../components/DateDisplay';
import { Colors, STATUS_COLOR } from '../../constants';
import { Heading3 } from '../../components/Typography';
import { PROGRAM_REGISTRATION_STATUSES } from '../../constants';
import { useProgramRegistryClinicalStatus } from '../../api/queries/useProgramRegistryClinicalStatus';
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
  const { data, isLoading } = useProgramRegistryClinicalStatus(program.id, {
    orderBy: 'date',
    order: 'asc',
  });
  const onDataFetched = useCallback(data => {
    return data.some(row => row.registrationStatus === PROGRAM_REGISTRATION_STATUSES.REMOVED);
  });
  const columns = useMemo(() => {
    const removedOnce = onDataFetched(data ? data.data : []);
    return [
      {
        key: 'programRegistryClinicalStatusId',
        title: 'Status',
        accessor: row => {
          return (
            <StatusBadge color={row.programRegistryClinicalStatus.color}>
              {row.programRegistryClinicalStatus.name}
            </StatusBadge>
          );
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
        sortable: true,
      },
      ...(removedOnce
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
  }, [data]);

  return (
    <Container>
      <Heading3>Program Status History</Heading3>
      <br />
      <Table
        isBodyScrollable
        data={data ? data.data : []}
        columns={columns}
        rowsPerPage={4}
        allowExport={false}
        onDataFetched={onDataFetched}
        noDataMessage="No program responses found"
        // onRowClick={onSelectResponse}
        elevated={false}
      />
    </Container>
  );
};
