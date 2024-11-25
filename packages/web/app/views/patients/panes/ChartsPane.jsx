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
import { useEncounterChartInstancesQuery } from '../../../api/queries/useEncounterChartInstancesQuery';
import { TabDisplay } from '../../../components/TabDisplay';
import { Colors } from '../../../constants';

const StyledTranslatedSelectField = styled(SelectField)`
  width: 200px;
`;

const StyledAddComplexChartButton = styled.span`
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

const StyledDisplayTabs = styled(TabDisplay)`
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

const ChartDropDown = ({ selectedChartType, setSelectedChartType, chartTypes }) => {
  const userPreferencesMutation = useUserPreferencesMutation();

  const handleChange = newValues => {
    const newSelectedChartType = newValues.target.value;

    setSelectedChartType(newSelectedChartType);
    userPreferencesMutation.mutate({
      key: 'selectedChartTypeId',
      value: newSelectedChartType,
    });
  };

  return (
    <StyledTranslatedSelectField
      options={chartTypes}
      onChange={handleChange}
      value={selectedChartType}
      name="chartType"
      prefix="chart.property.type"
      isClearable={false}
    />
  );
};

export const ChartsPane = React.memo(({ patient, encounter, readonly }) => {
  const api = useApi();
  const { facilityId } = useAuth();
  const { loadEncounter } = useEncounter();
  const { data: userPreferences } = useUserPreferencesQuery();
  const { data: chartSurveys = [] } = useChartSurveysQuery();

  const [modalOpen, setModalOpen] = useState(false);
  const [currentTab, setCurrenTab] = useState('');
  const [selectedChartType, setSelectedChartType] = useState(userPreferences?.selectedChartTypeId);
  const [chartSurveyId, setChartSurveyId] = useState();

  const chartTypes = useMemo(
    () =>
      chartSurveys
        .filter(s =>
          [SURVEY_TYPES.SIMPLE_CHART, SURVEY_TYPES.COMPLEX_CHART_CORE].includes(s.surveyType),
        )
        .map(({ name, id }) => ({
          label: name,
          value: id,
        })),
    [chartSurveys],
  );

  const findChartSurvey = chartId => chartSurveys.find(({ id }) => id === chartId);

  // Find the complex chart survey that corresponds to the core chart survey
  const findComplexChartSurveyFromCore = coreChartSurveyId => {
    const coreChartSurvey = findChartSurvey(coreChartSurveyId);
    return chartSurveys.find(
      s => s.programId === coreChartSurvey.programId && s.surveyType === SURVEY_TYPES.COMPLEX_CHART,
    )?.id;
  };

  const { data: { data: chartInstances = [] } = {} } = useEncounterChartInstancesQuery(
    encounter.id,
    findChartSurvey(selectedChartType),
  );

  // Create tabs for each chart instance
  const chartInstanceTabs = useMemo(
    () =>
      chartInstances.map(({ chartInstanceId, chartInstanceName }) => ({
        label: chartInstanceName,
        key: chartInstanceId,
        render: () => true, //TODO: render responses
      })),
    [chartInstances],
  );

  // Set default current tab if not set
  useEffect(() => {
    if (!currentTab && chartInstanceTabs?.length) {
      setCurrenTab(chartInstanceTabs[0].key);
    }
  }, [chartInstanceTabs]);

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
        chartInstanceResponseId: chartSurveyId,
      },
    });
    handleClose();
    await loadEncounter(encounter.id);
  };

  const isComplexChart =
    findChartSurvey(selectedChartType)?.surveyType === SURVEY_TYPES.COMPLEX_CHART_CORE;

  return (
    <TabPane>
      <ChartModal
        open={modalOpen}
        chartName={findChartSurvey(selectedChartType)?.name}
        onClose={handleClose}
        chartSurveyId={chartSurveyId}
        onSubmit={handleSubmitChart}
      />

      <TableButtonRow variant="small" justifyContent={isComplexChart ? 'start' : 'space-between'}>
        <ChartDropDown
          selectedChartType={selectedChartType}
          setSelectedChartType={setSelectedChartType}
          chartTypes={chartTypes}
        />
        {isComplexChart ? (
          <StyledAddComplexChartButton
            onClick={() => {
              setModalOpen(true);
              setChartSurveyId(selectedChartType);
            }}
          >
            + Add
          </StyledAddComplexChartButton>
        ) : null}

        {chartInstanceTabs.length && currentTab ? (
          <StyledDisplayTabs
            tabs={chartInstanceTabs || []}
            currentTab={currentTab}
            onTabSelect={tabKey => setCurrenTab(tabKey)}
          />
        ) : null}

        {selectedChartType ? (
          <StyledButtonWithPermissionCheck
            justifyContent="end"
            onClick={() => {
              if (isComplexChart) {
                const complexChartSurveyId = findComplexChartSurveyFromCore(selectedChartType);
                setChartSurveyId(complexChartSurveyId);
              } else {
                setChartSurveyId(selectedChartType);
              }

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
      <ChartsTable selectedSurveyId={selectedChartType} />
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
