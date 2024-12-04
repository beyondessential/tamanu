import React, { useState, useMemo, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { keyBy } from 'lodash';
import { ButtonGroup } from '@material-ui/core';

import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { SURVEY_TYPES } from '@tamanu/constants';

import { TabPane } from '../components';
import { TableButtonRow, ButtonWithPermissionCheck } from '../../../components';
import { useChartSurveysQuery } from '../../../api/queries';
import { useUserPreferencesQuery } from '../../../api/queries/useUserPreferencesQuery';
import { ChartModal } from '../../../components/ChartModal';
import { ChartsTable } from '../../../components/ChartsTable';
import { getAnswersFromData } from '../../../utils';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

import { useAuth } from '../../../contexts/Auth';
import { useEncounter } from '../../../contexts/Encounter';
import { useApi } from '../../../api';
import { useEncounterComplexChartInstancesQuery } from '../../../api/queries/useEncounteComplexChartInstancesQuery';
import { TabDisplay } from '../../../components/TabDisplay';
import { Colors } from '../../../constants';
import { useQueryClient } from '@tanstack/react-query';
import { ChartDropdown } from '../../../components/Charting/ChartDropdown';
import { CoreComplexChartData } from '../../../components/Charting/CoreComplexChartData';

const StyledButtonGroup = styled(ButtonGroup)`
  .MuiButtonGroup-groupedOutlinedHorizontal:not(:first-child) {
    margin-top: 10px;
    margin-left: 10px;
  }
`;

const AddComplexChartButton = styled.span`
  color: ${Colors.primary};
  font-weight: 500;
  cursor: pointer;
  margin-left: 10px;
  margin-right: 20px;
`;

const StyledButtonWithPermissionCheck = styled(ButtonWithPermissionCheck)`
  float: right;
  .MuiButtonBase-root {
    margin: auto;
  }
`;

const ComplexChartInstancesTab = styled(TabDisplay)`
  overflow: initial;
  max-width: 400px;
  .MuiTabs-root {
    z-index: 9;
    position: sticky;
    top: 0;
  }
  .MuiTabs-scroller {
    border-bottom: none;
  }
  .MuiTab-labelIcon {
    min-height: 0px;
  }
`;

const findChartSurvey = (chartSurveys, chartId) => chartSurveys.find(({ id }) => id === chartId);

export const ChartsPane = React.memo(({ patient, encounter, readonly }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { facilityId } = useAuth();
  const { loadEncounter } = useEncounter();
  const { data: userPreferences } = useUserPreferencesQuery();
  const { data: { chartSurveys = [], complexToCoreSurveysMap = {} } = {} } = useChartSurveysQuery();

  const [modalOpen, setModalOpen] = useState(false);
  const [currentComplexChartTab, setCurrenComplexChartTab] = useState('');

  // State for the ID of the selected chart survey in the drop down
  const [selectedChartTypeId, setSelectedChartTypeId] = useState(
    userPreferences?.selectedChartTypeId,
  );
  // State for the chart survey to record responses in the modal
  const [chartSurveyIdToSubmit, setChartSurveyIdToSubmit] = useState();

  // For selecting chart types in the drop down
  const chartTypes = useMemo(
    () =>
      chartSurveys
        .filter(s => [SURVEY_TYPES.SIMPLE_CHART, SURVEY_TYPES.COMPLEX_CHART].includes(s.surveyType))
        .map(({ name, id }) => ({
          label: name,
          value: id,
        })),
    [chartSurveys],
  );

  // Full data of the selected chart from the dropdown
  const selectedChartSurvey = useMemo(() => findChartSurvey(chartSurveys, selectedChartTypeId), [
    chartSurveys,
    selectedChartTypeId,
  ]);

  const chartSurveyToSubmit = useMemo(() => findChartSurvey(chartSurveys, chartSurveyIdToSubmit), [
    chartSurveys,
    chartSurveyIdToSubmit,
  ]);

  const coreComplexChartSurveyId = useMemo(() => complexToCoreSurveysMap[selectedChartTypeId], [
    complexToCoreSurveysMap,
    selectedChartTypeId,
  ]);

  const { data: { data: chartInstances = [] } = {} } = useEncounterComplexChartInstancesQuery({
    encounterId: encounter.id,
    chartSurveyId: coreComplexChartSurveyId,
    enabled: !!coreComplexChartSurveyId, // only run when coreComplexChartSurveyId is available
  });

  // Create tabs for each chart instance
  const complexChartInstanceTabs = useMemo(
    () =>
      chartInstances.map(({ chartInstanceId, chartInstanceName }) => ({
        label: chartInstanceName,
        key: chartInstanceId,
        render: () => null, // no need to render anything, data is not displayed as content of a tab
      })),
    [chartInstances],
  );

  const complexChartInstancesById = useMemo(() => keyBy(chartInstances, 'chartInstanceId'), [
    chartInstances,
  ]);

  const currentComplexChartInstance = useMemo(
    () => complexChartInstancesById[currentComplexChartTab],
    [complexChartInstancesById, currentComplexChartTab],
  );

  // Set default current tab if not set
  useEffect(() => {
    if (!currentComplexChartTab && complexChartInstanceTabs?.length) {
      setCurrenComplexChartTab(complexChartInstanceTabs[0].key);
    }
  }, [complexChartInstanceTabs, currentComplexChartTab]);

  const handleCloseModal = () => setModalOpen(false);

  const handleSubmitChart = async ({ survey, ...data }) => {
    const submittedTime = getCurrentDateTimeString();
    const responseData = {
      surveyId: survey.id,
      startTime: submittedTime,
      patientId: patient.id,
      encounterId: encounter.id,
      endTime: submittedTime,
      answers: getAnswersFromData(data, survey),
      facilityId,
    };

    if (chartSurveyToSubmit.surveyType === SURVEY_TYPES.COMPLEX_CHART) {
      responseData.metadata = {
        chartInstanceResponseId: currentComplexChartInstance.chartInstanceId,
      };
    }

    await api.post('surveyResponse', responseData);
    handleCloseModal();
    await loadEncounter(encounter.id);
  };

  const handleDeleteChart = useCallback(async () => {
    await api.delete(
      `encounter/${encounter.id}/chartInstances/${currentComplexChartInstance?.chartInstanceId}`,
    );
    handleCloseModal();
    setCurrenComplexChartTab(null);

    // reload the chart instance tabs
    queryClient.invalidateQueries([
      'encounterComplexChartInstances',
      encounter.id,
      coreComplexChartSurveyId,
    ]);
    await loadEncounter(encounter.id);
  }, [
    api,
    encounter.id,
    currentComplexChartInstance?.chartInstanceId,
    queryClient,
    coreComplexChartSurveyId,
    loadEncounter,
  ]);

  const isComplexChart = selectedChartSurvey?.surveyType === SURVEY_TYPES.COMPLEX_CHART;
  const chartModalTitle = `${selectedChartSurvey?.name} | ${
    chartSurveyToSubmit?.surveyType === SURVEY_TYPES.COMPLEX_CHART_CORE ? 'Add' : 'Record'
  }`;

  return (
    <TabPane>
      <ChartModal
        open={modalOpen}
        title={chartModalTitle}
        onClose={handleCloseModal}
        chartSurveyId={chartSurveyIdToSubmit}
        onSubmit={handleSubmitChart}
      />

      <TableButtonRow variant="small" justifyContent="space-between">
        <StyledButtonGroup>
          <ChartDropdown
            selectedChartTypeId={selectedChartTypeId}
            setSelectedChartTypeId={setSelectedChartTypeId}
            chartTypes={chartTypes}
          />
          {isComplexChart ? (
            <AddComplexChartButton
              onClick={() => {
                setChartSurveyIdToSubmit(coreComplexChartSurveyId);
                setModalOpen(true);
              }}
            >
              + Add
            </AddComplexChartButton>
          ) : null}
        </StyledButtonGroup>

        {complexChartInstanceTabs.length && currentComplexChartTab ? (
          <ComplexChartInstancesTab
            tabs={complexChartInstanceTabs}
            currentTab={currentComplexChartTab}
            onTabSelect={tabKey => setCurrenComplexChartTab(tabKey)}
          />
        ) : null}

        {selectedChartTypeId ? (
          <StyledButtonWithPermissionCheck
            justifyContent="end"
            onClick={() => {
              setChartSurveyIdToSubmit(selectedChartTypeId);
              setModalOpen(true);
            }}
            disabled={readonly}
            verb="submit"
            noun="SurveyResponse"
          >
            <TranslatedText stringId="chart.action.record" fallback="Record" />
          </StyledButtonWithPermissionCheck>
        ) : null}
      </TableButtonRow>

      {currentComplexChartInstance ? (
        <CoreComplexChartData
          handleDeleteChart={handleDeleteChart}
          date={currentComplexChartInstance.chartDate}
          type={currentComplexChartInstance.chartType}
          subType={currentComplexChartInstance.chartSubType}
        />
      ) : null}

      <ChartsTable selectedSurveyId={selectedChartTypeId} />
    </TabPane>
  );
});

ChartsPane.propTypes = {
  patient: PropTypes.object.isRequired,
  encounter: PropTypes.string.isRequired,
  readonly: PropTypes.bool,
};

ChartsPane.defaultProps = {
  readonly: false,
};
