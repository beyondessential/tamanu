import React from 'react';
import styled from 'styled-components';

import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import {
  BodyText,
  DynamicSelectField,
  Field,
  Form,
  FormGrid,
  FormModal,
  FormSeparatorLine,
  FormSubmitCancelRow,
  Heading3,
  LocalisedLocationField,
} from '../../../components';
import { usePatientMove } from '../../../api/mutations';
import { FORM_TYPES } from '../../../constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useSuggester } from '../../../api';
import { useEncounter } from '../../../contexts/Encounter';
import { TAMANU_COLORS } from '@tamanu/ui-components';
import { useSettings } from '../../../contexts/Settings';

const SectionHeading = styled(Heading3)`
  color: ${TAMANU_COLORS.darkestText};
  margin: 10px 0;
  padding: 0;
`;

const SectionDescription = styled(BodyText)`
  color: ${TAMANU_COLORS.midText};
  margin: 0;
  margin-bottom: 20px;
  padding: 0;
`;

const Section = styled(FormGrid)`
  margin-bottom: 30px;
`;

const SubmitRow = styled(FormSubmitCancelRow)`
  margin-top: 20px;
`;

const BasicMoveFields = () => {
  return (
    <>
      <SectionHeading>
        <TranslatedText
          stringId="patient.encounter.modal.movePatient.section.basic.heading"
          fallback="Move location"
        />
      </SectionHeading>
      <SectionDescription>
        <TranslatedText
          stringId="patient.encounter.modal.movePatient.section.basic.description"
          fallback="Please select the location for the patient."
        />
      </SectionDescription>
      <Section columns={2} data-testid="formgrid-wyqp">
        <Field
          name="locationId"
          component={LocalisedLocationField}
          label={
            <TranslatedText
              stringId="patient.encounter.movePatient.location.label"
              fallback="New location"
              data-testid="translatedtext-35a6"
            />
          }
          required
          data-testid="field-tykg"
        />
      </Section>
    </>
  );
};

const AdvancedMoveFields = () => {
  return (
    <>
      <SectionHeading>ADVANCED MOVEMENT</SectionHeading>
      <SectionDescription>PLEASE SELECT THE LOCATION FOR THE PATIENT.</SectionDescription>
      <Section columns={2} data-testid="formgrid-wyqp">
        <Field
          name="plannedLocationId"
          component={LocalisedLocationField}
          label="Planned location"
        />
      </Section>
    </>
  );
};

export const MoveModal = React.memo(({ open, onClose, encounter }) => {
  const { getSetting } = useSettings();
  const { writeAndViewEncounter } = useEncounter();
  const { mutateAsync: submitPatientMove } = usePatientMove(encounter.id, onClose);

  const enablePatientMoveActions = getSetting('features.patientPlannedMove');

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
          locationId: encounter.locationId,
        }}
        formType={FORM_TYPES.EDIT_FORM}
        onSubmit={onSubmit}
        render={({ submitForm }) => (
          <>
            <SectionHeading>
              <TranslatedText
                stringId="patient.encounter.modal.movePatient.section.move.heading"
                fallback="Patient care"
              />
            </SectionHeading>
            <SectionDescription>
              <TranslatedText
                stringId="patient.encounter.modal.movePatient.section.move.description"
                fallback="Please select the clinician and department for the patient."
              />
            </SectionDescription>
            <Section columns={2} data-testid="formgrid-wyqp">
              <Field
                name="examinerId"
                component={DynamicSelectField}
                suggester={clinicianSuggester}
                label={
                  <TranslatedText
                    stringId="patient.encounter.movePatient.supervisingClinician.label"
                    fallback="Supervising clinician"
                  />
                }
                required
                data-testid="field-tykg"
              />
              <Field
                name="departmentId"
                component={DynamicSelectField}
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
            </Section>
            <FormSeparatorLine />
            {enablePatientMoveActions ? <AdvancedMoveFields /> : <BasicMoveFields />}
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
