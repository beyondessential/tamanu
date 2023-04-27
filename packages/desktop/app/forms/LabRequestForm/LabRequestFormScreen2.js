import React, { useMemo } from 'react';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { LAB_REQUEST_FORM_TYPES } from 'shared/constants/labs';
import { useApi } from '../../api';
import { Field, TextField } from '../../components';
import { TestSelectorField } from '../../views/labRequest/TestSelector';
import { Heading3, BodyText } from '../../components/Typography';

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
      'Please select the test or tests you would like to request below and add any relevant notes. You can filter test by category using the field below.',
    testTypeIdLabel: 'Select tests',
  },
  [LAB_REQUEST_FORM_TYPES.PANEL]: {
    subheading: 'Select panel',
    instructions:
      'Please select the panel or panels you would like to request below and add any relevant notes.',
    testTypeIdLabel: 'Select the test panel or panels',
  },
  [LAB_REQUEST_FORM_TYPES.SUPERSET]: {
    subheading: 'Select superset',
    instructions:
      'Please select the superset you would like to request below and add any relevant notes. You can also remove or add additional panels to your request.',
    testTypeIdLabel: 'Select superset',
  },
};

export const LabRequestFormScreen2 = props => {
  const {
    values: { requestFormType, labTestPanelId },
    setFieldValue,
  } = props;

  const labels = useMemo(() => {
    return SECTION_LABELS[requestFormType] || {};
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
        {labels.subheading && <Heading3 mb="12px">{labels.subheading}</Heading3>}
        {labels.instructions && (
          <BodyText mb="28px" color="textTertiary">
            {labels.instructions}
          </BodyText>
        )}
        <Field
          name="labTestTypeIds"
          label={labels.testTypeIdLabel || 'Select tests'}
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
