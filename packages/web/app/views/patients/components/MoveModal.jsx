import React from 'react';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import {
  AutocompleteField,
  BodyText,
  Field,
  Form,
  FormGrid,
  FormModal,
  FormSubmitCancelRow,
  Heading3,
} from '../../../components';
import { usePatientMove } from '../../../api/mutations';
import { FORM_TYPES } from '../../../constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useSuggester } from '../../../api';
import { useEncounter } from '../../../contexts/Encounter';

// TODO: this is going to be the base of the new patient transfer modal

export const PatientTransferModal = React.memo(({ open, onClose, encounter }) => {
  const { writeAndViewEncounter } = useEncounter();
  const { mutateAsync: submitPatientMove } = usePatientMove(encounter.id, onClose);
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });
  const clinicianSuggester = useSuggester('practitioner');

  const onSubmit = async data => {
    await writeAndViewEncounter(encounter.id, data);
    await submitPatientMove(data);
    onClose();
  };

  return (
    <FormModal
      title={
        <TranslatedText
          stringId="patient.encounter.action.movePatient"
          fallback="Move patient"
          data-testid="translatedtext-o1ut"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="formmodal-httn"
    >
      <Form
        initialValues={{
          // Used in creation of associated notes
          submittedTime: getCurrentDateTimeString(),
        }}
        formType={FORM_TYPES.EDIT_FORM}
        onSubmit={onSubmit}
        render={({ submitForm }) => (
          <>
            <Heading3>Patient Care</Heading3>
            <BodyText>Please select the clinician and department for the patient.</BodyText>
            <FormGrid columns={2} data-testid="formgrid-wyqp">
              <Field
                name="examinerId"
                component={AutocompleteField}
                suggester={clinicianSuggester}
                label={
                  <TranslatedText
                    stringId="patient.encounter.movePatient.clinician.label"
                    fallback="Clinician"
                  />
                }
                required
                data-testid="field-tykg"
              />
              <Field
                name="departmentId"
                component={AutocompleteField}
                suggester={departmentSuggester}
                label={
                  <TranslatedText
                    stringId="patient.encounter.movePatient.department.label"
                    fallback="Department"
                  />
                }
                required
                data-testid="field-tykg"
              />
            </FormGrid>
            <Heading3>Move location</Heading3>
            <BodyText>Please select the clinician and department for the patient.</BodyText>
            <FormGrid columns={2} data-testid="formgrid-wyqp"></FormGrid>
            <FormSubmitCancelRow
              onConfirm={submitForm}
              onCancel={onClose}
              data-testid="formsubmitcancelrow-35ou"
            />
          </>
        )}
        data-testid="form-0lgu"
      />
    </FormModal>
  );
});
