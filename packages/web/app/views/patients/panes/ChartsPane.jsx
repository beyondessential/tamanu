import React, { useState, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import { TabPane } from '../components';
import { TableButtonRow, ButtonWithPermissionCheck } from '../../../components';
import { SelectField } from '../../../components/Field';
import { useChartSurveysQuery } from '../../../api/queries';
import { useUserPreferencesMutation } from '../../../api/mutations/useUserPreferencesMutation';
import { ChartModal } from '../../../components/ChartModal';
import { ChartsTable } from '../../../components/ChartsTable';
import { getAnswersFromData } from '../../../utils';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

import { useAuth } from '../../../contexts/Auth';
import { useEncounter } from '../../../contexts/Encounter';
import { useApi } from '../../../api';
import { useChartData } from '../../../contexts/ChartData';

const StyledTranslatedSelectField = styled(SelectField)`
  width: 200px;
`;

const ChartDropDown = ({ selectedChartTypeId, setSelectedChartTypeId, chartTypes }) => {
  const userPreferencesMutation = useUserPreferencesMutation();

  const handleChange = newValues => {
    const newSelectedChartType = newValues.target.value;

    setSelectedChartTypeId(newSelectedChartType);
    userPreferencesMutation.mutate({
      key: 'selectedChartTypeId',
      value: newSelectedChartType,
    });
  };

  return (
    <StyledTranslatedSelectField
      options={chartTypes}
      onChange={handleChange}
      value={selectedChartTypeId}
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
  const [modalOpen, setModalOpen] = useState(false);
  const { selectedChartTypeId, setSelectedChartTypeId } = useChartData();
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
    const submittedTime = getCurrentDateTimeString();
    await api.post('surveyResponse', {
      surveyId: survey.id,
      startTime: submittedTime,
      patientId: patient.id,
      encounterId: encounter.id,
      endTime: submittedTime,
      answers: getAnswersFromData(data, survey),
      facilityId,
    });
    handleClose();
    await loadEncounter(encounter.id);
  };

  const findChartName = useCallback(
    chartId => chartTypes.find(({ value }) => value === chartId)?.label,
    [chartTypes],
  );

  return (
    <TabPane>
      <ChartModal
        open={modalOpen}
        chartName={findChartName(selectedChartTypeId)}
        onClose={handleClose}
        chartSurveyId={selectedChartTypeId}
        onSubmit={handleSubmitChart}
      />

      <TableButtonRow variant="small" justifyContent="space-between">
        <ChartDropDown
          selectedChartTypeId={selectedChartTypeId}
          setSelectedChartTypeId={setSelectedChartTypeId}
          chartTypes={chartTypes}
        />
        {selectedChartTypeId ? (
          <ButtonWithPermissionCheck
            onClick={() => setModalOpen(true)}
            disabled={readonly}
            verb="submit"
            noun="SurveyResponse"
          >
            <TranslatedText stringId="chart.action.record" fallback="Record" />
          </ButtonWithPermissionCheck>
        ) : null}
      </TableButtonRow>
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
