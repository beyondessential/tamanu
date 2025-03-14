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
import { TranslatedText } from '../../components';
import { useParams } from 'react-router-dom';

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledTable = styled(Table)`
  flex: 1;
  display: flex;
  flex-direction: column;
  border-color: ${Colors.outline};

  table tr:last-child td {
    border: none; // remove border from last row of table to prevent double border
  }

  .MuiTableCell-head {
    height: 45px;
    padding: 5px;
    color: ${Colors.darkText};
    border-color: ${Colors.outline};

    &:first-child {
      padding-left: 15px;
    }
  }

  .MuiTableCell-body {
    height: 50px;
    padding: 5px;

    &:first-child {
      padding-left: 15px;
    }
  }
`;

export const ProgramRegistryStatusHistory = () => {
  const { patientId, programRegistryId } = useParams();
  const { data, isLoading } = useProgramRegistryClinicalStatusQuery(patientId, programRegistryId, {
    orderBy: 'date',
    order: 'desc',
  });

  const { orderBy, order, onChangeOrderBy, customSort } = useTableSorting({
    initialSortKey: 'date',
    initialSortDirection: 'desc',
  });

  const columns = useMemo(() => {
    const removedOnce = (data ? data.data : []).some(
      row => row.registrationStatus === REGISTRATION_STATUSES.INACTIVE,
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
        sortable: false,
        accessor: row => <DateDisplay date={row.date} />,
      },
      ...(removedOnce
        ? [
            {
              key: 'registrationDate',
              title: 'Date of registration',
              sortable: false,
              accessor: row => <DateDisplay date={row?.registrationDate} />,
            },
          ]
        : []),
    ];
  }, [data]);

  return (
    <Container>
      <Heading5 mt={0} mb={1}>
        <TranslatedText
          stringId="patientProgramRegistry.statusHistory.title"
          fallback="Program status history"
        />
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
