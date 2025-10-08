import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { SETTING_KEYS, PROGRAM_DATA_ELEMENT_TYPES } from '@tamanu/constants';
import { getReferenceDataOptionStringId, getReferenceDataStringId } from '@tamanu/shared/utils/translation';

import { DynamicColumnTable } from './Table';
import { useEncounter } from '../contexts/Encounter';
import { useVitalsQuery } from '../api/queries/useVitalsQuery';
import { EditVitalCellModal } from './EditVitalCellModal';
import { getVitalsTableColumns } from './VitalsAndChartsTableColumns';
import { useSettings } from '../contexts/Settings';
import { useTranslation } from '../contexts/Translation';

const StyledDynamicColumnTable = styled(DynamicColumnTable)`
  overflow-y: scroll;
  max-height: 62vh; /* Matches generic Table height */
`;

export const VitalsTable = React.memo(() => {
  const patient = useSelector(state => state.patient);
  const { getTranslation } = useTranslation();
  const { encounter } = useEncounter();
  const { data, recordedDates, error, isLoading } = useVitalsQuery(encounter.id);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const { getSetting } = useSettings();
  const isVitalEditEnabled = getSetting(SETTING_KEYS.FEATURES_ENABLE_VITAL_EDIT);
  const showFooterLegend = data.some((entry) =>
    recordedDates.some((date) => entry[date].historyLogs.length > 1),
  );

  const onCellClick = useCallback((clickedCell) => {
    setOpenEditModal(true);
    setSelectedCell(clickedCell);
  }, []);

  const columns = getVitalsTableColumns(patient, recordedDates, onCellClick, isVitalEditEnabled);

  const translatedData = data.map(record => {
    // First translate the element heading
    const processedRecord = {
      ...record,
      value: getTranslation(
        getReferenceDataStringId(record.dataElementId, 'programDataElement'),
        record.value,
      ),
    };

    // Then translate any select options
    recordedDates.forEach(date => {
      const { component, value } = record[date];
      const { dataElement, dataElementId } = component;
      const { type } = dataElement;

      const isTranslatableOption = [
        PROGRAM_DATA_ELEMENT_TYPES.SELECT,
        PROGRAM_DATA_ELEMENT_TYPES.RADIO,
        PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT,
      ].includes(type);

      if (isTranslatableOption && value) {
        const optionStringId = getReferenceDataOptionStringId(
          dataElementId,
          'programDataElement',
          value,
        );

        processedRecord[date] = {
          ...record[date],
          value: getTranslation(optionStringId, value),
        };
      }
    });
    return processedRecord;
  });

  return (
    <>
      <EditVitalCellModal
        open={openEditModal}
        isVital
        dataPoint={selectedCell}
        onClose={() => {
          setOpenEditModal(false);
        }}
        data-testid="editvitalcellmodal-wdxx"
      />
      <StyledDynamicColumnTable
        columns={columns}
        data={translatedData}
        elevated={false}
        isLoading={isLoading}
        errorMessage={error?.message}
        count={data.length}
        allowExport
        showFooterLegend={showFooterLegend}
        data-testid="dynamiccolumntable-4tgw"
        isBodyScrollable
      />
    </>
  );
});
