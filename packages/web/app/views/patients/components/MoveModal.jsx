import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { FORM_TYPES } from '@tamanu/constants/forms';
import {
  Button,
  DateField,
  DateTimeField,
  Form,
  FormGrid,
  TAMANU_COLORS,
  useTranslation,
} from '@tamanu/ui-components';
import {
  BodyText,
  DynamicSelectField,
  Field,
  FormModal,
  FormSeparatorLine,
  Heading3,
  LargeBodyText,
  LocalisedField,
  LocalisedLocationField,
  LocationAvailabilityWarningMessage,
  ModalFormActionRow,
  RadioField,
  SuggesterSelectField,
  TranslatedEnum,
} from '../../../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useSuggester } from '../../../api';
import { useEncounter } from '../../../contexts/Encounter';
import { useSettings } from '../../../contexts/Settings';
import { ENCOUNTER_TYPE_LABELS, ENCOUNTER_TYPES } from '@tamanu/constants';
import { useFormikContext } from 'formik';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../../../constants';

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

const StyledFormSeparatorLine = styled(FormSeparatorLine)`
  margin-bottom: 20px;
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

const EncounterChangeDescription = styled(LargeBodyText)`
  margin-top: 5px;
  margin-bottom: 20px;
`;

const EncounterTypeLabel = styled.b`
  border-bottom: 2px solid ${({ $underlineColor }) => $underlineColor};
`;

const BasicMoveFields = () => {
  const { setFieldValue, values } = useFormikContext();
  const handleGroupChange = groupValue => {
    setFieldValue('locationGroupId', groupValue);
  };

  return (
    <>
      <SectionDescription>
        <TranslatedText
          stringId="patient.encounter.movePatient.location.description"
          fallback="Select new patient location."
        />
      </SectionDescription>
      <StyledFormGrid columns={2} data-testid="formgrid-wyqp">
        <Field
          name="locationId"
          component={LocalisedLocationField}
          groupValue={values.locationGroupId}
          onGroupChange={handleGroupChange}
          data-testid="field-tykg"
        />
      </StyledFormGrid>
    </>
  );
};

const PATIENT_MOVE_ACTIONS = {
  PLAN: 'plan',
  FINALISE: 'finalise',
};

const PlannedMoveFields = () => {
  const { getSetting } = useSettings();
  const plannedMoveTimeoutHours = getSetting('templates.plannedMoveTimeoutHours');
  const { values, initialValues, setFieldValue } = useFormikContext();

  const handleGroupChange = groupValue => {
    setFieldValue('locationGroupId', groupValue);
  };

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
          groupValue={values.locationGroupId}
          onGroupChange={handleGroupChange}
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
                fallback="Would you like to finalise the patient location move now or plan the move?"
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
                    fallback="Plan move"
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

const EncounterChangeText = ({ newEncounterType }) => {
  const { getEnumTranslation } = useTranslation();
  if (newEncounterType === ENCOUNTER_TYPES.ADMISSION) {
    return (
      <TranslatedText stringId="encounter.action.admitToHospital" fallback="Admit to hospital" />
    );
  }

  return (
    <TranslatedText
      stringId="patient.encounter.modal.movePatient.action.transferToNewEncounterType"
      fallback="Transfer to :newEncounterType"
      replacements={{
        newEncounterType: getEnumTranslation(ENCOUNTER_TYPE_LABELS, newEncounterType),
      }}
    />
  );
};

const getFormProps = ({ encounter, enablePatientMoveActions, isAdmittingToHospital }) => {
  const validationObject = {
    examinerId: yup.string().required(),
    departmentId: yup.string().required(),
  };

  const initialValues = {
    examinerId: encounter.examinerId,
    departmentId: encounter.departmentId,
  };

  if (enablePatientMoveActions) {
    validationObject.action = yup
      .string()
      .oneOf([PATIENT_MOVE_ACTIONS.PLAN, PATIENT_MOVE_ACTIONS.FINALISE])
      .nullable();
    validationObject.plannedLocationId = yup
      .string()
      .nullable()
      .when('locationGroupId', {
        is: value => !!value,
        then: schema => schema.required(),
        otherwise: schema => schema.nullable(),
      });
    initialValues.plannedLocationId = encounter.plannedLocationId;
    initialValues.action = PATIENT_MOVE_ACTIONS.PLAN;
  } else {
    validationObject.locationId = yup
      .string()
      .nullable()
      .when('locationGroupId', {
        is: value => !!value,
        then: schema => schema.required(),
        otherwise: schema => schema.nullable(),
      });
  }

  if (isAdmittingToHospital) {
    validationObject.startTime = yup.string().required();
    validationObject.estimatedEndDate = yup.string().nullable();
    validationObject.patientBillingTypeId = yup.string().nullable();
    validationObject.dietIds = yup
      .array()
      .of(yup.string())
      .nullable();

    initialValues.startTime = getCurrentDateTimeString();
  }

  return { initialValues, validationSchema: yup.object().shape(validationObject) };
};

const EncounterTypeDisplay = ({ encounterType }) => (
  <EncounterTypeLabel $underlineColor={ENCOUNTER_OPTIONS_BY_VALUE[encounterType].color}>
    <TranslatedEnum enumValues={ENCOUNTER_TYPE_LABELS} value={encounterType} />
  </EncounterTypeLabel>
);

const EncounterTypeChangeDescription = ({ encounterType, newEncounterType }) => {
  return (
    <EncounterChangeDescription>
      <TranslatedText
        stringId="patient.encounter.modal.movePatient.action.changeEncounterType.prefix"
        fallback="Changing encounter type from"
      />{' '}
      <EncounterTypeDisplay encounterType={encounterType} />{' '}
      <TranslatedText stringId="general.to" fallback="to" />{' '}
      <EncounterTypeDisplay encounterType={newEncounterType} />
    </EncounterChangeDescription>
  );
};

const HospitalAdmissionFields = () => {
  return (
    <>
      <StyledFormSeparatorLine />
      <SectionHeading>
        <TranslatedText
          stringId="patient.encounter.modal.movePatient.section.encounterDetails.heading"
          fallback="Encounter details"
        />
      </SectionHeading>
      <SectionDescription>
        <TranslatedText
          stringId="patient.encounter.modal.movePatient.section.encounterDetails.description"
          fallback="Update hospital admission encounter details below."
        />
      </SectionDescription>
      <StyledFormGrid columns={2} data-testid="formgrid-wyqp">
        <Field
          name="startTime"
          component={DateTimeField}
          label={
            <TranslatedText
              stringId="patient.encounter.movePatient.admissionTime.label"
              fallback="Admission date & time"
            />
          }
          required
          data-testid="field-admission-time"
        />
        <Field
          name="estimatedEndDate"
          component={DateField}
          saveDateAsString
          label={
            <TranslatedText
              stringId="encounter.estimatedDischargeDate.label"
              fallback="Estimated discharge date"
            />
          }
          data-testid="field-discharge-date"
        />
        <LocalisedField
          name="patientBillingTypeId"
          label={
            <TranslatedText
              stringId="general.localisedField.patientBillingTypeId.label"
              fallback="Patient type"
              data-testid="translatedtext-67v8"
            />
          }
          endpoint="patientBillingType"
          component={SuggesterSelectField}
          data-testid="localisedfield-amji"
        />
        <div style={{ gridColumn: '1 / -1' }}>
          <LocalisedField
            name="dietIds"
            component={SuggesterSelectField}
            endpoint="diet"
            isMulti
            label={
              <TranslatedText stringId="patient.encounter.movePatient.diet.label" fallback="Diet" />
            }
            data-testid="field-diet"
          />
        </div>
      </StyledFormGrid>
    </>
  );
};

export const MoveModal = React.memo(({ open, onClose, encounter, newEncounterType }) => {
  const { getSetting } = useSettings();
  const { writeAndViewEncounter } = useEncounter();

  const clinicianSuggester = useSuggester('practitioner');
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });

  const enablePatientMoveActions = getSetting('features.patientPlannedMove');
  const isAdmittingToHospital = newEncounterType === ENCOUNTER_TYPES.ADMISSION;
  const onSubmit = async values => {
    const { locationId, plannedLocationId, action, ...rest } = values;
    delete rest.locationGroupId;

    const locationData = {};
    if (action === PATIENT_MOVE_ACTIONS.PLAN) {
      locationData.plannedLocationId = plannedLocationId || null; // null clears the planned move
    } else {
      const finalisedLocation = plannedLocationId || locationId;
      if (finalisedLocation) {
        locationData.locationId = finalisedLocation;
      }
    }

    const encounterTypeData = newEncounterType ? { encounterType: newEncounterType } : {};

    await writeAndViewEncounter(encounter.id, {
      submittedTime: getCurrentDateTimeString(),
      ...rest,
      ...locationData,
      ...encounterTypeData,
    });
  };

  const { initialValues, validationSchema } = getFormProps({
    encounter,
    enablePatientMoveActions,
    isAdmittingToHospital,
  });

  return (
    <FormModal
      title={
        newEncounterType ? (
          <EncounterChangeText newEncounterType={newEncounterType} />
        ) : (
          <TranslatedText
            stringId="patient.encounter.action.movePatient"
            fallback="Move patient"
            data-testid="translatedtext-o1ut"
          />
        )
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
            {newEncounterType && (
              <>
                <EncounterTypeChangeDescription
                  encounterType={encounter.encounterType}
                  newEncounterType={newEncounterType}
                />
                <StyledFormSeparatorLine />
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
            <StyledFormSeparatorLine />
            <SectionHeading>
              <TranslatedText
                stringId="patient.encounter.modal.movePatient.section.basic.heading"
                fallback="Move location"
              />
            </SectionHeading>
            {enablePatientMoveActions ? <PlannedMoveFields /> : <BasicMoveFields />}
            {isAdmittingToHospital && <HospitalAdmissionFields />}
            <ModalFormActionRow
              onConfirm={submitForm}
              confirmText={
                newEncounterType && <EncounterChangeText newEncounterType={newEncounterType} />
              }
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
