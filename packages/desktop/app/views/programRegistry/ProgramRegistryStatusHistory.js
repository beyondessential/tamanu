import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Table } from '../../components/Table/Table';
import { DateDisplay } from '../../components/DateDisplay';
import { Colors, STATUS_COLOR, PROGRAM_REGISTRATION_STATUSES } from '../../constants';
import { Heading3 } from '../../components/Typography';
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
export const ProgramRegistryStatusHistory = ({ programRegistry }) => {
  const { data, isLoading } = useProgramRegistryClinicalStatus(programRegistry.id, {
    orderBy: 'date',
    order: 'asc',
  });

  const columns = useMemo(() => {
    const removedOnce = (data ? data.data : []).some(
      row => row.registrationStatus === PROGRAM_REGISTRATION_STATUSES.REMOVED,
    );
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
        rowStyle={() => `height: 82px;`}
        containerStyle="height: 350px;"
        allowExport={false}
        noDataMessage="No Program registry clinical status found"
        elevated={false}
        isLoading={isLoading}
      />
    </Container>
  );
};
