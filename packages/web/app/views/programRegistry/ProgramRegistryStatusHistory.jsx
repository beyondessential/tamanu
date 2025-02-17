import React, { useMemo } from 'react';
import styled from 'styled-components';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { Table } from '../../components/Table/Table';
import { DateDisplay } from '../../components/DateDisplay';
import { Heading5 } from '../../components/Typography';
import { useProgramRegistryClinicalStatusQuery } from '../../api/queries/useProgramRegistryClinicalStatusQuery';
import { ClinicalStatusDisplay } from './ClinicalStatusDisplay';
import { useTableSorting } from '../../components/Table/useTableSorting';
import { Colors } from '../../constants';

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledTable = styled(Table)`
  flex: 1;
  display: flex;
  flex-direction: column;
  border-color: ${Colors.softOutline};

  thead th {
    border-color: ${Colors.softOutline};
  }
  table tr:last-child td {
    border: none; // remove border from last row of table to prevent double border
  }
`;

export const ProgramRegistryStatusHistory = ({ patientProgramRegistration }) => {
  const { data, isLoading } = useProgramRegistryClinicalStatusQuery(
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
      (row) => row.registrationStatus === REGISTRATION_STATUSES.INACTIVE,
    );
    return [
      {
        key: 'clinicalStatusId',
        title: 'Status',
        sortable: false,
        accessor: (row) => {
          return <ClinicalStatusDisplay clinicalStatus={row.clinicalStatus} />;
        },
      },
      {
        key: 'clinicianId',
        title: 'Recorded By',
        sortable: false,
        accessor: (row) => row.clinician.displayName,
      },
      {
        key: 'date',
        title: 'Date recorded',
        sortable: true,
        accessor: (row) => <DateDisplay date={row.date} />,
      },
      ...(removedOnce
        ? [
            {
              key: 'registrationDate',
              title: 'Date of registration',
              sortable: false,
              accessor: (row) => <DateDisplay date={row?.registrationDate} />,
            },
          ]
        : []),
    ];
  }, [data]);

  return (
    <Container>
      <Heading5 mt={0} mb={1}>
        Program status history
      </Heading5>
      <StyledTable
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
