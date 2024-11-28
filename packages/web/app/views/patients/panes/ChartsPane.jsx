import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { SURVEY_TYPES } from '@tamanu/constants';

import { TabPane } from '../components';
import { TableButtonRow, ButtonWithPermissionCheck } from '../../../components';
import { SelectField } from '../../../components/Field';
import { useChartSurveysQuery } from '../../../api/queries';
import { useUserPreferencesMutation } from '../../../api/mutations/useUserPreferencesMutation';
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

const StyledTranslatedSelectField = styled(SelectField)`
  width: 200px;
`;

const CoreComplexChartDataRow = styled.div`
  margin-top: 20px;
  margin-bottom: 20px;
`;

const CoreComplexChartInfoHeader = styled.span`
  font-weight: 500;
  margin-right: 5px;
`;

const CoreComplexChartInfoWrapper = styled.span`
  margin-right: 20px;
  color: ${Colors.darkText};
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

const ChartDropDown = ({ selectedChartSurveyId, setSelectedChartSurveyId, chartTypes }) => {
  const userPreferencesMutation = useUserPreferencesMutation();

  const handleChange = newValues => {
    const newSelectedChartType = newValues.target.value;

    setSelectedChartSurveyId(newSelectedChartType);
    userPreferencesMutation.mutate({
      key: 'selectedChartTypeId',
      value: newSelectedChartType,
    });
  };

  return (
    <StyledTranslatedSelectField
      options={chartTypes}
      onChange={handleChange}
      value={selectedChartSurveyId}
      name="chartType"
      prefix="chart.property.type"
      isClearable={false}
    />
  );
};

const findChartSurvey = (chartSurveys, chartId) => chartSurveys.find(({ id }) => id === chartId);

const CoreComplexChartData = ({ date, type, subType }) => (
  <CoreComplexChartDataRow>
    <CoreComplexChartInfoWrapper>
      <CoreComplexChartInfoHeader>
        <TranslatedText stringId="complexChartInstance.date" fallback="Date & time of onset:" />
      </CoreComplexChartInfoHeader>
      <>{date}</>
    </CoreComplexChartInfoWrapper>

    <CoreComplexChartInfoWrapper>
      <CoreComplexChartInfoHeader>
        <TranslatedText stringId="complexChartInstance.type" fallback="Type:" />
      </CoreComplexChartInfoHeader>

      <>{type || '-'}</>
    </CoreComplexChartInfoWrapper>

    <CoreComplexChartInfoWrapper>
      <CoreComplexChartInfoHeader>
        <TranslatedText stringId="complexChartInstance.subType" fallback="Sub type:" />
      </CoreComplexChartInfoHeader>
      <>{subType || '-'}</>
    </CoreComplexChartInfoWrapper>
  </CoreComplexChartDataRow>
);

export const ChartsPane = React.memo(({ patient, encounter, readonly }) => {
  const api = useApi();
  const { facilityId } = useAuth();
  const { loadEncounter } = useEncounter();
  const { data: userPreferences } = useUserPreferencesQuery();
  const { data: { chartSurveys = [], complexToCoreSurveysMap = {} } = {} } = useChartSurveysQuery();

  const [modalOpen, setModalOpen] = useState(false);
  const [currentComplexChartTab, setCurrenComplexChartTab] = useState('');

  // State for selected chart survey in the drop down
  const [selectedChartSurveyId, setSelectedChartSurveyId] = useState(
    userPreferences?.selectedChartTypeId,
  );
  // State for the chart survey to record responses in the modal
  const [recordChartSurveyId, setRecordChartSurveyId] = useState();

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

  const currentChartSurvey = useMemo(() => findChartSurvey(chartSurveys, selectedChartSurveyId), [
    chartSurveys,
    selectedChartSurveyId,
  ]);

  const coreComplexChartSurveyId = useMemo(() => complexToCoreSurveysMap[selectedChartSurveyId], [
    complexToCoreSurveysMap,
    selectedChartSurveyId,
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
  }, [complexChartInstanceTabs]);

  const handleClose = () => setModalOpen(false);

  const handleSubmitChart = async ({ survey, ...data }) => {
    const submittedTime = getCurrentDateTimeString();
    await api.post('surveyResponse', {
      surveyId: survey.id,
      startTime: submittedTime,
      patientId: patient.id,
      encounterId: encounter.id,
      endTime: submittedTime,
      answers: getAnswersFromData(data, survey),
      facilityId,
      metadata: {
        chartInstanceResponseId: recordChartSurveyId,
      },
    });
    handleClose();
    await loadEncounter(encounter.id);
  };

  const isComplexChart = currentChartSurvey?.surveyType === SURVEY_TYPES.COMPLEX_CHART;

  return (
    <TabPane>
      <ChartModal
        open={modalOpen}
        chartName={currentChartSurvey?.name}
        onClose={handleClose}
        chartSurveyId={recordChartSurveyId}
        onSubmit={handleSubmitChart}
      />

      <TableButtonRow variant="small" justifyContent={isComplexChart ? 'start' : 'space-between'}>
        <ChartDropDown
          selectedChartSurveyId={selectedChartSurveyId}
          setSelectedChartSurveyId={setSelectedChartSurveyId}
          chartTypes={chartTypes}
        />
        {isComplexChart ? (
          <AddComplexChartButton
            onClick={() => {
              setRecordChartSurveyId(coreComplexChartSurveyId);
              setModalOpen(true);
            }}
          >
            + Add
          </AddComplexChartButton>
        ) : null}

        {complexChartInstanceTabs.length && currentComplexChartTab ? (
          <ComplexChartInstancesTab
            tabs={complexChartInstanceTabs}
            currentTab={currentComplexChartTab}
            onTabSelect={tabKey => setCurrenComplexChartTab(tabKey)}
          />
        ) : null}

        {selectedChartSurveyId ? (
          <StyledButtonWithPermissionCheck
            justifyContent="end"
            onClick={() => {
              setRecordChartSurveyId(selectedChartSurveyId);
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
          date={currentComplexChartInstance.chartDate}
          type={currentComplexChartInstance.chartType}
          subType={currentComplexChartInstance.chartSubType}
        />
      ) : null}

      <ChartsTable selectedSurveyId={selectedChartSurveyId} />
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
