import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Table } from '../../components/Table/Table';
import { DateDisplay } from '../../components/DateDisplay';
import { Colors, PROGRAM_REGISTRATION_STATUSES } from '../../constants';
import { Heading5 } from '../../components/Typography';
import { useProgramRegistryClinicalStatus } from '../../api/queries/useProgramRegistryClinicalStatus';
import { ClinicalStatusDisplay } from './ClinicalStatusDisplay';
import { useTableSorting } from '../../components/Table/useTableSorting';

const Container = styled.div`
  width: 70%;
  background-color: ${Colors.white};
  padding: 13px 15px 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: center;
  margin-right: 10px;
  border-radius: 5px;
  border: 1px solid ${Colors.softOutline};
`;

export const ProgramRegistryStatusHistory = ({ patientProgramRegistration }) => {
  const { data, isLoading } = useProgramRegistryClinicalStatus(
    patientProgramRegistration.patientId,
    patientProgramRegistration.programRegistryId,
    {
      orderBy: 'date',
      order: 'desc',
    },
  );

  const { orderBy, order, onChangeOrderBy, customSort } = useTableSorting({
    initialSortKey: 'date',
    initialSortDirection: 'desc',
  });

  const columns = useMemo(() => {
    const removedOnce = (data ? data.data : []).some(
      row => row.registrationStatus === PROGRAM_REGISTRATION_STATUSES.REMOVED,
    );
    return [
      {
        key: 'clinicalStatusId',
        title: 'Status',
        sortable: false,
        accessor: row => {
          return <ClinicalStatusDisplay clinicalStatus={row.clinicalStatus} />;
        },
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
        sortable: true,
        accessor: row => <DateDisplay date={row.clinicalStatusUpdatedAt} />,
      },
      ...(removedOnce
        ? [
            {
              key: 'registrationDate',
              title: 'Date of registration',
              sortable: false,
              accessor: row => <DateDisplay date={row.date} />,
            },
          ]
        : []),
    ];
  }, [data]);

  return (
    <Container>
      <Heading5 style={{ marginBottom: '13px' }}>Program status history</Heading5>
      <Table
        isBodyScrollable
        initialSort={{
          orderBy: 'date',
          order: 'asc',
        }}
        data={data ? data.data : []}
        columns={columns}
        rowsPerPage={4}
        rowStyle={() => `height: 50px; padding: 0px;`}
        containerStyle="max-height: 290px;"
        allowExport={false}
        noDataMessage="No Program registry clinical status found"
        elevated={false}
        isLoading={isLoading}
        onChangeOrderBy={onChangeOrderBy}
        customSort={customSort}
        orderBy={orderBy}
        order={order}
      />
    </Container>
  );
};
