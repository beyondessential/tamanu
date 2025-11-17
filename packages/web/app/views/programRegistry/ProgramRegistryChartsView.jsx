import React, { useState, useMemo, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { keyBy } from 'lodash';
import { ButtonGroup } from '@material-ui/core';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { subject } from '@casl/ability';

import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import {
  CHARTING_DATA_ELEMENT_IDS,
  SURVEY_TYPES,
  USER_PREFERENCES_KEYS,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { getAnswersFromData } from '@tamanu/ui-components';

import { TableButtonRow, ButtonWithPermissionCheck } from '../../components';
import { useProgramRegistryLinkedChartsQuery } from '../../api/queries/useProgramRegistryLinkedChartsQuery';
import {
  ProgramRegistryChartsTable,
  EmptyProgramRegistryChartsTable,
} from '../../components/ProgramRegistryChartsTable';
import { TranslatedText } from '../../components/Translation/TranslatedText';

import { useAuth } from '../../contexts/Auth';
import { useApi } from '../../api';
import { ProgramRegistryChartGraphDataProvider } from '../../contexts/VitalChartData';
import { VitalChartsModal } from '../../components/VitalChartsModal';
import { useProgramRegistryPatientComplexChartInstancesQuery } from '../../api/queries/useProgramRegistryPatientComplexChartInstancesQuery';
import { useProgramRegistryPatientChartsQuery } from '../../api/queries/useProgramRegistryPatientChartsQuery';
import { TabDisplay } from '../../components/TabDisplay';
import { Colors } from '../../constants';
import { ChartDropdown } from '../../components/Charting/ChartDropdown';
import { CoreComplexChartData } from '../../components/Charting/CoreComplexChartData';
import { useSurveyQuery } from '../../api/queries/useSurveyQuery';
import { useUserPreferencesQuery } from '../../api/queries/useUserPreferencesQuery';
import { SimpleChartModal } from '../../components/SimpleChartModal';
import { ComplexChartModal } from '../../components/ComplexChartModal';
import { COMPLEX_CHART_FORM_MODES } from '../../components/Charting/constants';
import {
  getComplexChartFormMode,
  findChartSurvey,
  getNoDataMessage,
  getTooltipMessage,
  getNoSelectableChartsMessage,
} from '../../utils/chart/chartUtils';
import { ConditionalTooltip } from '../../components/Tooltip';
import { NoteModalActionBlocker } from '../../components/NoteModalActionBlocker';
import { useTranslation } from '../../contexts/Translation';

const StyledButtonGroup = styled(ButtonGroup)`
  .MuiButtonGroup-groupedOutlinedHorizontal:not(:first-child) {
    margin-top: 10px;
    margin-left: 10px;
  }
`;

const TableButtonRowWrapper = styled.div`
  margin-bottom: 15px;
  border-bottom: 1px solid ${Colors.outline};
  overflow-x: auto;
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
  flex: 1;
  min-width: 200px;
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

const ChartsContainer = styled.div`
  margin-top: 20px;
`;

const ChartsPanel = styled.div`
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  padding: 20px 25px;
`;

// helpers moved to chartUtils

export const ProgramRegistryChartsView = React.memo(({ programRegistryId, patient }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { facilityId, ability } = useAuth();
  const [selectedChartTypeId, setSelectedChartTypeId] = useState('');
  const {
    data: { chartSurveys = [], complexToCoreSurveysMap = {} } = {},
    isLoading: isLoadingChartSurveys,
  } = useProgramRegistryLinkedChartsQuery(programRegistryId);
  const { data: userPreferences } = useUserPreferencesQuery();
  const { getTranslation } = useTranslation();

  const programRegistryChartPreferenceKey = useMemo(
    () => `${USER_PREFERENCES_KEYS.SELECTED_CHART_TYPE_ID}:${programRegistryId}`,
    [programRegistryId],
  );

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

  // Initialise the selected chart using the user's last preference where possible
  useEffect(() => {
    if (!chartSurveys.length || selectedChartTypeId) return;

    const preferredChartTypeId = userPreferences?.[programRegistryChartPreferenceKey];
    const preferredChartIsSelectable = chartSurveys.some(
      survey => survey.id === preferredChartTypeId,
    );

    if (preferredChartTypeId && preferredChartIsSelectable) {
      setSelectedChartTypeId(preferredChartTypeId);
      return;
    }

    const firstSelectableChart = chartSurveys.find(s =>
      [SURVEY_TYPES.SIMPLE_CHART, SURVEY_TYPES.COMPLEX_CHART].includes(s.surveyType),
    );

    if (firstSelectableChart) {
      setSelectedChartTypeId(firstSelectableChart.id);
    }
  }, [chartSurveys, selectedChartTypeId, userPreferences, programRegistryChartPreferenceKey]);

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

  const { data: coreComplexChartSurvey } = useSurveyQuery(coreComplexChartSurveyId);

  const fieldVisibility = useMemo(
    () =>
      Object.fromEntries(
        coreComplexChartSurvey?.components.map(c => [c.dataElementId, c.visibilityStatus]) || [],
      ),
    [coreComplexChartSurvey?.components],
  );

  const coreComplexDataElements = useMemo(() => {
    if (!coreComplexChartSurvey?.components) {
      return {};
    }
    const componentsByDataElementId = keyBy(coreComplexChartSurvey.components, 'dataElementId');
    const findDataElement = id => componentsByDataElementId[id]?.dataElement;

    return {
      instanceNameDataElement: findDataElement(CHARTING_DATA_ELEMENT_IDS.complexChartInstanceName),
      dateDataElement: findDataElement(CHARTING_DATA_ELEMENT_IDS.complexChartDate),
      typeDataElement: findDataElement(CHARTING_DATA_ELEMENT_IDS.complexChartType),
      subtypeDataElement: findDataElement(CHARTING_DATA_ELEMENT_IDS.complexChartSubtype),
    };
  }, [coreComplexChartSurvey]);

  const isInstancesQueryEnabled = !!coreComplexChartSurveyId && !!patient?.id;
  const {
    data: { data: complexChartInstances = [] } = {},
    isLoading: isLoadingInstances,
  } = useProgramRegistryPatientComplexChartInstancesQuery({
    patientId: patient?.id,
    chartSurveyId: coreComplexChartSurveyId,
    enabled: isInstancesQueryEnabled,
  });

  // Create tabs for each chart instance
  const complexChartInstanceTabs = useMemo(
    () =>
      complexChartInstances.map(({ chartInstanceId, chartInstanceName }) => ({
        label: chartInstanceName,
        key: chartInstanceId,
        render: () => null,
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

  // Determine if the current complex chart instance can be deleted (no answers across encounters)
  const {
    data: prChartRecords = [],
    isLoading: isPrChartLoading,
  } = useProgramRegistryPatientChartsQuery(
    patient?.id,
    selectedChartTypeId,
    currentComplexChartInstance?.chartInstanceId,
  );
  const canDeleteInstance = !isPrChartLoading && prChartRecords.length === 0;

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
        'programRegistryPatientComplexChartInstances',
        patient?.id,
        coreComplexChartSurveyId,
      ]),
    [queryClient, patient?.id, coreComplexChartSurveyId],
  );

  const handleSubmitChart = async ({ survey, ...data }) => {
    const submittedTime = getCurrentDateTimeString();
    const responseData = {
      surveyId: survey.id,
      startTime: submittedTime,
      patientId: patient.id,
      endTime: submittedTime,
      answers: await getAnswersFromData(data, survey),
      facilityId,
    };

    if (chartSurveyToSubmit.surveyType === SURVEY_TYPES.COMPLEX_CHART) {
      responseData.metadata = {
        chartInstanceResponseId: currentComplexChartInstance.chartInstanceId,
      };
    }

    await api.post('surveyResponse', responseData);

    // Invalidate queries for the currently displayed chart to refresh the table
    if (selectedChartTypeId) {
      queryClient.invalidateQueries([
        'programRegistryPatientCharts',
        patient.id,
        selectedChartTypeId,
        currentComplexChartInstance?.chartInstanceId,
      ]);
    }

    if (chartSurveyToSubmit.surveyType === SURVEY_TYPES.COMPLEX_CHART_CORE) {
      reloadChartInstances();
    }
    handleCloseModal();
  };

  const handleDeleteChart = useCallback(async () => {
    try {
      await api.delete(
        `programRegistry/patient/${patient.id}/chartInstances/${currentComplexChartInstance?.chartInstanceId}`,
      );

      // Invalidate queries for the currently displayed chart to refresh the table
      if (selectedChartTypeId) {
        queryClient.invalidateQueries([
          'programRegistryPatientCharts',
          patient.id,
          selectedChartTypeId,
          currentComplexChartInstance?.chartInstanceId,
        ]);
      }

      handleCloseModal();
      setCurrentComplexChartTab(null);

      reloadChartInstances();
    } catch (e) {
      toast.error(`Failed to remove chart with error: ${e.message}`);
    }
  }, [
    api,
    patient.id,
    selectedChartTypeId,
    currentComplexChartInstance?.chartInstanceId,
    reloadChartInstances,
    queryClient,
  ]);

  const isComplexChart = selectedChartSurvey?.surveyType === SURVEY_TYPES.COMPLEX_CHART;
  const complexChartFormMode = getComplexChartFormMode(chartSurveyToSubmit);
  const selectedChartSurveyName = selectedChartSurvey?.name;
  const actionText =
    complexChartFormMode === COMPLEX_CHART_FORM_MODES.ADD_CHART_INSTANCE
      ? getTranslation('general.action.add', 'Add')
      : getTranslation('general.action.record', 'Record');
  const chartModalTitle = `${selectedChartSurveyName} | ${actionText}`;
  const isCurrentChart = selectedChartSurvey?.visibilityStatus === VISIBILITY_STATUSES.CURRENT;
  const recordButtonEnabled =
    isCurrentChart &&
    ((isComplexChart && !!currentComplexChartInstance) ||
      (!isComplexChart && !!selectedChartTypeId));
  const hasNoCharts = chartTypes.length === 0;
  const isWaitingForInstances = isInstancesQueryEnabled && isLoadingInstances;
  const canCreateCoreComplexInstance = ability.can(
    'create',
    subject('Charting', { id: coreComplexChartSurveyId }),
  );

  const baseChartModalProps = {
    open: modalOpen,
    title: chartModalTitle,
    chartSurveyId: chartSurveyIdToSubmit,
    onClose: handleCloseModal,
    onSubmit: handleSubmitChart,
    patient,
  };

  if (isLoadingChartSurveys || isWaitingForInstances || hasNoCharts) {
    return (
      <ChartsContainer data-testid="charts-container">
        <ChartsPanel>
          <EmptyProgramRegistryChartsTable
            isLoading={isLoadingChartSurveys || isWaitingForInstances}
            noDataMessage={getNoSelectableChartsMessage()}
            data-testid="emptychartstable-o5hh"
          />
        </ChartsPanel>
      </ChartsContainer>
    );
  }

  return (
    <ChartsContainer data-testid="charts-container">
      <ChartsPanel>
        <ProgramRegistryChartGraphDataProvider
          patientId={patient?.id}
          selectedChartTypeId={selectedChartTypeId}
          data-testid="chartgraphdataprovider-hz37"
        >
          {isComplexChart ? (
            <ComplexChartModal
              {...baseChartModalProps}
              selectedChartSurveyName={selectedChartSurveyName}
              complexChartInstance={currentComplexChartInstance}
              complexChartFormMode={complexChartFormMode}
              fieldVisibility={fieldVisibility}
              coreComplexDataElements={coreComplexDataElements}
              data-testid="complexchartmodal-aldg"
            />
          ) : (
            <SimpleChartModal {...baseChartModalProps} data-testid="simplechartmodal-glr8" />
          )}
          <VitalChartsModal data-testid="vitalchartsmodal-7lld" />

          <TableButtonRowWrapper data-testid="tablebuttonrowwrapper-srjx">
            <TableButtonRow
              variant="small"
              justifyContent="space-between"
              data-testid="tablebuttonrow-lwlu"
            >
              <StyledButtonGroup data-testid="styledbuttongroup-z992">
                <ChartDropdown
                  selectedChartTypeId={selectedChartTypeId}
                  setSelectedChartTypeId={setSelectedChartTypeId}
                  chartTypes={chartTypes}
                  preferenceKey={programRegistryChartPreferenceKey}
                  data-testid="chartdropdown-eox5"
                />
                {isComplexChart && canCreateCoreComplexInstance && isCurrentChart ? (
                  <AddComplexChartButton
                    onClick={() => {
                      setChartSurveyIdToSubmit(coreComplexChartSurveyId);
                      setModalOpen(true);
                    }}
                    data-testid="addcomplexchartbutton-w4wk"
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
                  data-testid="complexchartinstancestab-vrf2"
                />
              ) : null}

              <ConditionalTooltip
                visible={!recordButtonEnabled}
                maxWidth="8rem"
                title={getTooltipMessage(selectedChartTypeId)}
                data-testid="conditionaltooltip-uafz"
              >
                <NoteModalActionBlocker>
                  <StyledButtonWithPermissionCheck
                    justifyContent="end"
                    onClick={() => {
                      setChartSurveyIdToSubmit(selectedChartTypeId);
                      setModalOpen(true);
                    }}
                    disabled={!recordButtonEnabled}
                    verb="create"
                    subject={subject('Charting', { id: selectedChartTypeId })}
                    data-testid="styledbuttonwithpermissioncheck-ruv4"
                  >
                    <TranslatedText
                      stringId="chart.action.record"
                      fallback="Record"
                      data-testid="translatedtext-r7vz"
                    />
                  </StyledButtonWithPermissionCheck>
                </NoteModalActionBlocker>
              </ConditionalTooltip>
            </TableButtonRow>
          </TableButtonRowWrapper>

          {currentComplexChartInstance ? (
            <CoreComplexChartData
              coreComplexChartSurveyId={coreComplexChartSurveyId}
              handleDeleteChart={handleDeleteChart}
              selectedSurveyId={selectedChartTypeId}
              currentInstanceId={currentComplexChartInstance?.chartInstanceId}
              date={currentComplexChartInstance.chartDate}
              type={currentComplexChartInstance.chartType}
              subtype={currentComplexChartInstance.chartSubtype}
              coreComplexDataElements={coreComplexDataElements}
              fieldVisibility={fieldVisibility}
              canDeleteInstance={canDeleteInstance}
              data-testid="corecomplexchartdata-tepa"
            />
          ) : null}

          <ProgramRegistryChartsTable
            patientId={patient?.id}
            selectedSurveyId={selectedChartTypeId}
            selectedChartSurveyName={selectedChartSurveyName}
            currentInstanceId={currentComplexChartInstance?.chartInstanceId}
            noDataMessage={getNoDataMessage(
              isComplexChart,
              complexChartInstances,
              selectedChartTypeId,
            )}
            data-testid="chartstable-vxv2"
          />
        </ProgramRegistryChartGraphDataProvider>
      </ChartsPanel>
    </ChartsContainer>
  );
});

ProgramRegistryChartsView.propTypes = {
  programRegistryId: PropTypes.string.isRequired,
  patient: PropTypes.object.isRequired,
};
