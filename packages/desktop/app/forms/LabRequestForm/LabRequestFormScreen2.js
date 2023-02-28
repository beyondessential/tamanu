import React from 'react';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { LAB_REQUEST_FORM_TYPES } from 'shared/constants/labs';
import { useApi } from '../../api';
import { Field, TextField } from '../../components';
import { TestSelectorField } from '../../views/labRequest/TestSelector';

export const screen2ValidationSchema = yup.object().shape({
  labTestIds: yup
    .array()
    .of(yup.string())
    .required(),
  notes: yup.string(),
});

export const LabRequestFormScreen2 = props => {
  const {
    values: { requestFormType },
  } = props;
  const api = useApi();
  const { data: testTypesData, isLoading } = useQuery(['labTestTypes'], () =>
    api.get('labTestType'),
  );

  return (
    <>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field
          name="labTestIds"
          label={`Select the test ${
            requestFormType === LAB_REQUEST_FORM_TYPES.PANEL ? 'panel' : 'category'
          }`}
          component={TestSelectorField}
          requestFormType={requestFormType}
          testTypes={testTypesData}
          isLoading={isLoading}
          {...props}
        />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field name="notes" label="Notes" component={TextField} multiline rows={3} />
      </div>
    </>
  );
};
