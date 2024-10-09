import React, { useState, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

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

const ChartDropDown = () => {
  const [selectedChartType, setSelectedChartType] = useState('');

  const { data: chartSurveys = [] } = useChartSurveys();
  const chartTypes = useMemo(
    () =>
      chartSurveys.map(chartSurvey => ({
        label: chartSurvey.name,
        value: chartSurvey.id,
      })),
    [chartSurveys],
  );

  const userPreferencesMutation = useUserPreferencesMutation();
  const { data: userPreferences } = useUserPreferencesQuery();

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
      value={selectedChartType || userPreferences?.selectedChartType}
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
          selectedChart={selectedChartType || userPreferences?.selectedChartType}
          handleSelectChartType={setSelectedChartType}
          chartTypes={chartTypes}
        />
        <ButtonWithPermissionCheck onClick={() => setModalOpen(true)} verb="create" noun="Chart">
          <TranslatedText stringId="chart.action.new" fallback="Record" />
        </ButtonWithPermissionCheck>
      </TableButtonRow>
    </TabPane>
  );
});

ChartsPane.propTypes = {
  patient: PropTypes.object.isRequired,
  encounter: PropTypes.string.isRequired,
};
