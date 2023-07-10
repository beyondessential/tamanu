import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@material-ui/lab';
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

const POSSIBLE_OPTIONS_LIST = [OPTIONS.PANEL, OPTIONS.INDIVIDUAL];

const ItemSkeleton = styled(Skeleton)`
  padding: 16px 14px;
  margin-right: 14px;
  border-radius: 4px;
  border: 1px solid ${Colors.outline};
  width: 247px;
  height: 88px;
`;

const ItemSkeletonWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-top: 3px;
`;

const RadioItemSkeleton = ({ itemsLength }) => (
  <ItemSkeletonWrapper>
    {Array.from({ length: itemsLength }, (_, i) => (
      <ItemSkeleton key={`radio-item-skeleton-${i}`} variant="rect" />
    ))}
  </ItemSkeletonWrapper>
);

const useLabRequestFormTypeOptions = () => {
  const api = useApi();
  const { getLocalisation } = useLocalisation();
  const { onlyAllowLabPanels } = getLocalisation('features') || {};

  const { data, isSuccess, isLoading } = useQuery(['suggestions/labTestPanel/all'], () =>
    api.get(`suggestions/labTestPanel/all`),
  );
  const options = isSuccess
    ? POSSIBLE_OPTIONS_LIST.filter(option => {
        if (option.value === LAB_REQUEST_FORM_TYPES.PANEL) return data?.length > 0;
        if (option.value === LAB_REQUEST_FORM_TYPES.INDIVIDUAL) return !onlyAllowLabPanels;
        return true;
      })
    : [];
  const defaultOption = options?.[0]?.value;

  return { options, isLoading, defaultOption };
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
      <OuterLabelFieldWrapper label="Select your request type" required>
        {isLoading ? (
          <RadioItemSkeleton itemsLength={POSSIBLE_OPTIONS_LIST.length} />
        ) : (
          <Field required name="requestFormType" component={RadioField} options={options} />
        )}
      </OuterLabelFieldWrapper>
    </div>
  );
};
