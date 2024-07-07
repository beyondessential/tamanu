import React, { useState, useMemo } from 'react';
import styled from 'styled-components';

import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { TabPane } from '../components';
import { TableButtonRow, ButtonWithPermissionCheck } from '../../../components';
import { useApi } from '../../../api';

import { SelectField } from '../../../components/Field';
import { useChartSurveys } from '../../../api/queries';
import { useUserPreferencesMutation } from '../../../api/mutations/useUserPreferencesMutation';
import { useUserPreferencesQuery } from '../../../api/queries/useUserPreferencesQuery';
import { ChartModal } from '../../../components/ChartModal';
import { getAnswersFromData } from '../../../utils';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const StyledTranslatedSelectField = styled(SelectField)`
  width: 200px;
`;

const ChartDropDown = ({ value, handleSelectChartType, chartTypes }) => {
  const userPreferencesMutation = useUserPreferencesMutation();

  const handleChange = newValues => {
    const newSelectedChartType = newValues.target.value;

    handleSelectChartType(newSelectedChartType);
    userPreferencesMutation.mutate({
      preferenceKey: 'selectedChartType',
      preferenceValue: newSelectedChartType,
    });
  };

  return (
    <StyledTranslatedSelectField
      options={chartTypes}
      onChange={handleChange}
      value={value}
      name="chartType"
      prefix="chart.property.type"
      isClearable={false}
    />
  );
};

export const ChartsPane = React.memo(({ patient, encounter }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState('');
  const { data: userPreferences } = useUserPreferencesQuery();
  const [startTime] = useState(getCurrentDateTimeString());
  const api = useApi();

  const { data: chartSurveys = [] } = useChartSurveys();
  const chartTypes = useMemo(
    () =>
      chartSurveys
        .sort((a, b) => (a.name < b.name ? -1 : 1))
        .map(chartSurvey => ({
          label: chartSurvey.name,
          value: chartSurvey.id,
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

  console.log('selectedChartType', selectedChartType);
  return (
    <TabPane>
      <ChartModal
        open={modalOpen}
        chartName={selectedChartType}
        onCancel={() => setModalOpen(false)}
        surveyId={selectedChartType || chartTypes?.[0]?.value}
        onSubmit={handleSubmitChart}
      />

      <TableButtonRow variant="small" justifyContent="space-between">
        <ChartDropDown
          value={selectedChartType || userPreferences?.selectedChartType}
          handleSelectChartType={setSelectedChartType}
          chartTypes={chartTypes}
        />
        <ButtonWithPermissionCheck
          onClick={() => setModalOpen(true)}
          verb="create"
          noun="EncounterNote"
        >
          <TranslatedText stringId="note.action.new" fallback="Record" />
        </ButtonWithPermissionCheck>
      </TableButtonRow>
    </TabPane>
  );
});
