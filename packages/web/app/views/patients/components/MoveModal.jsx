import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { Button, DateTimeField, Form, FormGrid, TAMANU_COLORS } from '@tamanu/ui-components';
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

const EncounterChangeDescription = styled(LargeBodyText)`
  margin-top: 5px;
  margin-bottom: 20px;
`;

// Reusable section component
const FormSection = ({ heading, description, children, showSeparator = false }) => (
  <>
    {showSeparator && <FormSeparatorLine />}
    {heading && (
      <SectionHeading>
        <TranslatedText {...heading} />
      </SectionHeading>
    )}
    {description && (
      <SectionDescription>
        {typeof description === 'object' && !React.isValidElement(description) ? (
          <TranslatedText {...description} />
        ) : (
          description
        )}
      </SectionDescription>
    )}
    {children}
  </>
);

// Helper to render fields from configuration
const renderFields = fields => {
  return fields.map((fieldConfig, index) => {
    const {
      name,
      component,
      label,
      suggester,
      endpoint,
      isMulti,
      required,
      dataTestId,
      ...rest
    } = fieldConfig;
    const FieldComponent = endpoint ? LocalisedField : Field;

    return (
      <FieldComponent
        key={name || index}
        name={name}
        component={component}
        suggester={suggester}
        endpoint={endpoint}
        isMulti={isMulti}
        label={label && <TranslatedText {...label} />}
        required={required}
        data-testid={dataTestId}
        {...rest}
      />
    );
  });
};

const BasicMoveFields = () => {
  const fields = [
    {
      name: 'locationId',
      component: LocalisedLocationField,
      label: {
        stringId: 'patient.encounter.movePatient.location.label',
        fallback: 'New location',
        'data-testid': 'translatedtext-35a6',
      },
      required: true,
      dataTestId: 'field-tykg',
    },
  ];

  return (
    <>
      <SectionDescription>
        <TranslatedText
          stringId="patient.encounter.movePatient.location.description"
          fallback="Select new patient location."
        />
      </SectionDescription>
      <StyledFormGrid columns={2} data-testid="formgrid-wyqp">
        {renderFields(fields)}
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

  const actionOptions = [
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

  return (
    <>
      <SectionDescription>{description}</SectionDescription>
      <StyledFormGrid columns={2} data-testid="formgrid-wyqp">
        <Field
          name="plannedLocationId"
          component={LocalisedLocationField}
          required
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
            options={actionOptions}
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

const TypeChangeText = ({ newEncounterType }) => {
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
        newEncounterType: (
          <TranslatedEnum enumValues={ENCOUNTER_TYPE_LABELS} value={newEncounterType} />
        ),
      }}
    />
  );
};

const EncounterTypeChangeDescription = ({ encounterType, newEncounterType }) => {
  return (
    <EncounterChangeDescription>
      <TranslatedText
        stringId="patient.encounter.modal.movePatient.action.changeEncounterType"
        fallback="Changing encounter type from :encounterType to :newEncounterType"
        replacements={{
          encounterType: (
            <TranslatedEnum enumValues={ENCOUNTER_TYPE_LABELS} value={encounterType} />
          ),
          newEncounterType: (
            <TranslatedEnum enumValues={ENCOUNTER_TYPE_LABELS} value={newEncounterType} />
          ),
        }}
      />
    </EncounterChangeDescription>
  );
};

const HospitalAdmissionFields = () => {
  const fields = [
    {
      name: 'admissionTime',
      component: DateTimeField,
      label: {
        stringId: 'patient.encounter.movePatient.admissionTime.label',
        fallback: 'Admission date & time',
      },
      required: true,
      dataTestId: 'field-admission-time',
    },
    {
      name: 'patientBillingTypeId',
      endpoint: 'patientBillingType',
      component: SuggesterSelectField,
      label: {
        stringId: 'general.localisedField.patientBillingTypeId.label',
        fallback: 'Patient type',
        'data-testid': 'translatedtext-67v8',
      },
      dataTestId: 'localisedfield-amji',
    },
    {
      name: 'dietIds',
      endpoint: 'diet',
      component: SuggesterSelectField,
      isMulti: true,
      label: {
        stringId: 'patient.encounter.movePatient.diet.label',
        fallback: 'Diet',
      },
      dataTestId: 'field-diet',
      wrapperStyle: { gridColumn: '1 / -1' },
    },
  ];

  return (
    <FormSection
      showSeparator
      heading={{
        stringId: 'patient.encounter.modal.movePatient.section.encounterDetails.heading',
        fallback: 'Encounter details',
      }}
      description={{
        stringId: 'patient.encounter.modal.movePatient.section.encounterDetails.description',
        fallback: 'Update hospital admission encounter details below.',
      }}
    >
      <StyledFormGrid columns={2} data-testid="formgrid-wyqp">
        {fields.map((fieldConfig, index) => {
          const {
            wrapperStyle,
            name,
            component,
            suggester,
            endpoint,
            isMulti,
            label,
            required,
            dataTestId,
          } = fieldConfig;
          const FieldComponent = endpoint ? LocalisedField : Field;
          const field = (
            <FieldComponent
              key={name || index}
              name={name}
              component={component}
              suggester={suggester}
              endpoint={endpoint}
              isMulti={isMulti}
              label={label && <TranslatedText {...label} />}
              required={required}
              data-testid={dataTestId}
            />
          );
          return wrapperStyle ? (
            <div key={name || index} style={wrapperStyle}>
              {field}
            </div>
          ) : (
            field
          );
        })}
      </StyledFormGrid>
    </FormSection>
  );
};

export const MoveModal = React.memo(({ open, onClose, encounter, newEncounterType }) => {
  const { getSetting } = useSettings();
  const { writeAndViewEncounter } = useEncounter();

  const clinicianSuggester = useSuggester('practitioner');
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });

  const enablePlannedPatientMove = getSetting('features.patientPlannedMove');
  const isAdmittingToHospital = newEncounterType === ENCOUNTER_TYPES.ADMISSION;

  const onSubmit = async values => {
    const { locationId, plannedLocationId, action, ...rest } = values;

    const locationData =
      enablePlannedPatientMove && action === PATIENT_MOVE_ACTIONS.PLAN
        ? { plannedLocationId: plannedLocationId || null } // Null clears the planned move
        : { locationId: plannedLocationId || locationId };

    const encounterTypeData = newEncounterType ? { encounterType: newEncounterType } : {};

    await writeAndViewEncounter(encounter.id, {
      submittedTime: getCurrentDateTimeString(),
      ...rest,
      ...locationData,
      ...encounterTypeData,
    });
  };

  const validationObject = {
    examinerId: yup.string().required(),
    departmentId: yup.string().required(),
  };

  const initialValues = {
    examinerId: encounter.examinerId,
    departmentId: encounter.departmentId,
  };

  if (enablePlannedPatientMove) {
    validationObject.plannedLocationId = yup.string().nullable();
    validationObject.action = yup
      .string()
      .oneOf([PATIENT_MOVE_ACTIONS.PLAN, PATIENT_MOVE_ACTIONS.FINALISE])
      .nullable();

    initialValues.plannedLocationId = encounter.plannedLocationId;
  }

  if (isAdmittingToHospital) {
    validationObject.admissionTime = yup.date().required();
    validationObject.patientBillingTypeId = yup.string().nullable();
    validationObject.dietIds = yup.mixed().nullable();

    initialValues.admissionTime = new Date();
  }

  return (
    <FormModal
      title={
        newEncounterType ? (
          <TypeChangeText newEncounterType={newEncounterType} />
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
        validationSchema={yup.object().shape(validationObject)}
        render={({ submitForm }) => {
          const patientCareFields = [
            {
              name: 'examinerId',
              component: DynamicSelectField,
              suggester: clinicianSuggester,
              label: {
                stringId: 'patient.encounter.movePatient.supervisingClinician.label',
                fallback: 'Supervising clinician',
              },
              required: true,
              dataTestId: 'field-tykg',
            },
            {
              name: 'departmentId',
              component: DynamicSelectField,
              suggester: departmentSuggester,
              label: {
                stringId: 'patient.encounter.movePatient.department.label',
                fallback: 'Department',
              },
              required: true,
              dataTestId: 'field-tykg',
            },
          ];

          return (
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
              <FormSection
                heading={{
                  stringId: 'patient.encounter.modal.movePatient.section.move.heading',
                  fallback: 'Patient care',
                }}
                description={{
                  stringId: 'patient.encounter.modal.movePatient.section.move.description',
                  fallback: 'Please select the clinician and department for the patient.',
                }}
              >
                <StyledFormGrid columns={2} data-testid="formgrid-wyqp">
                  {renderFields(patientCareFields)}
                </StyledFormGrid>
              </FormSection>
              <FormSeparatorLine />
              <FormSection
                heading={{
                  stringId: 'patient.encounter.modal.movePatient.section.basic.heading',
                  fallback: 'Move location',
                }}
              >
                {enablePlannedPatientMove ? <PlannedMoveFields /> : <BasicMoveFields />}
              </FormSection>
              {isAdmittingToHospital && <HospitalAdmissionFields />}
              <ModalFormActionRow
                onConfirm={submitForm}
                confirmText={
                  newEncounterType && <TypeChangeText newEncounterType={newEncounterType} />
                }
                onCancel={onClose}
                data-testid="modalformactionrow-35ou"
              />
            </>
          );
        }}
        data-testid="form-0lgu"
      />
    </FormModal>
  );
});
