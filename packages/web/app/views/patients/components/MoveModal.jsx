import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

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
import { useFormikContext } from 'formik';

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

const StyledFormGrid = styled(FormGrid)`
  margin-bottom: 20px;
  position: relative;
`;

const MoveActionsContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const CancelMoveButton = styled(Button)`
  margin-top: 10px;
  position: absolute;
  right: 0;
  bottom: 0;
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
      <StyledFormGrid columns={2} data-testid="formgrid-wyqp">
        <Field name="locationId" component={LocalisedLocationField} data-testid="field-tykg" />
      </StyledFormGrid>
    </>
  );
};

export const PATIENT_MOVE_ACTIONS = {
  PLAN: 'plan',
  FINALISE: 'finalise',
};

const PlannedMoveFields = () => {
  const { getSetting } = useSettings();
  const plannedMoveTimeoutHours = getSetting('templates.plannedMoveTimeoutHours');
  const { values, initialValues, setFieldValue } = useFormikContext();

  const isExistingPlannedMove =
    initialValues?.plannedLocationId &&
    initialValues?.plannedLocationId === values?.plannedLocationId;

  const description = isExistingPlannedMove ? (
    <TranslatedText
      stringId="patient.encounter.movePatient.location.advancedDescription.existing"
      fallback="The below location is a current planned move. You can finalise the move, change the location, or clear the fields to cancel the move."
    />
  ) : (
    <TranslatedText
      stringId="patient.encounter.movePatient.location.advancedDescription"
      fallback="Select a location to plan the patient location move and reserve a bed. The new location will
        not be reflected in the patient encounter until you finalise the move. If the change is not
        finalised within :plannedMoveTimeoutHours hours, the planned location move will be
        cancelled. Alternatively you can finalise the patient move now using the option below."
      replacements={{ plannedMoveTimeoutHours }}
    />
  );

  return (
    <>
      <SectionDescription>{description}</SectionDescription>
      <StyledFormGrid columns={2} data-testid="formgrid-wyqp">
        <Field
          name="plannedLocationId"
          component={LocalisedLocationField}
          data-testid="field-n625"
        />
        <LocationAvailabilityWarningMessage
          locationId={values.plannedLocationId}
          style={{ gridColumn: '2', fontSize: '12px', marginTop: '-15px' }}
          data-testid="locationavailabilitywarningmessage-6ivs"
        />
      </StyledFormGrid>
      <MoveActionsContainer>
        {values.plannedLocationId && (
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
            data-testid="field-ryle"
          />
        )}
        {isExistingPlannedMove && (
          <CancelMoveButton
            onClick={() => {
              setFieldValue('plannedLocationId', null);
            }}
            variant="outlined"
            data-testid="button-cancel-patient-move"
          >
            <TranslatedText stringId="encounter.action.cancelPatientMove" fallback="Cancel move" />
          </CancelMoveButton>
        )}
      </MoveActionsContainer>
    </>
  );
};

const getFormProps = ({ encounter, enablePatientMoveActions }) => {
  const validationObject = {
    examinerId: yup.string().required(),
    departmentId: yup.string().required(),
  };

  const initialValues = {
    examinerId: encounter.examinerId,
    departmentId: encounter.departmentId,
  };

  if (enablePatientMoveActions) {
    validationObject.plannedLocationId = yup.string().nullable();
    validationObject.action = yup
      .string()
      .oneOf([PATIENT_MOVE_ACTIONS.PLAN, PATIENT_MOVE_ACTIONS.FINALISE])
      .nullable();

    initialValues.plannedLocationId = encounter.plannedLocationId;
    initialValues.action = PATIENT_MOVE_ACTIONS.PLAN;
  } else {
    validationObject.locationId = yup.string().nullable();
  }

  return { initialValues, validationSchema: yup.object().shape(validationObject) };
};

export const MoveModal = React.memo(({ open, onClose, encounter }) => {
  const { getSetting } = useSettings();
  const enablePatientMoveActions = getSetting('features.patientPlannedMove');

  const { writeAndViewEncounter } = useEncounter();

  const clinicianSuggester = useSuggester('practitioner');
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });

  const onSubmit = async values => {
    const { locationId, plannedLocationId, action, ...rest } = values;

    const locationData = {};
    if (action === PATIENT_MOVE_ACTIONS.PLAN) {
      locationData.plannedLocationId = plannedLocationId || null;
    } else {
      if (locationId || plannedLocationId) {
        locationData.locationId = plannedLocationId || locationId;
      }
    }

    await writeAndViewEncounter(encounter.id, {
      submittedTime: getCurrentDateTimeString(),
      ...rest,
      ...locationData,
    });
  };

  const { initialValues, validationSchema } = getFormProps({ encounter, enablePatientMoveActions });

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
        initialValues={initialValues}
        formType={FORM_TYPES.EDIT_FORM}
        onSubmit={onSubmit}
        validationSchema={validationSchema}
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
                fallback="Update patient clinician and department details below."
              />
            </SectionDescription>
            <StyledFormGrid columns={2} data-testid="formgrid-wyqp">
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
            </StyledFormGrid>
            <FormSeparatorLine />
            <SectionHeading>
              <TranslatedText
                stringId="patient.encounter.modal.movePatient.section.basic.heading"
                fallback="Move location"
              />
            </SectionHeading>
            {enablePatientMoveActions ? <PlannedMoveFields /> : <BasicMoveFields />}
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
