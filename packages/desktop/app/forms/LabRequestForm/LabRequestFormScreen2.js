import React, { useMemo } from 'react';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/shared/constants/labs';
import styled from 'styled-components';
import { useApi } from '../../api';
import { Field, TextField } from '../../components';
import { TestSelectorField } from '../../views/labRequest/TestSelector';
import { Heading3, BodyText } from '../../components/Typography';

const StyledBodyText = styled(BodyText)`
  margin-bottom: 28px;
  white-space: pre-line;
`;

export const screen2ValidationSchema = yup.object().shape({
  labTestTypeIds: yup
    .array()
    .of(yup.string())
    .required(),
  labTestPanelId: yup.string(),
  notes: yup.string(),
});

const SECTION_LABELS = {
  [LAB_REQUEST_FORM_TYPES.INDIVIDUAL]: {
    subheading: 'Select tests',
    instructions:
      'Please select the test or tests you would like to request below and add any relevant notes. \nYou can filter test by category using the field below.',
    testSelectorFieldLabel: 'Select tests',
  },
  [LAB_REQUEST_FORM_TYPES.PANEL]: {
    subheading: 'Select panel',
    instructions:
      'Please select the panel or panels you would like to request below and add any relevant notes.',
    testSelectorFieldLabel: 'Select the test panel or panels',
  },
  [LAB_REQUEST_FORM_TYPES.SUPERSET]: {
    subheading: 'Select superset',
    instructions:
      'Please select the superset you would like to request below and add any relevant notes. \nYou can also remove or add additional panels to your request.',
    testSelectorFieldLabel: 'Select superset',
  },
};

export const LabRequestFormScreen2 = props => {
  const {
    values: { requestFormType, labTestPanelId },
    setFieldValue,
  } = props;

  const formTypeToLabelConfig = useMemo(() => {
    return SECTION_LABELS[requestFormType] || { testSelectorFieldLabel: 'Select tests' };
  }, [requestFormType]);
  const api = useApi();
  const { data: testTypesData, isLoading } = useQuery(['labTestTypes'], () =>
    api.get('labTestType'),
  );

  const handleClearPanel = () => {
    setFieldValue('labTestPanelId', undefined);
  };

  return (
    <>
      <div style={{ gridColumn: '1 / -1' }}>
        {formTypeToLabelConfig.subheading && (
          <Heading3 mb="12px">{formTypeToLabelConfig.subheading}</Heading3>
        )}
        {formTypeToLabelConfig.instructions && (
          <StyledBodyText mb="28px" color="textTertiary">
            {formTypeToLabelConfig.instructions}
          </StyledBodyText>
        )}
        <Field
          name="labTestTypeIds"
          label={formTypeToLabelConfig.testSelectorFieldLabel || 'Select tests'}
          onClearPanel={handleClearPanel}
          component={TestSelectorField}
          requestFormType={requestFormType}
          labTestPanelId={labTestPanelId}
          testTypes={testTypesData}
          isLoading={isLoading}
          required
          {...props}
        />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field name="note" label="Notes" component={TextField} multiline rows={3} />
      </div>
    </>
  );
};
