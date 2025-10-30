import React, { useState } from 'react';
import styled from 'styled-components';

import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { Button, Form, FormGrid, TAMANU_COLORS } from '@tamanu/ui-components';
import {
  BodyText,
  DynamicSelectField,
  Field,
  FormModal,
  FormSeparatorLine,
  Heading3,
  LocalisedLocationField,
  LocationAvailabilityWarningMessage,
  ModalFormActionRow,
  RadioField,
} from '../../../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useSuggester } from '../../../api';
import { useEncounter } from '../../../contexts/Encounter';
import { useSettings } from '../../../contexts/Settings';
import { PATIENT_MOVE_ACTIONS } from '@tamanu/constants';
import { notifyError } from '../../../utils';
import { CancelPatientMoveModal } from './CancelPatientMoveModal';

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

const AdvancedMoveFields = ({ plannedLocationId, encounter, onClose }) => {
  const { getSetting } = useSettings();
  const plannedMoveTimeoutHours = getSetting('templates.plannedMoveTimeoutHours');

  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const handleCancelPatientMove = () => {
    onClose();
    setCancelModalOpen(true);
  };

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
          options={[
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
          ]}
          style={{ gridColumn: '1/-1' }}
          data-testid="field-ryle"
        />
      </Section>
      <Button onClick={handleCancelPatientMove} data-testid="button-cancel-patient-move">
        <TranslatedText stringId="encounter.action.cancelPatientMove" fallback="Cancel move" />
      </Button>
      <CancelPatientMoveModal
        encounter={encounter}
        open={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        data-testid="cancelpatientmovemodal-x8xx"
      />
    </>
  );
};

export const MoveModal = React.memo(({ open, onClose, encounter }) => {
  const { getSetting } = useSettings();
  const { writeAndViewEncounter } = useEncounter();

  const enablePatientMoveActions = getSetting('features.patientPlannedMove');

  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });
  const clinicianSuggester = useSuggester('practitioner');

  const onSubmit = async ({ departmentId, examinerId, locationId, plannedLocationId, action }) => {
    try {
      await writeAndViewEncounter(encounter.id, {
        submittedTime: getCurrentDateTimeString(),
        departmentId,
        examinerId,
        ...(action === PATIENT_MOVE_ACTIONS.PLAN
          ? { plannedLocationId }
          : { locationId: plannedLocationId || locationId }),
      });
    } catch (error) {
      notifyError(error.message);
    }
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
          examinerId: encounter.examinerId,
          departmentId: encounter.departmentId,
          ...(enablePatientMoveActions
            ? {
                plannedLocationId: encounter.plannedLocationId,
                action: PATIENT_MOVE_ACTIONS.PLAN,
              }
            : {}),
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
              <AdvancedMoveFields
                plannedLocationId={values?.plannedLocationId}
                encounter={encounter}
                onClose={onClose}
              />
            ) : (
              <BasicMoveFields />
            )}
            <ModalFormActionRow
              onConfirm={submitForm}
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
