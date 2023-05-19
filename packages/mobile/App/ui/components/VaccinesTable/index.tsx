import React from 'react';
import { useIsFocused } from '@react-navigation/native';
import { uniqBy } from 'lodash';
import { useBackendEffect } from '~/ui/hooks';
import { Table } from '../Table';
import { VaccineRowHeader } from './VaccineRowHeader';
import { VaccinesTableTitle } from './VaccinesTableTitle';
import { vaccineTableHeader } from './VaccineTableHeader';
import { ErrorScreen } from '../ErrorScreen';
import { LoadingScreen } from '../LoadingScreen';
import { VaccineStatus } from '~/ui/helpers/patient';
import { VaccineTableCell, VaccineTableCellData } from './VaccinesTableCell';
import { IScheduledVaccine } from '~/types';

interface VaccinesTableProps {
  selectedPatient: any;
  categoryName: string;
  onPressItem: (item: any) => void;
}

export const VaccinesTable = ({
  onPressItem,
  categoryName,
  selectedPatient,
}: VaccinesTableProps) : JSX.Element => {
  const isFocused = useIsFocused();

  const [scheduledVaccines, error] = useBackendEffect(
    ({ models }) => models.ScheduledVaccine.find({
      order: { index: 'ASC' },
      where: { category: categoryName },
    }),
    [],
  );

  const [patientAdministeredVaccines, administeredError] = useBackendEffect(
    ({ models }) => models.AdministeredVaccine.getForPatient(selectedPatient.id),
    [isFocused],
  );

  if (error || administeredError) return <ErrorScreen error={error || administeredError} />;
  if (!scheduledVaccines || !patientAdministeredVaccines) return <LoadingScreen />;

  const uniqueByVaccine = uniqBy(scheduledVaccines, 'label');
  const rows = uniqueByVaccine.map(scheduledVaccine => ({
    rowTitle: scheduledVaccine.label,
    rowKey: 'label',
    rowHeader: () => (
      <VaccineRowHeader
        key={scheduledVaccine.id}
        title={scheduledVaccine.label}
        subtitle={scheduledVaccine.vaccine && scheduledVaccine.vaccine.name}
      />
    ),
    cell: (cellData: VaccineTableCellData) => (
      <VaccineTableCell
        onPress={onPressItem}
        data={cellData}
      />
    ),
  }));

  const uniqueBySchedule = uniqBy(scheduledVaccines, 'schedule');
  const columns = uniqueBySchedule.map(scheduledVaccine => scheduledVaccine.schedule);

  const cells: { [schedule: string]: VaccineTableCellData[] } = {};
  scheduledVaccines.forEach(scheduledVaccine => {
    const administeredVaccine = patientAdministeredVaccines.find(v => {
      if (typeof v.scheduledVaccine === 'string') {
        throw new Error('VaccinesTable: administeredVaccine did not embed scheduledVaccine');
      }
      return v.scheduledVaccine.id === scheduledVaccine.id;
    });

    const vaccineStatus = administeredVaccine
      ? administeredVaccine.status
      : VaccineStatus.SCHEDULED;

    cells[scheduledVaccine.schedule] = [
      ...(cells[scheduledVaccine.schedule] || []),
      {
        scheduledVaccine: scheduledVaccine as IScheduledVaccine,
        // TODO: why doesn't ScheduledVaccine fulfill IScheduledVaccine?
        vaccineStatus,
        administeredVaccine,
        patientAdministeredVaccines,
        patient: selectedPatient,
        label: scheduledVaccine.label,
      },
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
