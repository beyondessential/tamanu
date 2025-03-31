import React, { useState, useMemo, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { keyBy } from 'lodash';
import { ButtonGroup } from '@material-ui/core';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { SURVEY_TYPES } from '@tamanu/constants';

import { TabPane } from '../components';
import { TableButtonRow, ButtonWithPermissionCheck } from '../../../components';
import { useChartSurveysQuery } from '../../../api/queries';
import { ChartsTable, EmptyChartsTable } from '../../../components/ChartsTable';
import { getAnswersFromData } from '../../../utils';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

import { useAuth } from '../../../contexts/Auth';
import { useEncounter } from '../../../contexts/Encounter';
import { useApi } from '../../../api';
import { useChartData } from '../../../contexts/ChartData';
import { ChartGraphDataProvider } from '../../../contexts/VitalChartData';
import { VitalChartsModal } from '../../../components/VitalChartsModal';
import { useEncounterComplexChartInstancesQuery } from '../../../api/queries/useEncounteComplexChartInstancesQuery';
import { TabDisplay } from '../../../components/TabDisplay';
import { Colors } from '../../../constants';
import { ChartDropdown } from '../../../components/Charting/ChartDropdown';
import { CoreComplexChartData } from '../../../components/Charting/CoreComplexChartData';
import { useChartSurveyQuery } from '../../../api/queries/useChartSurveyQuery';
import { SimpleChartModal } from '../../../components/SimpleChartModal';
import { ComplexChartModal } from '../../../components/ComplexChartModal';
import { COMPLEX_CHART_FORM_MODES } from '../../../components/Charting/constants';
import { getComplexChartFormMode } from '../../../utils/chart/chartUtils';
import { ConditionalTooltip } from '../../../components/Tooltip';

const StyledButtonGroup = styled(ButtonGroup)`
  .MuiButtonGroup-groupedOutlinedHorizontal:not(:first-child) {
    margin-top: 10px;
    margin-left: 10px;
  }
`;

const TableButtonRowWrapper = styled.div`
  margin-bottom: 15px;
  border-bottom: 1px solid ${Colors.outline};
`;

const AddComplexChartButton = styled.span`
  color: ${Colors.primary};
  font-size: 15px;
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
  button&:disabled {
    opacity: 0.5;
    background-color: ${Colors.primary};
    color: ${Colors.white};
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

const getNoDataMessage = (isComplexChart, complexChartInstances, selectedSurveyId) => {
  if (!selectedSurveyId) {
    return (
      <TranslatedText
        stringId="chart.table.simple.noChart"
        fallback="This patient has no recorded charts to display. Select the required chart to document a chart."
        data-testid='translatedtext-ytlk' />
    );
  }

  if (isComplexChart && !complexChartInstances?.length) {
    return (
      <TranslatedText
        stringId="chart.table.complex.noChart"
        fallback="This patient has no chart information to display. Click '+ Add' to add information to add information to this chart."
        data-testid='translatedtext-4wfp' />
    );
  }

  return (
    <TranslatedText
      stringId="chart.table.noData"
      fallback="This patient has no chart information to display. Click ‘Record’ to add information to this chart."
      data-testid='translatedtext-fumh' />
  );
};

export const ChartsPane = React.memo(({ patient, encounter }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { facilityId } = useAuth();
  const { loadEncounter } = useEncounter();
  const {
    isLoading: isLoadingChartData,
    selectedChartTypeId,
    setSelectedChartTypeId,
  } = useChartData();
  const {
    data: { chartSurveys = [], complexToCoreSurveysMap = {} } = {},
    isLoading: isLoadingChartSurveys,
  } = useChartSurveysQuery();

  const [modalOpen, setModalOpen] = useState(false);
  const [currentComplexChartTab, setCurrentComplexChartTab] = useState('');

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

  const { data: fullChartSurvey } = useChartSurveyQuery(coreComplexChartSurveyId);

  const fieldVisibility = useMemo(
    () =>
      Object.fromEntries(
        fullChartSurvey?.components.map(c => [c.dataElementId, c.visibilityStatus]) || [],
      ),
    [fullChartSurvey?.components],
  );

  const isInstancesQueryEnabled = !!coreComplexChartSurveyId;
  const {
    data: { data: complexChartInstances = [] } = {},
    isLoading: isLoadingInstances,
  } = useEncounterComplexChartInstancesQuery({
    encounterId: encounter.id,
    chartSurveyId: coreComplexChartSurveyId,
    enabled: isInstancesQueryEnabled, // only run when coreComplexChartSurveyId is available
  });

  // Create tabs for each chart instance
  const complexChartInstanceTabs = useMemo(
    () =>
      complexChartInstances.map(({ chartInstanceId, chartInstanceName }) => ({
        label: chartInstanceName,
        key: chartInstanceId,
        render: () => null, // no need to render anything, data is not displayed as content of a tab
      })),
    [complexChartInstances],
  );

  const complexChartInstancesById = useMemo(() => keyBy(complexChartInstances, 'chartInstanceId'), [
    complexChartInstances,
  ]);

  const currentComplexChartInstance = useMemo(
    () => complexChartInstancesById[currentComplexChartTab],
    [complexChartInstancesById, currentComplexChartTab],
  );

  // Sets initial instance tab when selecting a complex chart
  useEffect(() => {
    if (complexChartInstanceTabs?.length) {
      setCurrentComplexChartTab(complexChartInstanceTabs[0].key);
    }
  }, [complexChartInstanceTabs, selectedChartTypeId]);

  const handleCloseModal = () => setModalOpen(false);

  const reloadChartInstances = useCallback(
    () =>
      queryClient.invalidateQueries([
        'encounterComplexChartInstances',
        encounter.id,
        coreComplexChartSurveyId,
      ]),
    [queryClient, encounter.id, coreComplexChartSurveyId],
  );

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
    } else if (chartSurveyToSubmit.surveyType === SURVEY_TYPES.COMPLEX_CHART_CORE) {
      reloadChartInstances();
    }

    await api.post('surveyResponse', responseData);
    handleCloseModal();
    await loadEncounter(encounter.id);
  };

  const handleDeleteChart = useCallback(async () => {
    try {
      await api.delete(
        `encounter/${encounter.id}/chartInstances/${currentComplexChartInstance?.chartInstanceId}`,
      );

      handleCloseModal();
      setCurrentComplexChartTab(null);

      reloadChartInstances();
      await loadEncounter(encounter.id);
    } catch (e) {
      toast.error(`Failed to remove chart with error: ${e.message}`);
    }
  }, [
    api,
    encounter.id,
    currentComplexChartInstance?.chartInstanceId,
    reloadChartInstances,
    loadEncounter,
  ]);

  const isComplexChart = selectedChartSurvey?.surveyType === SURVEY_TYPES.COMPLEX_CHART;
  const complexChartFormMode = getComplexChartFormMode(chartSurveyToSubmit);
  const chartModalTitle = `${selectedChartSurvey?.name} | ${
    complexChartFormMode === COMPLEX_CHART_FORM_MODES.ADD_CHART_INSTANCE ? 'Add' : 'Record'
  }`;
  const recordButtonEnabled =
    (isComplexChart && !!currentComplexChartInstance) || (!isComplexChart && !!selectedChartTypeId);
  const hasNoCharts = chartTypes.length === 0;
  const isWaitingForInstances = isInstancesQueryEnabled && isLoadingInstances;

  const baseChartModalProps = {
    open: modalOpen,
    title: chartModalTitle,
    chartSurveyId: chartSurveyIdToSubmit,
    onClose: handleCloseModal,
    onSubmit: handleSubmitChart,
  };

  if (isLoadingChartData || isLoadingChartSurveys || isWaitingForInstances || hasNoCharts) {
    return (
      <TabPane>
        <EmptyChartsTable
          isLoading={isLoadingChartData || isLoadingChartSurveys || isWaitingForInstances}
          noDataMessage={
            <TranslatedText
              stringId="chart.table.noSelectableCharts"
              fallback="There are currently no charts available to record. Please speak to your System Administrator if you think this is incorrect."
              data-testid='translatedtext-h1m2' />
          }
        />
      </TabPane>
    );
  }

  return (
    <TabPane>
      <ChartGraphDataProvider>
        {isComplexChart ? (
          <ComplexChartModal
            {...baseChartModalProps}
            complexChartInstance={currentComplexChartInstance}
            complexChartFormMode={complexChartFormMode}
            fieldVisibility={fieldVisibility}
          />
        ) : (
          <SimpleChartModal {...baseChartModalProps} />
        )}
        <VitalChartsModal />

        <TableButtonRowWrapper>
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
                onTabSelect={tabKey => setCurrentComplexChartTab(tabKey)}
              />
            ) : null}

            <ConditionalTooltip
              visible={!recordButtonEnabled}
              title={
                <TranslatedText
                  stringId="chart.action.record.disabledTooltip"
                  fallback="'Add' an item first to record against"
                  data-testid='translatedtext-b6zs' />
              }
            >
              <StyledButtonWithPermissionCheck
                justifyContent="end"
                onClick={() => {
                  setChartSurveyIdToSubmit(selectedChartTypeId);
                  setModalOpen(true);
                }}
                disabled={!recordButtonEnabled}
                verb="submit"
                noun="SurveyResponse"
              >
                <TranslatedText
                  stringId="chart.action.record"
                  fallback="Record"
                  data-testid='translatedtext-0tuv' />
              </StyledButtonWithPermissionCheck>
            </ConditionalTooltip>
          </TableButtonRow>
        </TableButtonRowWrapper>

        {currentComplexChartInstance ? (
          <CoreComplexChartData
            handleDeleteChart={handleDeleteChart}
            selectedSurveyId={selectedChartTypeId}
            date={currentComplexChartInstance.chartDate}
            type={currentComplexChartInstance.chartType}
            subtype={currentComplexChartInstance.chartSubtype}
            fieldVisibility={fieldVisibility}
          />
        ) : null}

        <ChartsTable
          selectedSurveyId={selectedChartTypeId}
          noDataMessage={getNoDataMessage(
            isComplexChart,
            complexChartInstances,
            selectedChartTypeId,
          )}
        />
      </ChartGraphDataProvider>
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
