import React from 'react';
import styled from 'styled-components';

import { TabPane } from '../components';
import { TableButtonRow } from '../../../components';

import { SelectField } from '../../../components/Field';
import { useChartSurveys } from '../../../api/queries';
import { useUserPreferencesMutation } from '../../../api/mutations/useUserPreferencesMutation';
import { useUserPreferencesQuery } from '../../../api/queries/useUserPreferencesQuery';

const StyledTranslatedSelectField = styled(SelectField)`
  width: 200px;
`;

const ChartDropDown = () => {
  const { data: chartSurveys } = useChartSurveys();
  const chartTypes = chartSurveys
    .sort((a, b) => (a.name < b.name ? -1 : 1))
    .map(chartSurvey => ({
      label: chartSurvey.name,
      value: chartSurvey.id,
    }));

  const userPreferencesMutation = useUserPreferencesMutation();
  const userPreferencesQuery = useUserPreferencesQuery();

  const handleChange = newValues => {
    const newSelectedChartType = newValues.target.value;

    userPreferencesMutation.mutate({
      preferenceKey: 'selectedChartType',
      preferenceValue: newSelectedChartType,
    });
  };

  return (
    <StyledTranslatedSelectField
      options={chartTypes}
      onChange={handleChange}
      value={userPreferencesQuery.selectedChartType}
      name="noteType"
      prefix="note.property.type"
      isClearable={false}
    />
  );
};

export const ChartsPane = React.memo(({ patient, encounter }) => {
  return (
    <TabPane>
      <TableButtonRow variant="small" justifyContent="space-between">
        <ChartDropDown />
      </TableButtonRow>
    </TabPane>
  );
});
