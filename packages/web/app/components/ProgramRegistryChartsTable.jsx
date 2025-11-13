import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Box } from '@material-ui/core';
import styled from 'styled-components';
import { subject } from '@casl/ability';
import PropTypes from 'prop-types';

import { Colors } from '../constants';
import { DynamicColumnTable, Table } from './Table';
import { useProgramRegistryPatientChartsQuery } from '../api/queries/useProgramRegistryPatientChartsQuery';
import { EditVitalCellModal } from './EditVitalCellModal';
import { getChartsTableColumns } from './VitalsAndChartsTableColumns';
import { LoadingIndicator } from './LoadingIndicator';
import { useSettings } from '../contexts/Settings';
import { SETTING_KEYS } from '@tamanu/constants';
import { useAuth } from '../contexts/Auth';

const StyledDynamicColumnTable = styled(DynamicColumnTable)`
  overflow-y: scroll;
  max-height: 62vh; /* Matches generic Table height */
`;

export const EmptyProgramRegistryChartsTable = ({ noDataMessage, isLoading = false }) => (
  <Table
    columns={[]}
    data={[]}
    elevated={false}
    noDataBackgroundColor={Colors.background}
    isLoading={isLoading}
    noDataMessage={
      <Box color={Colors.primary} fontWeight={500} data-testid="box-k3rm">
        {noDataMessage}
      </Box>
    }
    data-testid="table-zmbt"
  />
);

export const ProgramRegistryChartsTable = React.memo(({
  patientId,
  selectedSurveyId,
  selectedChartSurveyName,
  noDataMessage,
  currentInstanceId,
}) => {
  const { ability } = useAuth();
  const patient = useSelector((state) => state.patient);
  const { data, recordedDates, error, isLoading } = useProgramRegistryPatientChartsQuery(
    patientId,
    selectedSurveyId,
    currentInstanceId,
  );
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const { getSetting } = useSettings();
  const isChartingEditEnabled = getSetting(SETTING_KEYS.FEATURES_ENABLE_CHARTING_EDIT);
  const hasReadPermission = ability.can('read', subject('Charting', { id: selectedSurveyId }));
  const showFooterLegend = data.some((entry) =>
    recordedDates.some((date) => entry[date].historyLogs.length > 1),
  );

  const onCellClick = useCallback((clickedCell) => {
    setOpenEditModal(true);
    setSelectedCell(clickedCell);
  }, []);

  // create a column for each reading
  const columns = getChartsTableColumns(
    selectedChartSurveyName,
    patient,
    recordedDates,
    onCellClick,
    isChartingEditEnabled && hasReadPermission,
  );

  // There is a bug in react-query that even if the query is not enabled, it will still return isLoading = true
  // So we need to check if the selectedSurveyId is null here to avoid showing the loading indicator
  if (selectedSurveyId && isLoading) {
    return (
      <Box mt={2} data-testid="box-zgmh">
        <LoadingIndicator height="400px" data-testid="loadingindicator-i4u9" />
      </Box>
    );
  }

  if (data.length === 0) {
    return <EmptyProgramRegistryChartsTable noDataMessage={noDataMessage} data-testid="emptychartstable-w6z7" />;
  }

  return (
    <>
      <EditVitalCellModal
        open={openEditModal}
        dataPoint={selectedCell}
        onClose={() => {
          setOpenEditModal(false);
        }}
        data-testid="editvitalcellmodal-2jqx"
      />
      <StyledDynamicColumnTable
        columns={columns}
        data={data}
        elevated={false}
        errorMessage={error?.message}
        count={data.length}
        allowExport
        showFooterLegend={showFooterLegend}
        data-testid="dynamiccolumntable-ddeu"
        isBodyScrollable
      />
    </>
  );
});

ProgramRegistryChartsTable.propTypes = {
  patientId: PropTypes.string.isRequired,
  selectedSurveyId: PropTypes.string,
  selectedChartSurveyName: PropTypes.string,
  noDataMessage: PropTypes.node,
  currentInstanceId: PropTypes.string,
};