import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateString, getCurrentDateTimeString } from 'shared/utils/dateTime';

import { LAB_REQUEST_STATUSES } from 'shared/constants/labs';
import { foreignKey } from '../utils/validation';
import { binaryOptions } from '../constants';
import { useAuth } from '../contexts/Auth';

import {
  Form,
  Field,
  AutocompleteField,
  SuggesterSelectField,
  DateTimeField,
  RadioField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { Button, OutlinedButton } from '../components/Button';
import { ButtonRow } from '../components/ButtonRow';
import { FormSeparatorLine } from '../components/FormSeparatorLine';

const LAB_REQUEST_TYPES = {
  PANEL: 'panel',
  INDIVIDUAL: 'individual',
};

const labRequestValidationSchema = yup.object().shape({
  requestedById: foreignKey('Requesting clinician is required'),
  requestedDate: yup.date().required(),
  requestType: yup
    .string()
    .oneOf(Object.values(LAB_REQUEST_TYPES))
    .required(),
  specimenAttached: yup
    .string()
    .oneOf(binaryOptions.map(o => o.value))
    .required(),
  sampleTime: yup.string().when('specimenAttached', {
    is: 'yes',
    then: yup.string().required(),
    otherwise: yup.string().nullable(),
  }),
  sample: yup
    .string()
    .oneOf([LAB_REQUEST_STATUSES.PENDING, LAB_REQUEST_STATUSES.NOT_COLLECTED])
    .required(),
});

// const FormSubmitActionDropdown = ({ requestId, encounter, submitForm }) => {
//   const { navigateToLabRequest } = usePatientNavigation();
//   const { loadEncounter } = useEncounter();
//   const { loadLabRequest } = useLabRequest();
//   const [awaitingPrintRedirect, setAwaitingPrintRedirect] = useState();

//   // Transition to print page as soon as we have the generated id
//   useEffect(() => {
//     (async () => {
//       if (awaitingPrintRedirect && requestId) {
//         await loadLabRequest(requestId);
//         navigateToLabRequest(requestId, 'print');
//       }
//     })();
//   }, [requestId, awaitingPrintRedirect, loadLabRequest, navigateToLabRequest]);

//   const finalise = async data => {
//     await submitForm(data);
//     await loadEncounter(encounter.id);
//   };
//   const finaliseAndPrint = async data => {
//     await submitForm(data);
//     // We can't transition pages until the lab req is fully submitted
//     setAwaitingPrintRedirect(true);
//   };

//   const actions = [
//     { label: 'Finalise', onClick: finalise },
//     { label: 'Finalise & print', onClick: finaliseAndPrint },
//   ];

//   return <DropdownButton actions={actions} />;
// };

export const LabRequestForm = ({
  practitionerSuggester,
  departmentSuggester,
  encounter,
  onNext,
  onSubmit,
  onCancel,
  editedObject,
  generateDisplayId,
}) => {
  const { currentUser } = useAuth();

  const renderForm = ({ values, setFieldValue, handleChange }) => {
    const handleToggleSampleCollected = event => {
      handleChange(event);
      const isSampleCollected = event.target.value === 'yes';
      if (isSampleCollected) {
        setFieldValue('sampleTime', getCurrentDateString());
        setFieldValue('status', LAB_REQUEST_STATUSES.PENDING);
      } else {
        setFieldValue('sampleTime', null);
        setFieldValue('status', LAB_REQUEST_STATUSES.NOT_COLLECTED);
      }
    };

    return (
      <FormGrid>
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
            name="specimenAttached"
            label="Sample collected"
            required
            component={RadioField}
            onChange={handleToggleSampleCollected}
            options={binaryOptions}
          />
        </div>
        {values.specimenAttached === 'yes' && (
          <>
            <Field
              name="sampleTime"
              label="Sample date & time"
              required
              component={DateTimeField}
              saveDateAsString
            />
            <Field
              name="labSampleSiteId"
              label="Site"
              component={SuggesterSelectField}
              endpoint="labSampleSite"
            />
          </>
        )}
        <FormSeparatorLine />
        <div style={{ gridColumn: '1 / -1' }}>
          <Field
            name="requestType"
            label="Select your request type"
            component={RadioField}
            options={[
              {
                label: 'Panel',
                description: 'Select from a list of test panels',
                value: LAB_REQUEST_TYPES.PANEL,
              },
              {
                label: 'Individual',
                description: 'Select any individual or range of individual test types',
                value: LAB_REQUEST_TYPES.INDIVIDUAL,
              },
            ]}
          />
        </div>

        <FormSeparatorLine />
        <ButtonRow>
          <OutlinedButton onClick={onCancel}>Cancel</OutlinedButton>
          <Button onClick={onNext}>Next</Button>
        </ButtonRow>
      </FormGrid>
    );
  };

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={{
        displayId: generateDisplayId(),
        requestedById: currentUser.id,
        departmentId: encounter.departmentId,
        requestedDate: getCurrentDateTimeString(),
        specimenAttached: 'no',
        status: LAB_REQUEST_STATUSES.PENDING,
        // LabTest date
        date: getCurrentDateString(),
        ...editedObject,
      }}
      validationSchema={labRequestValidationSchema}
    />
  );
};

LabRequestForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  practitionerSuggester: PropTypes.object.isRequired,
  encounter: PropTypes.object,
  generateDisplayId: PropTypes.func.isRequired,
  editedObject: PropTypes.object,
};

LabRequestForm.defaultProps = {
  encounter: {},
  editedObject: {},
  requestId: '',
};
