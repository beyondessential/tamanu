import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@material-ui/lab';
import styled from 'styled-components';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/constants/labs';
import { TAMANU_COLORS, TranslatedText } from '@tamanu/ui-components';
import { Field, OuterLabelFieldWrapper, RadioField } from '../../components';
import { useApi } from '../../api';
import { useSettings } from '../../contexts/Settings';

const OPTIONS = {
  INDIVIDUAL: {
    label: (
      <TranslatedText
        stringId="lab.formType.option.individual.label"
        fallback="Individual"
        data-testid="translatedtext-3e3z"
      />
    ),
    description: (
      <TranslatedText
        stringId="lab.formType.option.individual.description"
        fallback="Select an individual or multiple individual tests"
        data-testid="translatedtext-gu5p"
      />
    ),
    value: LAB_REQUEST_FORM_TYPES.INDIVIDUAL,
  },
  PANEL: {
    label: (
      <TranslatedText
        stringId="lab.formType.option.panel.label"
        fallback="Panel"
        data-testid="translatedtext-blis"
      />
    ),
    description: (
      <TranslatedText
        stringId="lab.formType.option.panel.description"
        fallback="Select from a list of test panels"
        data-testid="translatedtext-co2x"
      />
    ),
    value: LAB_REQUEST_FORM_TYPES.PANEL,
  },
  SUPERSET: {
    label: (
      <TranslatedText
        stringId="lab.formType.option.superset.label"
        fallback="Superset"
        data-testid="translatedtext-vsdj"
      />
    ),
    description: (
      <TranslatedText
        stringId="lab.formType.option.superset.description"
        fallback="Select from a list of supersets"
        data-testid="translatedtext-2nnh"
      />
    ),
    value: LAB_REQUEST_FORM_TYPES.SUPERSET,
  },
};

const POSSIBLE_OPTIONS_LIST = [OPTIONS.PANEL, OPTIONS.INDIVIDUAL];

const ItemSkeleton = styled(Skeleton)`
  padding: 16px 14px;
  margin-right: 14px;
  border-radius: 4px;
  border: 1px solid ${TAMANU_COLORS.outline};
  width: 247px;
  height: 88px;
`;

const ItemSkeletonWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-top: 3px;
`;

const RadioItemSkeleton = ({ itemsLength }) => (
  <ItemSkeletonWrapper data-testid="itemskeletonwrapper-tl5v">
    {Array.from({ length: itemsLength }, (_, i) => (
      <ItemSkeleton
        key={`radio-item-skeleton-${i}`}
        variant="rect"
        data-testid="itemskeleton-daw2"
      />
    ))}
  </ItemSkeletonWrapper>
);

const useLabRequestFormTypeOptions = () => {
  const api = useApi();
  const { getSetting } = useSettings();
  const onlyAllowLabPanels = getSetting('features.onlyAllowLabPanels');

  const { data, isSuccess, isLoading, isFetching } = useQuery(
    ['suggestions/labTestPanel/all'],
    () => api.get(`suggestions/labTestPanel/all`),
  );
  const options =
    isSuccess && !isFetching
      ? POSSIBLE_OPTIONS_LIST.filter((option) => {
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
      <OuterLabelFieldWrapper
        label={
          <TranslatedText
            stringId="lab.formType.label"
            fallback="Select your request type"
            data-testid="translatedtext-ifvs"
          />
        }
        required
        data-testid="outerlabelfieldwrapper-aqgw"
      >
        {isLoading ? (
          <RadioItemSkeleton
            itemsLength={POSSIBLE_OPTIONS_LIST.length}
            data-testid="radioitemskeleton-opqy"
          />
        ) : (
          <Field
            required
            name="requestFormType"
            component={RadioField}
            options={options}
            data-testid="field-iquw"
          />
        )}
      </OuterLabelFieldWrapper>
    </div>
  );
};
