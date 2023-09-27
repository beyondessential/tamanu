import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Table } from '../../components/Table/Table';
import { DateDisplay } from '../../components/DateDisplay';
import { Colors, STATUS_COLOR, PROGRAM_REGISTRATION_STATUSES } from '../../constants';
import { Heading5 } from '../../components/Typography';
import { useProgramRegistryClinicalStatus } from '../../api/queries/useProgramRegistryClinicalStatus';

const Container = styled.div`
  width: 70%;
  background-color: ${Colors.white};
  padding: 15px 15px 30px 15px;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: center;
  margin-right: 10px;
  border-radius: 5px;
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
export const ProgramRegistryStatusHistory = ({ patientProgramRegistration }) => {
  const { data, isLoading } = useProgramRegistryClinicalStatus(
    patientProgramRegistration.patientId,
    patientProgramRegistration.id,
    {
      orderBy: 'date',
      order: 'asc',
    },
  );

  const columns = useMemo(() => {
    const removedOnce = (data ? data.data : []).some(
      row => row.registrationStatus === PROGRAM_REGISTRATION_STATUSES.REMOVED,
    );
    return [
      {
        key: 'clinicalStatusId',
        title: 'Status',
        accessor: row => {
          return (
            <StatusBadge color={row.clinicalStatus.color}>{row.clinicalStatus.name}</StatusBadge>
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
      <Heading5>Program Status History</Heading5>
      <br />
      <Table
        isBodyScrollable
        data={data ? data.data : []}
        columns={columns}
        rowsPerPage={4}
        rowStyle={() => `height: 50px; padding: 0px;`}
        containerStyle="max-height: 320px;"
        allowExport={false}
        noDataMessage="No Program registry clinical status found"
        elevated={false}
        isLoading={isLoading}
      />
    </Container>
  );
};
