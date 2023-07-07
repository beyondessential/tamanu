import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@material-ui/lab';
import { Box } from '@material-ui/core';
import styled from 'styled-components';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/shared/constants/labs';
import { Field, OuterLabelFieldWrapper, RadioField } from '../../components';
import { useApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';
import { Colors } from '../../constants';

const OPTIONS = {
  INDIVIDUAL: {
    label: 'Individual',
    description: 'Select an individual or multiple individual tests',
    value: LAB_REQUEST_FORM_TYPES.INDIVIDUAL,
  },
  PANEL: {
    label: 'Panel',
    description: 'Select from a list of test panels',
    value: LAB_REQUEST_FORM_TYPES.PANEL,
  },
  SUPERSET: {
    label: 'Superset',
    description: 'Select from a list of supersets',
    value: LAB_REQUEST_FORM_TYPES.SUPERSET,
  },
};

const RadioItemSkeleton = styled(Skeleton)`
  padding: 16px 14px;
  margin-right: 14px;
  border-radius: 4px;
  border: 1px solid ${Colors.outline};
  width: 247px;
  height: 88px;
`;

const useLabRequestFormTypeOptions = () => {
  const api = useApi();
  const { getLocalisation } = useLocalisation();
  const { onlyAllowLabPanels } = getLocalisation('features') || {};

  const { data, isSuccess, isLoading } = useQuery(['suggestions/labTestPanel/all'], () =>
    api.get(`suggestions/labTestPanel/all`),
  );
  const arePanels = isSuccess && data?.length > 0;
  const options = [];
  if (arePanels) {
    options.push(OPTIONS.PANEL);
  }
  if (!onlyAllowLabPanels) {
    options.push(OPTIONS.INDIVIDUAL);
  }

  const defaultOption = isSuccess && options.length > 0 ? options[0].value : undefined;
  return { options, defaultOption, isLoading };
};

export const LabRequestFormTypeRadioField = ({ value, setFieldValue }) => {
  const { options, defaultOption, isLoading } = useLabRequestFormTypeOptions();

  useEffect(() => {
    if (!defaultOption || value) return;
    // Initialize the form type to the first available option
    setFieldValue('requestFormType', defaultOption);
  }, [defaultOption, setFieldValue, value]);

  return (
    <div style={{ gridColumn: '1 / -1' }}>
      {isLoading ? (
        <OuterLabelFieldWrapper label="Select your request type" required>
          <Box display="flex" alignItems="center" marginTop="3px">
            <RadioItemSkeleton variant="rect" />
            <RadioItemSkeleton variant="rect" />
          </Box>
        </OuterLabelFieldWrapper>
      ) : (
        <Field
          required
          name="requestFormType"
          isLoading={isLoading}
          label="Select your request type"
          component={RadioField}
          options={options}
        />
      )}
    </div>
  );
};
