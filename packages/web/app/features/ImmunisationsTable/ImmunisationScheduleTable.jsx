import React, { useMemo } from 'react';
import { TranslatedText, DataFetchingTable, Heading4 } from '../../components';
import { getDueDate, getStatusTag, getRecordAction } from './accessors';
import styled from 'styled-components';
import { Colors } from '../../constants';

const Container = styled.div`
  padding: 0.9rem 1.2rem 0.8rem;
  border-bottom: 1px solid ${Colors.outline};
`;

const Title = styled(Heading4)`
  margin: 0;
`;

const TableHeader = () => {
  return (
    <Container>
      <Title>
        <TranslatedText stringId="vaccine.table.schedule.label" fallback="Vaccine schedule" />
      </Title>
    </Container>
  );
};

const getSchedule = record =>
  record.schedule || <TranslatedText stringId="general.fallback.notApplicable" fallback="N/A" />;
const getVaccineName = record =>
  record.label || <TranslatedText stringId="general.fallback.unknown" fallback="Unknown" />;

export const ImmunisationScheduleTable = React.memo(({ patient, onItemEdit }) => {
  const COLUMNS = useMemo(
    () => [
      {
        key: 'vaccineDisplayName',
        title: <TranslatedText stringId="vaccine.table.column.vaccine" fallback="Vaccine" />,
        accessor: getVaccineName,
      },
      {
        key: 'schedule',
        title: <TranslatedText stringId="vaccine.table.column.schedule" fallback="Schedule" />,
        accessor: getSchedule,
        sortable: false,
      },
      {
        key: 'dueDate',
        title: <TranslatedText stringId="vaccine.table.column.dueDate" fallback="Due date" />,
        accessor: getDueDate,
      },
      {
        key: 'status',
        title: <TranslatedText stringId="vaccine.table.column.status" fallback="Status" />,
        accessor: getStatusTag,
        sortable: false,
      },
      {
        key: 'action',
        title: <TranslatedText stringId="vaccine.table.column.action" fallback="Action" />,
        accessor: getRecordAction(onItemEdit),
        sortable: false,
        isExportable: false,
      },
    ],
    [onItemEdit],
  );

  return (
    <DataFetchingTable
      endpoint={`patient/${patient.id}/vaccineSchedule`}
      initialSort={{ orderBy: 'date', order: 'desc' }}
      columns={COLUMNS}
      noDataMessage={
        <TranslatedText stringId="vaccine.table.noDataMessage" fallback="No vaccinations found" />
      }
      allowExport={false}
      disablePagination
      TableHeader={<TableHeader />}
    />
  );
});
