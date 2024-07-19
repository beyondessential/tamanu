import React, { useState, useMemo } from 'react';
import styled from 'styled-components';

import { TabPane } from '../components';
import { TableButtonRow, ButtonWithPermissionCheck } from '../../../components';

import { SelectField } from '../../../components/Field';
import { useChartSurveys } from '../../../api/queries';
import { useUserPreferencesMutation } from '../../../api/mutations/useUserPreferencesMutation';
import { useUserPreferencesQuery } from '../../../api/queries/useUserPreferencesQuery';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { ChartsTable } from '../../../components/ChartsTable';

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

export const ChartsPane = React.memo(({ patient, encounter, readonly }) => {
  console.log('TODO: submit', patient.id, encounter.id);
  return (
    <TabPane>
      <TableButtonRow variant="small" justifyContent="space-between">
        <ChartDropDown />
        <ButtonWithPermissionCheck
          onClick={() => {}}
          disabled={readonly}
          verb="submit"
          noun="SurveyResponse"
        >
          <TranslatedText stringId="chart.action.record" fallback="Record" />
        </ButtonWithPermissionCheck>
      </TableButtonRow>
      <ChartsTable />
    </TabPane>
  );
});
