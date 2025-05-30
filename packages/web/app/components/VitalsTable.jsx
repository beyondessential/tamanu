import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { DynamicColumnTable } from './Table';
import { useEncounter } from '../contexts/Encounter';
import { useVitalsQuery } from '../api/queries/useVitalsQuery';
import { EditVitalCellModal } from './EditVitalCellModal';
import { getVitalsTableColumns } from './VitalsAndChartsTableColumns';
import { useSettings } from '../contexts/Settings';

const StyledDynamicColumnTable = styled(DynamicColumnTable)`
  overflow-y: scroll;
  max-height: 62vh; /* Matches generic Table height */
`;

export const VitalsTable = React.memo(() => {
  const patient = useSelector((state) => state.patient);
  const { encounter } = useEncounter();
  const { data, recordedDates, error, isLoading } = useVitalsQuery(encounter.id);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const { getSetting } = useSettings();
  const isVitalEditEnabled = getSetting('features.enableVitalEdit');
  const showFooterLegend = data.some((entry) =>
    recordedDates.some((date) => entry[date].historyLogs.length > 1),
  );

  const onCellClick = (clickedCell) => {
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
        data-testid="editvitalcellmodal-wdxx"
      />
      <StyledDynamicColumnTable
        columns={columns}
        data={data}
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
