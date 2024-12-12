import React from 'react';
import styled from 'styled-components';

import { useUserPreferencesMutation } from '../../api/mutations/useUserPreferencesMutation';
import { SelectField } from '../Field';

const StyledTranslatedSelectField = styled(SelectField)`
  width: 300px;
`;

export const ChartDropdown = ({ selectedChartTypeId, setSelectedChartTypeId, chartTypes }) => {
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
