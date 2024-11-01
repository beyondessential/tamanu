import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { DynamicColumnTable, Table } from './Table';

import { Box } from '@material-ui/core';

import { Colors } from '../constants';
import { useEncounter } from '../contexts/Encounter';
import { useEncounterChartsQuery } from '../api/queries/useEncounterChartsQuery';
import { EditVitalCellModal } from './EditVitalCellModal';
import { TranslatedText } from './Translation/TranslatedText';
import { getChartsTableColumns } from './VitalsAndChartsTableColumns';
import { LoadingIndicator } from './LoadingIndicator';

export const ChartsTable = React.memo(({ selectedSurveyId }) => {
  const patient = useSelector(state => state.patient);
  const { encounter } = useEncounter();
  const { data, recordedDates, error, isLoading } = useEncounterChartsQuery(
    encounter.id,
    selectedSurveyId,
  );
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

  if (isLoading) {
    return (
      <Box mt={2}>
        <LoadingIndicator height="400px" />
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Table
        columns={[]}
        data={[]}
        elevated={false}
        noDataBackgroundColor={Colors.background}
        noDataMessage={
          <Box color={Colors.primary} fontWeight={500}>
            {selectedSurveyId === '' ? (
              <TranslatedText
                stringId="chart.table.noChart"
                fallback="This patient has no recorded charts to display. Select the required chart to document a chart."
              />
            ) : (
              <TranslatedText
                stringId="chart.table.noData"
                fallback="This patient has no chart information to display. Click ‘Record’ to add information to this chart."
              />
            )}
          </Box>
        }
      />
    );
  }

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
        errorMessage={error?.message}
        count={data.length}
        allowExport
        showFooterLegend={showFooterLegend}
      />
    </>
  );
});
