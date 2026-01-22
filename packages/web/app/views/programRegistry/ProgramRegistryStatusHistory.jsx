import React, { useMemo } from 'react';
import styled from 'styled-components';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { useParams } from 'react-router';
import { TranslatedText, TAMANU_COLORS } from '@tamanu/ui-components';
import { Table, DateDisplay, Heading5 } from '../../components';
import { useProgramRegistryClinicalStatusQuery } from '../../api/queries/useProgramRegistryClinicalStatusQuery';
import { ClinicalStatusDisplay } from './ClinicalStatusDisplay';
import { useTableSorting } from '../../components/Table/useTableSorting';

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledTable = styled(Table)`
  flex: 1;
  display: flex;
  flex-direction: column;
  border-color: ${TAMANU_COLORS.outline};

  table tr:last-child td {
    border: none; // remove border from last row of table to prevent double border
  }

  .MuiTableCell-head {
    height: 45px;
    padding: 5px;
    color: ${TAMANU_COLORS.darkText};
    border-color: ${TAMANU_COLORS.outline};

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
  const { data = [], isLoading } = useProgramRegistryClinicalStatusQuery(
    patientId,
    programRegistryId,
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
    const removedOnce = data.some(row => row.registrationStatus === REGISTRATION_STATUSES.INACTIVE);
    return [
      {
        key: 'clinicalStatusId',
        title: <TranslatedText stringId="programRegistry.clinicalStatus.label" fallback="Status" />,
        sortable: false,
        accessor: ClinicalStatusDisplay,
      },
      {
        key: 'clinicianId',
        title: (
          <TranslatedText
            stringId="programRegistry.statusHistory.recordedBy"
            fallback="Recorded By"
          />
        ),
        sortable: false,
        accessor: row => row.clinician.displayName,
      },
      {
        key: 'date',
        sortable: false,
        title: (
          <TranslatedText
            stringId="programRegistry.statusHistory.dateRecorded"
            fallback="Date recorded"
          />
        ),
        accessor: row => <DateDisplay date={row.date} />,
      },
      ...(removedOnce
        ? [
            {
              key: 'registrationDate',
              title: (
                <TranslatedText
                  stringId="programRegistry.registrationDate.label"
                  fallback="Date of registration"
                />
              ),
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
          stringId="programRegistry.statusHistory.title"
          fallback="Program status history"
        />
      </Heading5>
      <StyledTable
        isBodyScrollable
        initialSort={{
          orderBy: 'date',
          order: 'asc',
        }}
        data={data}
        columns={columns}
        rowsPerPage={4}
        allowExport={false}
        noDataMessage={
          <TranslatedText
            stringId="programRegistry.statusHistory.noDataMessage"
            fallback="No Program registry clinical status found"
          />
        }
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
