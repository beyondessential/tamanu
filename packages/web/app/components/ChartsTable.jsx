import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { DynamicColumnTable } from './Table';
import { useEncounter } from '../contexts/Encounter';
import { useChartQuery } from '../api/queries/useChartQuery';
import { EditVitalCellModal } from './EditVitalCellModal';
import { TranslatedText } from './Translation/TranslatedText';
import { Colors } from '../constants';
import { getChartsTableColumns } from './VitalsAndChartsTableColumns';

export const ChartsTable = React.memo(({ selectedSurveyId }) => {
  const patient = useSelector(state => state.patient);
  const { encounter } = useEncounter();
  const { data, recordedDates, error, isLoading } = useChartQuery(encounter.id, selectedSurveyId);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const showFooterLegend = data.some(entry =>
    recordedDates.some(date => entry[date].historyLogs.length > 1),
  );

  const onCellClick = clickedCell => {
    setOpenEditModal(true);
    setSelectedCell(clickedCell);
  };

  // create a column for each reading
  const columns = getChartsTableColumns(
    'painChart',
    'Pain Chart',
    patient,
    recordedDates,
    onCellClick,
  );

  // TODO: no data states

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
        noDataBackgroundColor={Colors.background}
        noDataMessage={
          <TranslatedText
            stringId="chart.table.noData"
            fallback="This patient has no chart information to display. Click ‘Record’ to add information to this chart."
          />
        }
      />
    </>
  );
});
