import React, { useMemo, useRef, useState } from 'react';
// import { useIsFocused } from '@react-navigation/native';
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
import { ScrollView } from 'react-native-gesture-handler';
import { StyledView } from '~/ui/styled/common';
import { VisibilityStatus } from '~/visibilityStatuses';
import { useSettings } from '~/ui/contexts/SettingsContext';
import { getVaccineStatus, parseThresholdsSetting } from '~/ui/helpers/getVaccineStatus';
import { SETTING_KEYS } from '~/constants';

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

  // This manages the horizontal scroll of the header. This handler is passed down
  // to the scrollview in the generic table. That gets the horizontal scroll coordinate
  // of the table and feeds this back up to position the header appropriately.
  const handleScroll = (event: any) => {
    scrollViewRef.current.scrollTo({ x: event.nativeEvent.contentOffset.x, animated: false });
  };

  // const isFocused = useIsFocused();

  const [scheduledVaccines, error] = useBackendEffect(
    ({ models }) =>
      models.ScheduledVaccine.find({
        order: { index: 'ASC' },
        where: { category: categoryName },
      }),
    [],
  );

  const [patientAdministeredVaccines, administeredError] = useBackendEffect(
    ({ models }) => models.AdministeredVaccine.getForPatient(selectedPatient.id),
    [],
  );

  const [cells, setCells] = useState<{ [doseLabel: string]: VaccineTableCellData[] }>({});

  const nonHistoricalOrAdministeredScheduledVaccines = useMemo(() => {
    if (!scheduledVaccines || !patientAdministeredVaccines || !thresholds) return null;
    return scheduledVaccines?.filter(scheduledVaccine => {
      const administeredVaccine = patientAdministeredVaccines?.find(v => {
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

        setCells(cells => ({
          ...cells,
          [scheduledVaccine.doseLabel]: [
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
          ],
        }));
      }

      return shouldDisplayVaccine;
    });
  }, [patientAdministeredVaccines, thresholds]);

  const uniqueByVaccine = uniqBy(nonHistoricalOrAdministeredScheduledVaccines, 'label');

  if (error || administeredError) return <ErrorScreen error={error || administeredError} />;
  if (
    !scheduledVaccines ||
    !patientAdministeredVaccines ||
    !nonHistoricalOrAdministeredScheduledVaccines
  )
    return <LoadingScreen />;

  uniqueByVaccine.sort(
    (a, b) =>
      a.sort - b.sort ||
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
      return (
        <VaccineTableCell
          onPress={onPressItem}
          data={cellData}
          key={cellData?.scheduledVaccine?.id || Math.random()}
          id={cellData?.scheduledVaccine?.id}
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
            <StyledView key={`${column}`}>
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
