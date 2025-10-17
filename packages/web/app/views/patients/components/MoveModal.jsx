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
  LargeBodyText,
  LocalisedLocationField,
  LocationAvailabilityWarningMessage,
  ModalFormActionRow,
  RadioField,
  TranslatedEnum,
} from '../../../components';
import { usePatientMove } from '../../../api/mutations';
import { FORM_TYPES } from '../../../constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useSuggester } from '../../../api';
import { useEncounter } from '../../../contexts/Encounter';
import { TAMANU_COLORS } from '@tamanu/ui-components';
import { useSettings } from '../../../contexts/Settings';
import { ENCOUNTER_TYPE_LABELS, PATIENT_MOVE_ACTIONS } from '@tamanu/constants';

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

const EncounterChangeDescription = styled(LargeBodyText)`
  margin-top: 5px;
  margin-bottom: 20px;
`;

const BasicMoveFields = () => {
  return (
    <>
      <SectionDescription>
        <TranslatedText
          stringId="patient.encounter.movePatient.location.description"
          fallback="Select new patient location."
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

const PATIENT_MOVE_ACTION_OPTIONS = [
  {
    label: (
      <TranslatedText
        stringId="encounter.modal.patientMove.action.finalise"
        fallback="Finalise now"
        data-testid="translatedtext-patient-move-action-finalise"
      />
    ),
    value: PATIENT_MOVE_ACTIONS.FINALISE,
  },
  {
    label: (
      <TranslatedText
        stringId="encounter.modal.patientMove.action.plan"
        fallback="Plan change"
        data-testid="translatedtext-patient-move-action-plan"
      />
    ),
    value: PATIENT_MOVE_ACTIONS.PLAN,
  },
];

const AdvancedMoveFields = ({ plannedLocationId }) => {
  const { getSetting } = useSettings();
  const plannedMoveTimeoutHours = getSetting('templates.plannedMoveTimeoutHours');

  return (
    <>
      <SectionDescription>
        <TranslatedText
          stringId="patient.encounter.movePatient.location.advancedDescription"
          fallback="Select a location to plan the patient location move and reserve a bed. The new location will
        not be reflected in the patient encounter until you finalise the move. If the change is not
        finalised within :plannedMoveTimeoutHours hours, the planned location move will be
        cancelled. Alternatively you can finalise the patient move now using the option below."
          replacements={{ plannedMoveTimeoutHours }}
        />
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
          style={{ gridColumn: '2', fontSize: '12px', marginTop: '-15px' }}
          data-testid="locationavailabilitywarningmessage-6ivs"
        />
        <Field
          name="action"
          label={
            <TranslatedText
              stringId="encounter.modal.patientMove.action.label"
              fallback="Would you like to finalise the patient location move now or plan change?"
              data-testid="translatedtext-l7v1"
            />
          }
          component={RadioField}
          options={PATIENT_MOVE_ACTION_OPTIONS}
          style={{ gridColumn: '1/-1' }}
          data-testid="field-ryle"
        />
      </Section>
    </>
  );
};

const getConfirmText = newEncounterType => {
  if (newEncounterType) {
    return (
      <TranslatedText
        stringId="patient.encounter.modal.movePatient.action.transferToNewEncounterType"
        fallback="Transfer to :newEncounterType"
        replacements={{ newEncounterType }}
      />
    );
  }
  return <TranslatedText stringId="general.action.confirm" fallback="Confirm" />;
};

const EncounterTypeChangeDescription = ({ encounterType, newEncounterType }) => {
  return (
    <EncounterChangeDescription>
      <TranslatedText
        stringId="patient.encounter.modal.movePatient.action.changeEncounterType"
        fallback="Changing encounter type from"
      />{' '}
      <b>
        <TranslatedEnum enumValues={ENCOUNTER_TYPE_LABELS} value={encounterType} />
      </b>{' '}
      to{' '}
      <b>
        <TranslatedEnum enumValues={ENCOUNTER_TYPE_LABELS} value={newEncounterType} />
      </b>
    </EncounterChangeDescription>
  );
};

export const MoveModal = React.memo(({ open, onClose, encounter, newEncounterType }) => {
  const { getSetting } = useSettings();
  const { writeAndViewEncounter } = useEncounter();
  const { mutateAsync: submitPatientMove } = usePatientMove(encounter.id, onClose);

  const enablePatientMoveActions = getSetting('features.patientPlannedMove');

  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });
  const clinicianSuggester = useSuggester('practitioner');

  const onSubmit = async ({ departmentId, examinerId, locationId, plannedLocationId, action }) => {
    await writeAndViewEncounter(encounter.id, {
      departmentId,
      examinerId,
      ...(newEncounterType && { encounterType: newEncounterType }),
    });

    await submitPatientMove(
      action === PATIENT_MOVE_ACTIONS.PLAN
        ? {
            plannedLocationId,
          }
        : {
            locationId: plannedLocationId || locationId,
          },
    );
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
      width="md"
    >
      <Form
        initialValues={{
          // Used in creation of associated notes
          submittedTime: getCurrentDateTimeString(),
          examinerId: encounter.examinerId,
          departmentId: encounter.departmentId,
          ...(enablePatientMoveActions
            ? {
                action: PATIENT_MOVE_ACTIONS.PLAN,
              }
            : {}),
        }}
        formType={FORM_TYPES.EDIT_FORM}
        onSubmit={onSubmit}
        render={({ submitForm, values }) => (
          <>
            {newEncounterType && (
              <>
                <EncounterTypeChangeDescription
                  encounterType={encounter.encounterType}
                  newEncounterType={newEncounterType}
                />
                <FormSeparatorLine />
              </>
            )}
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
            <ModalFormActionRow
              onConfirm={submitForm}
              confirmText={getConfirmText(newEncounterType)}
              onCancel={onClose}
              data-testid="modalformactionrow-35ou"
            />
          </>
        )}
        data-testid="form-0lgu"
      />
    </FormModal>
  );
});
