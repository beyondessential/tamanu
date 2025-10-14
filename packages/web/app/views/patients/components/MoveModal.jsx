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
  LocationAvailabilityWarningMessage,
  RadioField,
} from '../../../components';
import { usePatientMove } from '../../../api/mutations';
import { FORM_TYPES } from '../../../constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useSuggester } from '../../../api';
import { useEncounter } from '../../../contexts/Encounter';
import { TAMANU_COLORS } from '@tamanu/ui-components';
import { useSettings } from '../../../contexts/Settings';
import { PATIENT_MOVE_ACTIONS } from '@tamanu/constants';

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
      <SectionDescription>DESCRIPTION TO BE CONFIRMED</SectionDescription>
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

const PATIENT_MOVE_ACTION_OPTIONS = [
  {
    label: (
      <TranslatedText
        stringId="encounter.modal.patientMove.action.plan"
        fallback="Plan"
        data-testid="translatedtext-patient-move-action-plan"
      />
    ),
    value: PATIENT_MOVE_ACTIONS.PLAN,
  },
  {
    label: (
      <TranslatedText
        stringId="encounter.modal.patientMove.action.finalise"
        fallback="Finalise"
        data-testid="translatedtext-patient-move-action-finalise"
      />
    ),
    value: PATIENT_MOVE_ACTIONS.FINALISE,
  },
];

const AdvancedMoveFields = ({ plannedLocationId }) => {
  const { getSetting } = useSettings();
  const plannedMoveTimeoutHours = getSetting('templates.plannedMoveTimeoutHours');

  return (
    <>
      <SectionDescription>
        Select a location to plan the patient location move and reserve a bed. The new location will
        not be reflected in the patient encounter until you finalise the move. If the change is not
        finalised within 24 hours, the planned location move will be cancelled. Alternatively you
        can finalise the patient move now using the option below.
      </SectionDescription>
      <Section columns={2} data-testid="formgrid-wyqp">
        <Field
          name="plannedLocationId"
          component={LocalisedLocationField}
          required
          data-testid="field-n625"
        />
        <LocationAvailabilityWarningMessage
          locationId={plannedLocationId}
          style={{ gridColumn: '2', marginTop: '-35px', fontSize: '12px' }}
          data-testid="locationavailabilitywarningmessage-6ivs"
        />
        <Field
          name="action"
          label={
            <TranslatedText
              stringId="encounter.modal.patientMove.action.label"
              fallback="Would you like to plan or finalise the patient move?"
              data-testid="translatedtext-l7v1"
            />
          }
          component={RadioField}
          options={PATIENT_MOVE_ACTION_OPTIONS}
          style={{ gridColumn: '1/-1' }}
          data-testid="field-ryle"
        />
        <TranslatedText
          stringId="encounter.modal.patientMove.planningNote"
          fallback="By selecting 'Plan' the new location will not be reflected in the patient encounter until you finalise the move. If the move is not finalised within :hours hours, the location will be deemed 'Available' again."
          replacements={{ hours: plannedMoveTimeoutHours }}
          data-testid="translatedtext-encounter-modal-patient-move-planning-note"
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
          ...(enablePatientMoveActions
            ? {
                plannedLocationId: encounter.plannedLocationId,
                action: PATIENT_MOVE_ACTIONS.PLAN,
              }
            : {
                locationId: encounter.locationId,
              }),
        }}
        formType={FORM_TYPES.EDIT_FORM}
        onSubmit={onSubmit}
        render={({ submitForm, values }) => (
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
            <SectionHeading>
              <TranslatedText
                stringId="patient.encounter.modal.movePatient.section.basic.heading"
                fallback="Move location"
              />
            </SectionHeading>
            {enablePatientMoveActions ? (
              <AdvancedMoveFields plannedLocationId={values?.plannedLocationId} />
            ) : (
              <BasicMoveFields />
            )}
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
