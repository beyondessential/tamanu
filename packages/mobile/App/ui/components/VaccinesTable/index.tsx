import React, { useMemo, useRef } from 'react';
import { uniqBy } from 'lodash';
import { useBackendEffect } from '~/ui/hooks';
import { Table } from '../Table';
import { VaccineRowHeader } from './VaccineRowHeader';
import { VaccinesTableTitle } from './VaccinesTableTitle';
import { vaccineTableHeader } from './VaccineTableHeader';
import { ErrorScreen } from '../ErrorScreen';
import { LoadingScreen } from '../LoadingScreen';
import { VaccineStatus } from '~/ui/helpers/patient';
import { CellContent, VaccineTableCell, VaccineTableCellData } from './VaccinesTableCell';
import { IScheduledVaccine } from '~/types';
import { ScrollView } from 'react-native-gesture-handler';
import { StyledView } from '~/ui/styled/common';
import { VisibilityStatus } from '~/visibilityStatuses';
import { useSettings } from '~/ui/contexts/SettingsContext';
import { getVaccineStatus, parseThresholdsSetting } from '~/ui/helpers/getVaccineStatus';
import { SETTING_KEYS } from '~/constants';
import { useIsFocused } from '@react-navigation/native';

type VaccineTableCells = Record<string, VaccineTableCellData[]>;

interface VaccinesTableProps {
  selectedPatient: any;
  categoryName: string;
  onPressItem: (item: any) => void;
}

export const VaccinesTable = ({
  onPressItem,
  categoryName,
  selectedPatient,
}: VaccinesTableProps): JSX.Element => {
  const { getSetting } = useSettings();
  const thresholds = useMemo(
    () => parseThresholdsSetting(getSetting<any>(SETTING_KEYS.UPCOMING_VACCINATION_THRESHOLDS)),
    [],
  );

  const scrollViewRef = useRef(null);
  const isFocused = useIsFocused();

  // This manages the horizontal scroll of the header. This handler is passed down
  // to the scrollview in the generic table. That gets the horizontal scroll coordinate
  // of the table and feeds this back up to position the header appropriately.
  const handleScroll = (event: any) => {
    scrollViewRef.current.scrollTo({ x: event.nativeEvent.contentOffset.x, animated: false });
  };

  const [scheduledVaccines, scheduledVaccineError] = useBackendEffect(
    async ({ models }) =>
      (await models.ScheduledVaccine.find({
        order: { index: 'ASC' },
        where: { category: categoryName },
      })) as IScheduledVaccine[],
    [],
  );
  const [patientAdministeredVaccines, administeredError] = useBackendEffect(
    ({ models }) => models.AdministeredVaccine.getForPatient(selectedPatient.id),
    [isFocused],
  );

  const [nonHistoricalOrAdministeredScheduledVaccines, cells] = useMemo(() => {
    if (!scheduledVaccines || !patientAdministeredVaccines || !thresholds) return [];
    const cells: VaccineTableCells = {};
    const filteredScheduledVaccines = [];

    for (const scheduledVaccine of scheduledVaccines) {
      const administeredVaccine = patientAdministeredVaccines.find(v => {
        if (typeof v.scheduledVaccine === 'string') {
          throw new Error('VaccinesTable: administeredVaccine did not embed scheduledVaccine');
        }
        return v.scheduledVaccine.id === scheduledVaccine.id;
      });

      const shouldDisplayVaccine =
        scheduledVaccine.visibilityStatus === VisibilityStatus.Current || administeredVaccine;

      if (shouldDisplayVaccine) {
        const vaccineStatus = administeredVaccine
          ? administeredVaccine.status
          : VaccineStatus.SCHEDULED;

        const dueStatus = getVaccineStatus(
          { scheduledVaccine, patient: selectedPatient, patientAdministeredVaccines },
          thresholds,
        );

        cells[scheduledVaccine.doseLabel] = [
          ...(cells[scheduledVaccine.doseLabel] || []),
          {
            scheduledVaccine: scheduledVaccine as IScheduledVaccine,
            vaccineStatus,
            administeredVaccine,
            patientAdministeredVaccines,
            patient: selectedPatient,
            dueStatus,
            label: scheduledVaccine.label,
          },
        ];
        filteredScheduledVaccines.push(scheduledVaccine);
      }
    }
    return [filteredScheduledVaccines, cells];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientAdministeredVaccines, thresholds]);

  const error = scheduledVaccineError || administeredError;
  const isLoading =
    !scheduledVaccines ||
    !patientAdministeredVaccines ||
    !nonHistoricalOrAdministeredScheduledVaccines;

  const uniqueByVaccine = uniqBy(nonHistoricalOrAdministeredScheduledVaccines, 'label');

  if (error) return <ErrorScreen error={error} />;
  if (isLoading) return <LoadingScreen />;

  uniqueByVaccine.sort(
    (a, b) =>
      a.sortIndex - b.sortIndex ||
      a.weeksFromBirthDue - b.weeksFromBirthDue ||
      a.label.localeCompare(b.label),
  );

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
    cell: (cellData: VaccineTableCellData) => {
      if (!cellData) return <CellContent vaccineStatus={VaccineStatus.UNKNOWN} />;
      const { vaccineStatus, dueStatus, scheduledVaccine } = cellData;
      const status = vaccineStatus || dueStatus.status || VaccineStatus.UNKNOWN;
      const cellId = `${categoryName}-${scheduledVaccine?.id}-${status}`;
      return (
        <VaccineTableCell
          onPress={onPressItem}
          data={cellData}
          status={status}
          key={`vaccine-table-cell-${cellId}`}
          id={cellId}
        />
      );
    },
  }));

  const uniqueBySchedule = uniqBy(nonHistoricalOrAdministeredScheduledVaccines, 'doseLabel');
  const columns = uniqueBySchedule.map(scheduledVaccine => scheduledVaccine.doseLabel);

  return (
    <ScrollView bounces={false} stickyHeaderIndices={[0]}>
      <StyledView flexDirection="row">
        <VaccinesTableTitle />
        <ScrollView ref={scrollViewRef} horizontal scrollEnabled={false}>
          {columns.map((column: any) => (
            <StyledView key={`vaccine-table-tab-${categoryName}-${column}`}>
              {vaccineTableHeader.accessor(column, onPressItem)}
            </StyledView>
          ))}
        </ScrollView>
      </StyledView>
      <Table
        onPressItem={onPressItem}
        rows={rows}
        columns={columns}
        cells={cells}
        scrollHandler={handleScroll}
      />
    </ScrollView>
  );
};
