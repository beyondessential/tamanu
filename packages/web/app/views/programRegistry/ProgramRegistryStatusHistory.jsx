import React, { useMemo } from 'react';
import styled from 'styled-components';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { Table } from '../../components/Table/Table';
import { DateDisplay } from '../../components/DateDisplay';
import { Colors } from '../../constants';
import { Heading5 } from '../../components/Typography';
import { useProgramRegistryClinicalStatusQuery } from '../../api/queries/useProgramRegistryClinicalStatusQuery';
import { ClinicalStatusDisplay } from './ClinicalStatusDisplay';
import { useTableSorting } from '../../components/Table/useTableSorting';
import { TranslatedText } from '../../components';

const Container = styled.div`
  width: ${p => (p.fullWidth ? '100%' : '70%')};
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

export const ProgramRegistryStatusHistory = ({
  patientProgramRegistration,
  programRegistryConditions,
}) => {
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
      row => row.registrationStatus === REGISTRATION_STATUSES.INACTIVE,
    );
    return [
      {
        key: 'clinicalStatusId',
        title: <TranslatedText
          stringId="programRegistry.clinicalStatus.label"
          fallback="Status"
          data-testid='translatedtext-zgga' />,
        sortable: false,
        accessor: row => {
          return <ClinicalStatusDisplay clinicalStatus={row.clinicalStatus} />;
        },
      },
      {
        key: 'clinicianId',
        title: (
          <TranslatedText
            stringId="programRegistry.statusHistory.recordedBy"
            fallback="Recorded By"
            data-testid='translatedtext-nzc5' />
        ),
        sortable: false,
        accessor: row => row.clinician.displayName,
      },
      {
        key: 'date',
        title: (
          <TranslatedText
            stringId="programRegistry.statusHistory.dateRecorded"
            fallback="Date recorded"
            data-testid='translatedtext-x3v2' />
        ),
        sortable: true,
        accessor: row => <DateDisplay date={row.date} data-testid='datedisplay-78fu' />,
      },
      ...(removedOnce
        ? [
            {
              key: 'registrationDate',
              title: (
                <TranslatedText
                  stringId="programRegistry.registrationDate.label"
                  fallback="Date of registration"
                  data-testid='translatedtext-zh5o' />
              ),
              sortable: false,
              accessor: row => <DateDisplay date={row?.registrationDate} data-testid='datedisplay-pf2l' />,
            },
          ]
        : []),
    ];
  }, [data]);

  return (
    <Container fullWidth={programRegistryConditions?.length === 0}>
      <Heading5 style={{ marginBottom: '13px' }}>
        <TranslatedText
          stringId="programRegistry.statusHistory.title"
          fallback="Program status history"
          data-testid='translatedtext-725p' />
      </Heading5>
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
        noDataMessage={
          <TranslatedText
            stringId="programRegistry.statusHistory.noDataMessage"
            fallback="No Program registry clinical status found"
            data-testid='translatedtext-1gvn' />
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
