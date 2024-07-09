import React, { useState, useMemo } from 'react';
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
      preferenceKey: 'selectedChartType',
      preferenceValue: newSelectedChartType,
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
  return (
    <TabPane>
      <TableButtonRow variant="small" justifyContent="space-between">
        <ChartDropDown />
      </TableButtonRow>
    </TabPane>
  );
});
