import React, { useState, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { TabPane } from '../components';
import { TableButtonRow, ButtonWithPermissionCheck } from '../../../components';
import { useApi } from '../../../api';

import { SelectField } from '../../../components/Field';
import { useChartSurveysQuery } from '../../../api/queries';
import { useUserPreferencesMutation } from '../../../api/mutations/useUserPreferencesMutation';
import { useUserPreferencesQuery } from '../../../api/queries/useUserPreferencesQuery';
import { ChartModal } from '../../../components/ChartModal';
import { ChartsTable } from '../../../components/ChartsTable';
import { getAnswersFromData } from '../../../utils';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const StyledTranslatedSelectField = styled(SelectField)`
  width: 200px;
`;

const ChartDropDown = ({ selectedChartType, setSelectedChartType, chartSurveys }) => {
  const chartTypes = useMemo(
    () =>
      chartSurveys.map(chartSurvey => ({
        label: chartSurvey.name,
        value: chartSurvey.id,
      })),
    [chartSurveys],
  );

  const userPreferencesMutation = useUserPreferencesMutation();

  const handleChange = newValues => {
    const newSelectedChartType = newValues.target.value;

    setSelectedChartType(newSelectedChartType);
    userPreferencesMutation.mutate({
      key: 'selectedChartType',
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
  const [modalOpen, setModalOpen] = useState(false);
  const { data: userPreferences } = useUserPreferencesQuery();
  const [selectedChartType, setSelectedChartType] = useState(
    userPreferences?.selectedChartType || '',
  );
  const [startTime] = useState(getCurrentDateTimeString());
  const api = useApi();

  const { data: chartSurveys = [] } = useChartSurveysQuery();
  const chartTypes = useMemo(
    () =>
      chartSurveys
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(({ name, id }) => ({
          label: name,
          value: id,
        })),
    [chartSurveys],
  );

  const handleClose = () => setModalOpen(false);

  const handleSubmitChart = async ({ survey, ...data }) => {
    await api.post('surveyResponse', {
      surveyId: survey.id,
      startTime,
      patientId: patient.id,
      encounterId: encounter.id,
      endTime: getCurrentDateTimeString(),
      answers: getAnswersFromData(data, survey),
    });
    handleClose();
  };

  const findChartName = useCallback(chartId => chartTypes.find(({ value }) => value === chartId), [
    chartTypes,
  ]);

  return (
    <TabPane>
      <ChartModal
        open={modalOpen}
        chartName={selectedChartType}
        onClose={handleClose}
        surveyId={findChartName(selectedChartType)?.value || chartTypes?.[0]?.value}
        onSubmit={handleSubmitChart}
      />

      <TableButtonRow variant="small" justifyContent="space-between">
        <ChartDropDown
          selectedChartType={selectedChartType}
          setSelectedChartType={setSelectedChartType}
          chartSurveys={chartSurveys}
        />
        <ButtonWithPermissionCheck
          onClick={() => setModalOpen(true)}
          disabled={readonly}
          verb="submit"
          noun="SurveyResponse"
        >
          <TranslatedText stringId="chart.action.record" fallback="Record" />
        </ButtonWithPermissionCheck>
      </TableButtonRow>
      <ChartsTable selectedSurveyId={selectedChartType} />
    </TabPane>
  );
});

ChartsPane.propTypes = {
  patient: PropTypes.object.isRequired,
  encounter: PropTypes.string.isRequired,
};
