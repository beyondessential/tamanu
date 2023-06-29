import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as yup from 'yup';
import { LAB_REQUEST_FORM_TYPES, LAB_REQUEST_STATUSES } from '@tamanu/shared/constants/labs';
import { Heading3, BodyText } from '../../components/Typography';
import {
  AutocompleteField,
  DateTimeField,
  Field,
  FormSeparatorLine,
  RadioField,
  SuggesterSelectField,
} from '../../components';
import { binaryOptions } from '../../constants';
import { foreignKey } from '../../utils/validation';
import { useApi } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';

export const screen1ValidationSchema = yup.object().shape({
  requestedById: foreignKey('Requesting clinician is required'),
  requestedDate: yup.date().required('Request date is required'),
  requestFormType: yup
    .string()
    .oneOf(Object.values(LAB_REQUEST_FORM_TYPES))
    .required('Select type must be selected'),
  specimenAttached: yup
    .string()
    .oneOf(binaryOptions.map(o => o.value))
    .required(),
  sampleTime: yup.string().when('specimenAttached', {
    is: 'yes',
    then: yup.string().required(),
    otherwise: yup.string().nullable(),
  }),
  status: yup
    .string()
    .oneOf([LAB_REQUEST_STATUSES.RECEPTION_PENDING, LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED])
    .required(),
});

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

const useLabRequestFormTypeOptions = setFieldValue => {
  const api = useApi();
  const { getLocalisation } = useLocalisation();
  const { onlyAllowLabPanels } = getLocalisation('features') || {};

  const { data, isSuccess } = useQuery(['suggestions/labTestPanel/all'], () =>
    api.get(`suggestions/labTestPanel/all`),
  );
  const arePanels = data?.length > 0;
  const options = [];
  if (arePanels) {
    options.push(OPTIONS.PANEL);
  }
  if (!onlyAllowLabPanels) {
    options.push(OPTIONS.INDIVIDUAL);
  }

  const defaultOption = options.length > 0 ? options[0].value : undefined;

  useEffect(() => {
    if (isSuccess) {
      setFieldValue('requestFormType', defaultOption);
    }
  }, [defaultOption, setFieldValue, isSuccess]);

  return { options };
};

export const LabRequestFormScreen1 = ({
  setFieldValue,
  practitionerSuggester,
  departmentSuggester,
}) => {
  const { options } = useLabRequestFormTypeOptions(setFieldValue);

  return (
    <>
      <div style={{ gridColumn: '1 / -1' }}>
        <Heading3 mb="12px">Creating a new lab request</Heading3>
        <BodyText mb="28px" color="textTertiary">
          Please complete the details below and select the lab request type
        </BodyText>
      </div>
      <Field
        name="requestedById"
        label="Requesting clinician"
        required
        component={AutocompleteField}
        suggester={practitionerSuggester}
      />
      <Field
        name="requestedDate"
        label="Request date & time"
        required
        component={DateTimeField}
        saveDateAsString
      />
      <Field
        name="departmentId"
        label="Department"
        component={AutocompleteField}
        suggester={departmentSuggester}
      />
      <Field
        name="labTestPriorityId"
        label="Priority"
        component={SuggesterSelectField}
        endpoint="labTestPriority"
      />
      <FormSeparatorLine />
      <div style={{ gridColumn: '1 / -1' }}>
        <Field
          required
          name="requestFormType"
          label="Select your request type"
          component={RadioField}
          options={options}
        />
      </div>
    </>
  );
};
