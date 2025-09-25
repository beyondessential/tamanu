import React, { useState, useMemo, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { keyBy } from 'lodash';
import { ButtonGroup } from '@material-ui/core';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { subject } from '@casl/ability';

import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { CHARTING_DATA_ELEMENT_IDS, SURVEY_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { getAnswersFromData, ButtonWithPermissionCheck } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';

import { TabPane } from '../components';
import { TableButtonRow } from '../../../components';
import { useChartSurveysQuery } from '../../../api/queries';
import { ChartsTable, EmptyChartsTable } from '../../../components/ChartsTable';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

import { useAuth } from '../../../contexts/Auth';
import { useEncounter } from '../../../contexts/Encounter';
import { useApi } from '../../../api';
import { useChartData } from '../../../contexts/ChartData';
import { ChartGraphDataProvider } from '../../../contexts/VitalChartData';
import { VitalChartsModal } from '../../../components/VitalChartsModal';
import { useEncounterComplexChartInstancesQuery } from '../../../api/queries/useEncounteComplexChartInstancesQuery';
import { TabDisplay } from '../../../components/TabDisplay';
import { ChartDropdown } from '../../../components/Charting/ChartDropdown';
import { CoreComplexChartData } from '../../../components/Charting/CoreComplexChartData';
import { useSurveyQuery } from '../../../api/queries/useSurveyQuery';
import { SimpleChartModal } from '../../../components/SimpleChartModal';
import { ComplexChartModal } from '../../../components/ComplexChartModal';
import { COMPLEX_CHART_FORM_MODES } from '../../../components/Charting/constants';
import { getComplexChartFormMode } from '../../../utils/chart/chartUtils';
import { ConditionalTooltip } from '../../../components/Tooltip';
import { NoteModalActionBlocker } from '../../../components/NoteModalActionBlocker';
import { useTranslation } from '../../../contexts/Translation';

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

const findChartSurvey = (chartSurveys, chartId) => chartSurveys.find(({ id }) => id === chartId);

const getNoDataMessage = (isComplexChart, complexChartInstances, selectedSurveyId) => {
  if (!selectedSurveyId) {
    return (
      <TranslatedText
        stringId="chart.table.simple.noChart"
        fallback="This patient has no recorded charts to display. Select the required chart to document a chart."
        data-testid="translatedtext-h93c"
      />
    );
  }

  if (isComplexChart && !complexChartInstances?.length) {
    return (
      <TranslatedText
        stringId="chart.table.complex.noChart"
        fallback="This patient has no chart information to display. Click '+ Add' to add information to this chart."
        data-testid="translatedtext-1n1o"
      />
    );
  }

  return (
    <TranslatedText
      stringId="chart.table.noData"
      fallback="This patient has no chart information to display. Click ‘Record’ to add information to this chart."
      data-testid="translatedtext-jwyi"
    />
  );
};

const getTooltipMessage = selectedSurveyId => {
  if (!selectedSurveyId) {
    return (
      <TranslatedText
        stringId="chart.action.record.disabledTooltip.noChartType"
        fallback="Please select a chart type to record an entry"
        data-testid="translatedtext-arpn"
      />
    );
  }

  return (
    <TranslatedText
      stringId="chart.action.record.disabledTooltip"
      fallback="'Add' an item first to record against"
      data-testid="translatedtext-zbwx"
    />
  );
};

export const ChartsPane = React.memo(({ patient, encounter }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { facilityId, ability } = useAuth();
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
  const { getTranslation } = useTranslation();

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
      answers: await getAnswersFromData(data, survey),
      facilityId,
    };

    if (chartSurveyToSubmit.surveyType === SURVEY_TYPES.COMPLEX_CHART) {
      responseData.metadata = {
        chartInstanceResponseId: currentComplexChartInstance.chartInstanceId,
      };
    }

    await api.post('surveyResponse', responseData);
    queryClient.invalidateQueries(['encounterCharts', encounter.id, survey.id]);
    if (chartSurveyToSubmit.surveyType === SURVEY_TYPES.COMPLEX_CHART_CORE) {
      reloadChartInstances();
    }
    handleCloseModal();
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

  if (isLoadingChartData || isLoadingChartSurveys || isWaitingForInstances || hasNoCharts) {
    return (
      <TabPane data-testid="tabpane-prxb">
        <EmptyChartsTable
          isLoading={isLoadingChartData || isLoadingChartSurveys || isWaitingForInstances}
          noDataMessage={
            <TranslatedText
              stringId="chart.table.noSelectableCharts"
              fallback="There are currently no charts available to record. Please speak to your System Administrator if you think this is incorrect."
              data-testid="translatedtext-a37q"
            />
          }
          data-testid="emptychartstable-o5hh"
        />
      </TabPane>
    );
  }

  return (
    <TabPane data-testid="tabpane-6sw1">
      <ChartGraphDataProvider data-testid="chartgraphdataprovider-hz37">
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
            data-testid="corecomplexchartdata-tepa"
          />
        ) : null}

        <ChartsTable
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
