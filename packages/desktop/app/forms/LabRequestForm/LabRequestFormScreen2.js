import React, { useMemo } from 'react';
import * as yup from 'yup';
import { LAB_REQUEST_FORM_TYPES } from 'shared/constants/labs';
import { Field, TextField } from '../../components';
import { TestSelectorField } from '../../views/labRequest/TestSelector';
import { BodyText, Heading3 } from '../../components/Typography';

export const screen2ValidationSchema = yup.object().shape({
  labTestTypeIds: yup.array().of(yup.string()),
  panelIds: yup.array().of(yup.string()),
  labTestPanelId: yup.string(),
  notes: yup.string(),
});

const SECTION_LABELS = {
  [LAB_REQUEST_FORM_TYPES.INDIVIDUAL]: {
    subheading: 'Select tests',
    instructions:
      'Please select the test or tests you would like to request below and add any relevant notes. \nYou can filter test by category using the field below.',
    selectableName: 'test',
  },
  [LAB_REQUEST_FORM_TYPES.PANEL]: {
    subheading: 'Select panel',
    instructions:
      'Please select the panel or panels you would like to request below and add any relevant notes.',
    label: 'Select the test panel or panels',
    selectableName: 'panel',
    searchFieldPlaceholder: 'Search panel or category',
  },
  [LAB_REQUEST_FORM_TYPES.SUPERSET]: {
    subheading: 'Select superset',
    instructions:
      'Please select the superset you would like to request below and add any relevant notes. \nYou can also remove or add additional panels to your request.',
    selectableName: 'panel',
  },
};

export const LabRequestFormScreen2 = props => {
  const {
    values: { requestFormType },
  } = props;

  const labelConfig = useMemo(() => SECTION_LABELS[requestFormType], [requestFormType]);
  const { subheading, instructions } = labelConfig;

  return (
    <>
      <div style={{ gridColumn: '1 / -1' }}>
        <Heading3 mb="12px">{subheading}</Heading3>
        <BodyText width="500px" mb="28px" color="textTertiary">
          {instructions}
        </BodyText>
        <Field
          name={
            requestFormType === LAB_REQUEST_FORM_TYPES.INDIVIDUAL ? 'labTestTypeIds' : 'panelIds'
          }
          labelConfig={labelConfig}
          component={TestSelectorField}
          requestFormType={requestFormType}
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
