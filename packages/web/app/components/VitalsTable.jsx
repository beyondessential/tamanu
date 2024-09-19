import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { DynamicColumnTable } from './Table';
import { useEncounter } from '../contexts/Encounter';
import { useVitals } from '../api/queries/useVitals';
import { EditVitalCellModal } from './EditVitalCellModal';
import { useLocalisation } from '../contexts/Localisation';
import { getVitalsTableColumns } from './VitalsTableColumns';

export const VitalsTable = React.memo(() => {
  const patient = useSelector(state => state.patient);
  const { encounter } = useEncounter();
  const { data, recordedDates, error, isLoading } = useVitals(encounter.id);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const { getLocalisation } = useLocalisation();
  const isVitalEditEnabled = getLocalisation('features.enableVitalEdit');
  const showFooterLegend = data.some(entry =>
    recordedDates.some(date => entry[date].historyLogs.length > 1),
  );

  const onCellClick = clickedCell => {
    setOpenEditModal(true);
    setSelectedCell(clickedCell);
  };

  const columns = getVitalsTableColumns(patient, recordedDates, onCellClick, isVitalEditEnabled);

  return (
    <>
      <EditVitalCellModal
        open={openEditModal}
        dataPoint={selectedCell}
        onClose={() => {
          setOpenEditModal(false);
        }}
      />
      <DynamicColumnTable
        columns={columns}
        data={data}
        elevated={false}
        isLoading={isLoading}
        errorMessage={error?.message}
        count={data.length}
        allowExport
        showFooterLegend={showFooterLegend}
      />
    </>
  );
});
