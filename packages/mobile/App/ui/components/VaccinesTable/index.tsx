import React, { ReactElement } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { uniqBy } from 'lodash';
import { useBackendEffect } from '~/ui/hooks';
import { Table } from '../Table';
import { VaccineRowHeader } from './VaccineRowHeader';
import { VaccinesTableTitle } from './VaccinesTableTitle';
import { vaccineTableHeader } from './VaccineTableHeader';
import { ErrorScreen } from '../ErrorScreen';
import { LoadingScreen } from '../LoadingScreen';
import { getWeeksFromBirth, VaccineStatus } from '~/ui/helpers/patient';
import { VaccineTableCell } from './VaccinesTableCell';

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

  const uniqueByVaccine = uniqBy(data, 'label');
  const rows = uniqueByVaccine.map(scheduledVaccine => ({
    rowTitle: scheduledVaccine.label,
    rowKey: 'label',
    rowHeader: (): ReactElement => (
      <VaccineRowHeader
        key={scheduledVaccine.id}
        title={scheduledVaccine.label}
        subtitle={scheduledVaccine.vaccine.name}
      />
    ),
    cell: (cellData): ReactElement => (
      <VaccineTableCell
        onPress={onPressItem}
        data={cellData}
      />
    ),
  }));

  const uniqueBySchedule = uniqBy(data, 'schedule');
  const columns = uniqueBySchedule.map(scheduledVaccine => scheduledVaccine.schedule);

  const cells = {};
  data.forEach(scheduledVaccine => {
    const administeredVaccine = administeredData && administeredData.find(
      v => v.scheduledVaccine.id === scheduledVaccine.id,
    );

    const weeksUntilDue = scheduledVaccine.weeksFromBirthDue
      ? scheduledVaccine.weeksFromBirthDue - getWeeksFromBirth(selectedPatient.dateOfBirth)
      : null;

    const vaccineStatus = administeredVaccine
      ? administeredVaccine.status
      : VaccineStatus.SCHEDULED;

    cells[scheduledVaccine.schedule] = [
      ...(cells[scheduledVaccine.schedule] || []),
      { ...scheduledVaccine, vaccineStatus, weeksUntilDue },
    ];
  });

  return (
    <Table
      onPressItem={onPressItem}
      rows={rows}
      columns={columns}
      cells={cells}
      Title={VaccinesTableTitle}
      tableHeader={vaccineTableHeader}
    />
  );
};
