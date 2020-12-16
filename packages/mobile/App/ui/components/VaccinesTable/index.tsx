import React, { ReactElement } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { uniqBy } from 'lodash';
import { useBackendEffect } from '~/ui/hooks';
import { Table } from '../Table';
import { VaccineRowHeader } from './VaccineRowHeader';
import { VaccineTableCell } from './VaccinesTableCell';
import { VaccinesTableTitle } from './VaccinesTableTitle';
import { vaccineTableHeader } from './VaccineTableHeader';
import { ErrorScreen } from '../ErrorScreen';
import { LoadingScreen } from '../LoadingScreen';
import { getWeeksFromBirth, ScheduledVaccineStatus } from '~/ui/helpers/patient';

interface VaccinesTableProps {
  selectedPatient: any;
  categoryName: string;
  onPressItem: (item: any) => void;
}

export const VaccinesTable = ({
  onPressItem,
  categoryName,
  selectedPatient,
}: VaccinesTableProps): ReactElement => {
  const isFocused = useIsFocused();

  const [data, error] = useBackendEffect(
    ({ models }) => models.ScheduledVaccine.find({
      order: { index: 'ASC' },
      where: { category: categoryName },
    }),
    [],
  );

  const [administeredData, administeredError] = useBackendEffect(
    ({ models }) => models.AdministeredVaccine.getForPatient(selectedPatient.id),
    [isFocused],
  );

  if (error || administeredError) return <ErrorScreen error={error || administeredError} />;
  if (!data) return <LoadingScreen />;

  const schedules = uniqBy(data, 'schedule').map(d => d.schedule);

  const columnData = data.map(({ id, weeksFromBirthDue, label, vaccine }) => ({
    key: vaccine.id,
    title: label,
    subtitle: vaccine.name,
    rowHeader: (column: any): ReactElement => (
      <VaccineRowHeader key={column.key} row={column} />
    ),
    accessor: (row: any, onPress, column): ReactElement => (
      <VaccineTableCell
        onPress={onPress}
        key={column.key}
        vaccine={{
          ...vaccine,
          weeksUntilDue: weeksFromBirthDue
            ? weeksFromBirthDue - getWeeksFromBirth(selectedPatient.dateOfBirth)
            : null,
          scheduledVaccineId: id,
          status: row[column.key],
          schedule: row.header,
        }}
      />
    ),
  }));

  const rowData = schedules.map(schedule => {
    const dataForSchedule = data.filter(d => d.schedule === schedule);

    return dataForSchedule.reduce((state, current) => {
      const administeredVaccine = administeredData && administeredData.find(
        v => v.scheduledVaccine.id === current.id,
      );

      const vaccineStatus = administeredVaccine
        ? administeredVaccine.status
        : ScheduledVaccineStatus.SCHEDULED;

      return {
        ...state,
        [current.vaccine.id]: vaccineStatus,
      };
    }, { header: schedule });
  });

  return (
    <Table
      onPressItem={onPressItem}
      columns={uniqBy(columnData, 'key')}
      Title={VaccinesTableTitle}
      data={rowData}
      tableHeader={vaccineTableHeader}
      columnKey="header"
    />
  );
};
