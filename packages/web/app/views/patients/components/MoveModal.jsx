import React from 'react';
import styled from 'styled-components';

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
import { TAMANU_COLORS } from '@tamanu/ui-components';

const SectionHeading = styled(Heading3)`
  color: ${TAMANU_COLORS.darkestText};
  margin: 0;
  margin-bottom: 10px;
  padding: 0;
`;

const SectionDescription = styled(BodyText)`
  color: ${TAMANU_COLORS.midText};
  margin: 0;
  margin-bottom: 20px;
  padding: 0;
`;

const SubmitRow = styled(FormSubmitCancelRow)`
  margin-top: 20px;
`;

export const MoveModal = React.memo(({ open, onClose, encounter }) => {
  const { writeAndViewEncounter } = useEncounter();
  const { mutateAsync: submitPatientMove } = usePatientMove(encounter.id, onClose);
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });
  const clinicianSuggester = useSuggester('practitioner');

  const onSubmit = async data => {
    await writeAndViewEncounter(encounter.id, data);
    await submitPatientMove(data);
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
          examinerId: encounter.examinerId,
          departmentId: encounter.departmentId,
        }}
        formType={FORM_TYPES.EDIT_FORM}
        onSubmit={onSubmit}
        render={({ submitForm }) => (
          <>
            <SectionHeading>
              <TranslatedText
                stringId="patient.encounter.modal.movePatient.section.move.heading"
                fallback="Move patient"
              />
            </SectionHeading>
            <SectionDescription>
              <TranslatedText
                stringId="patient.encounter.modal.movePatient.section.move.description"
                fallback="Please select the clinician and department for the patient."
              />
            </SectionDescription>
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
            <SubmitRow
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
