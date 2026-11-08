import React from 'react';
import * as yup from 'yup';
import { isEqual } from 'es-toolkit/compat';

import {
  BIRTH_DELIVERY_TYPES,
  BIRTH_TYPES,
  PATIENT_REGISTRY_TYPES,
  PLACE_OF_BIRTH_TYPES,
  SEX_VALUES,
} from '@tamanu/constants';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { yupAttemptTransformToNumber } from '../utils';
import { isSlidingFeeScaleFieldShown } from '../utils/slidingFeeScale';

const requiredWhenConfiguredMandatory = (getSetting, getTranslation, name, baseType) => {
  return baseType.when([], {
    is: () => !!getSetting(`fields.${name}.requiredPatientData`),
    then: baseType.required(getTranslation('validation.required.inline', '*Required')),
    otherwise: baseType,
  });
};

const requiredBirthFieldWhenConfiguredMandatory = (
  getSetting,
  getTranslation,
  patientRegistryType,
  name,
  baseType,
  fallbackLabel,
) =>
  baseType.when([], {
    is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY,
    then: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      name,
      baseType,
      fallbackLabel,
    ),
    otherwise: baseType,
  });

export const getPatientDetailsValidation = (
  patientRegistryType,
  getSetting,
  getTranslation,
  { insurancePlansInUse = [], slidingFeeScalePlanId = null } = {},
) => {
  // Family size and annual income only answer the sliding fee scale, so they are required exactly
  // when that plan is selected. The plan is matched by id, resolved from the code the deployment
  // names in its settings, so neither the plan's name nor its translation is load-bearing.
  const isSlidingFeeScaleSelected = planIds =>
    Boolean(slidingFeeScalePlanId) && (planIds || []).includes(slidingFeeScalePlanId);

  // A deployment that hides a field is not collecting it, so requiring it would make the patient
  // unsavable with no field to answer. Visibility and the requirement have to agree.
  const isShown = field => isSlidingFeeScaleFieldShown(getSetting, field);

  const slidingFeeScaleField = (field, stringId, fallback, message, dependsOn, isRequired) => {
    const labelled = schema =>
      schema.translatedLabel(<TranslatedText stringId={stringId} fallback={fallback} />);
    return yup.string().when(dependsOn, {
      is: (...args) => isShown(field) && isRequired(...args),
      then: schema => labelled(schema).required(message),
      otherwise: schema =>
        requiredWhenConfiguredMandatory(
          getSetting,
          getTranslation,
          field,
          labelled(schema),
          fallback,
        ),
    });
  };

  const patientDetailsValidationSchema = yup.object().shape({
    firstName: yup
      .string()
      .required()
      .translatedLabel(
        <TranslatedText stringId="general.localisedField.firstName.label" fallback="First name" />,
      ),
    middleName: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'middleName',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.middleName.label"
            fallback="Middle name"
          />,
        ),
      'Middle name',
    ),
    lastName: yup
      .string()
      .required()
      .translatedLabel(
        <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />,
      ),
    culturalName: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'culturalName',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.culturalName.label"
            fallback="Cultural/traditional name"
          />,
        ),
      'Cultural name',
    ),
    dateOfBirth: yup
      .date()
      .required()
      .translatedLabel(
        <TranslatedText
          stringId="general.localisedField.dateOfBirth.label"
          fallback="Date of birth"
        />,
      ),
    sex: yup
      .string()
      .oneOf(
        Object.values(SEX_VALUES).filter(value =>
          getSetting('features.hideOtherSex') === true ? value !== SEX_VALUES.OTHER : true,
        ),
      )
      .required()
      .translatedLabel(
        <TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />,
      ),
    email: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'email',
      yup
        .string()
        .email()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.email.label" fallback="Email address" />,
        ),
      'Email',
    ),

    /* --- PATIENT BIRTH FIELDS START --- */
    birthFacilityId: yup.string().when('registeredBirthPlace', {
      is: value => value === PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY,
      then: requiredBirthFieldWhenConfiguredMandatory(
        getSetting,
        getTranslation,
        patientRegistryType,
        'birthFacilityId',
        yup
          .string()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.birthFacilityId.label"
              fallback="Name of health facility (if applicable)"
            />,
          ),
        'Name of health facility (if applicable)',
      ),
      otherwise: yup.string(),
    }),

    attendantAtBirth: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      patientRegistryType,
      'attendantAtBirth',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.attendantAtBirth.label"
            fallback="Attendant at birth"
          />,
        ),
      'Attendant at birth',
    ),
    nameOfAttendantAtBirth: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      patientRegistryType,
      'nameOfAttendantAtBirth',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.nameOfAttendantAtBirth.label"
            fallback="Name of attendant"
          />,
        ),
      'Name of attendant',
    ),
    birthWeight: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      patientRegistryType,
      'birthWeight',
      yup
        .number()
        .min(0)
        .max(6)
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.birthWeight.label"
            fallback="Birth weight (kg)"
          />,
        ),
      'Birth weight (kg)',
    ),
    birthLength: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      patientRegistryType,
      'birthLength',
      yup
        .number()
        .min(0)
        .max(100)
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.birthLength.label"
            fallback="Birth length (cm)"
          />,
        ),
      'Birth length (cm)',
    ),
    birthDeliveryType: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      patientRegistryType,
      'birthDeliveryType',
      yup
        .string()
        .oneOf(Object.values(BIRTH_DELIVERY_TYPES))
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.birthDeliveryType.label"
            fallback="Delivery type"
          />,
        ),
      'Delivery type',
    ),
    gestationalAgeEstimate: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      patientRegistryType,
      'gestationalAgeEstimate',
      yup
        .number()
        .min(1)
        .max(45)
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.gestationalAgeEstimate.label"
            fallback="Gestational age (weeks)"
          />,
        ),
      'Gestational age (weeks)',
    ),
    apgarScoreOneMinute: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      patientRegistryType,
      'apgarScoreOneMinute',
      yup
        .number()
        .min(1)
        .max(10)
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.apgarScoreOneMinute.label"
            fallback="Apgar score at 1 min"
          />,
        ),
      'Apgar score at 1 min',
    ),
    apgarScoreFiveMinutes: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      patientRegistryType,
      'apgarScoreFiveMinutes',
      yup
        .number()
        .min(1)
        .max(10)
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.apgarScoreFiveMinute.label"
            fallback="Apgar score at 5 min"
          />,
        ),
      'Apgar score at 5 min',
    ),
    apgarScoreTenMinutes: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      patientRegistryType,
      'apgarScoreTenMinutes',
      yup
        .number()
        .min(1)
        .max(10)
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.apgarScoreTenMinute.label"
            fallback="Apgar score at 10 min"
          />,
        ),
      'Apgar score at 10 min',
    ),
    birthType: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      patientRegistryType,
      'birthType',
      yup
        .string()
        .oneOf(Object.values(BIRTH_TYPES))
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.birthType.label"
            fallback="Single/Plural birth"
          />,
        ),
      'Single/Plural birth',
    ),
    birthOrder: yup.number().when('birthType', {
      is: value => value === BIRTH_TYPES.PLURAL,
      then: requiredBirthFieldWhenConfiguredMandatory(
        getSetting,
        getTranslation,
        patientRegistryType,
        'birthOrder',
        yup.number().min(1).max(10).translatedLabel(
          <TranslatedText
            stringId="general.localisedField.birthOrder.label"
            fallback="Birth order"
          />,
        ),
        'Birth order',
      ),
      otherwise: yup.number().min(1).max(10),
    }),
    timeOfBirth: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      patientRegistryType,
      'timeOfBirth',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.timeOfBirth.label"
            fallback="Time of birth"
          />,
        ),
      'Time of birth',
    ),
    registeredBirthPlace: requiredBirthFieldWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      patientRegistryType,
      'registeredBirthPlace',
      yup
        .string()
        .oneOf(Object.values(PLACE_OF_BIRTH_TYPES))
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.registeredBirthPlace.label"
            fallback="Place of birth"
          />,
        ),
      'Place of birth',
    ),
    /* --- PATIENT BIRTH FIELDS END--- */

    religionId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'religionId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.religionId.label" fallback="Religion" />,
        ),
      'Religion',
    ),
    birthCertificate: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'birthCertificate',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.birthCertificate.label"
            fallback="Birth certificate"
          />,
        ),
      'Birth certificate',
    ),
    insurerPolicyNumber: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'insurerPolicyNumber',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.insurerPolicyNumber.label"
            fallback="Insurance policy number"
          />,
        ),
      'Insurance policy number',
    ),
    passport: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'passport',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.passport.label.short"
            fallback="Passport"
          />,
        ),
      'Passport',
    ),
    primaryContactNumber: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'primaryContactNumber',
      yup
        .number()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.primaryContactNumber.label"
            fallback="Primary contact number"
          />,
        )
        .transform(yupAttemptTransformToNumber),
      'Primary contact number',
    ),
    secondaryContactNumber: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'secondaryContactNumber',
      yup
        .number()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.secondaryContactNumber.label"
            fallback="Secondary contact number"
          />,
        )
        .transform(yupAttemptTransformToNumber),
      'Secondary contact number',
    ),
    emergencyContactName: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'emergencyContactName',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.emergencyContactName.label"
            fallback="Emergency contact name"
          />,
        ),
      'Emergency contact name',
    ),
    emergencyContactNumber: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'emergencyContactNumber',
      yup
        .number()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.emergencyContactNumber.label"
            fallback="Emergency contact number"
          />,
        )
        .transform(yupAttemptTransformToNumber),
      'Emergency contact number',
    ),
    title: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'title',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.title.label" fallback="Title" />,
        ),
    ),
    bloodType: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'bloodType',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.bloodType.label"
            fallback="Blood type"
          />,
        ),
      'Blood type',
    ),
    placeOfBirth: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'placeOfBirth',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.placeOfBirth.label"
            fallback="Birth location"
          />,
        ),
      'Birth location',
    ),
    countryOfBirthId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'countryOfBirthId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.countryOfBirthId.label"
            fallback="Country of birth"
          />,
        ),
      'Country of birth',
    ),
    nationalityId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'nationalityId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.nationalityId.label"
            fallback="Nationality"
          />,
        ),
      'Nationality',
    ),
    ethnicityId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'ethnicityId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.ethnicityId.label"
            fallback="Ethnicity"
          />,
        ),
      'Ethnicity',
    ),
    patientBillingTypeId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'patientBillingTypeId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.patientBillingTypeId.label.short"
            fallback="Type"
          />,
        ),
      'Type',
    ),
    motherId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'motherId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.motherId.label" fallback="Mother" />,
        ),
      'Mother',
    ),
    fatherId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'fatherId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.father.label" fallback="Father" />,
        ),
      'Father',
    ),
    subdivisionId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'subdivisionId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.subdivisionId.label"
            fallback="Sub division"
          />,
        ),
      'Sub division',
    ),
    divisionId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'divisionId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.divisionId.label" fallback="Division" />,
        ),
      'Division',
    ),
    countryId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'countryId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.countryId.label" fallback="Country" />,
        ),
      'Country',
    ),
    settlementId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'settlementId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.settlementId.label"
            fallback="Settlement"
          />,
        ),
      'Settlement',
    ),
    medicalAreaId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'medicalAreaId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.medicalAreaId.label"
            fallback="Medical area"
          />,
        ),
      'Medical area',
    ),
    nursingZoneId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'nursingZoneId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.nursingZoneId.label"
            fallback="Nursing zone"
          />,
        ),
      'Nursing zone',
    ),
    streetVillage: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'streetVillage',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.streetVillage.label"
            fallback="Residential landmark"
          />,
        ),
      'Residential landmark',
    ),
    villageId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'villageId',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />,
        ),
      'Village',
    ),
    cityTown: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'cityTown',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.cityTown.label" fallback="City/town" />,
        ),
      'City/town',
    ),
    healthCenterId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'healthCenterId',
      yup.string(),
      'Health center',
    ),
    drivingLicense: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(
        getSetting,
        getTranslation,
        'drivingLicense',
        yup
          .string()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.drivingLicense.label"
              fallback="Driving license"
            />,
          ),
        'Driving license',
      ),
      otherwise: yup.string(),
    }),
    maritalStatus: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(
        getSetting,
        getTranslation,
        'maritalStatus',
        yup
          .string()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.maritalStatus.label"
              fallback="Marital status"
            />,
          ),
        'Marital status',
      ),
      otherwise: yup.string(),
    }),
    occupationId: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(
        getSetting,
        getTranslation,
        'occupationId',
        yup
          .string()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.occupationId.label"
              fallback="Occupation"
            />,
          ),
        'Occupation',
      ),
      otherwise: yup.string(),
    }),
    educationalLevel: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(
        getSetting,
        getTranslation,
        'educationalLevel',
        yup
          .string()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.educationalLevel.label"
              fallback="Educational attainment"
            />,
          ),
        'Educational attainment',
      ),
      otherwise: yup.string(),
    }),
    socialMedia: yup.string().when({
      is: () => patientRegistryType === PATIENT_REGISTRY_TYPES.NEW_PATIENT,
      then: requiredWhenConfiguredMandatory(
        getSetting,
        getTranslation,
        'socialMedia',
        yup
          .string()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.socialMedia.label"
              fallback="Social media"
            />,
          ),
        'Social media',
      ),
      otherwise: yup.string(),
    }),
    invoiceInsurancePlanId: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'invoiceInsurancePlanId',
      yup
        .array()
        .of(yup.string())
        .test(
          'insurance-plan-not-in-use',
          '',
          function testInsurancePlanNotInUse(value) {
            if (!insurancePlansInUse?.length) {
              return true;
            }

            const currentPlanIds = value || [];
            const removedInUsePlans = insurancePlansInUse.filter(
              plan => !currentPlanIds.includes(plan.invoiceInsurancePlanId),
            );
            if (removedInUsePlans.length === 0) {
              return true;
            }
            const planNames = removedInUsePlans.map(plan => plan.name).join(', ');
            const message = removedInUsePlans.length > 1
              ? getTranslation(
                  'patient.validation.insurancePlansInUse',
                  ':planNames have been added to one or more in-progress invoices. Please remove the insurance plans from the invoices first.',
                )
              : getTranslation(
                  'patient.validation.insurancePlanInUse',
                  ':planNames has been added to one or more in-progress invoices. Please remove the insurance plan from the invoices first.',
                );
            return this.createError({
              message: message.replace(':planNames', planNames),
            });
          },
        ),
      'Insurance plan',
    ),
    adoptionNumber: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'adoptionNumber',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.adoptionNumber.label"
            fallback="Adoption number"
          />,
        ),
      'Adoption number',
    ),
    marriageLicence: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'marriageLicence',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.marriageLicence.label"
            fallback="Marriage licence"
          />,
        ),
      'Marriage licence',
    ),
    familySize: slidingFeeScaleField(
      'familySize',
      'general.localisedField.familySize.label',
      'Family size',
      getTranslation(
        'patient.validation.familySizeRequiredForSlidingFeeScale',
        'Family size is required for sliding fee scale',
      ),
      'invoiceInsurancePlanId',
      isSlidingFeeScaleSelected,
    ),
    // The income bands belong to a family size, so annual income cannot be answered — and is
    // disabled on the form — until one is chosen. Asking for it before then would put a message
    // on a field the user cannot yet fill in, so the two are asked for in turn.
    annualIncome: slidingFeeScaleField(
      'annualIncome',
      'general.localisedField.annualIncome.label',
      'Annual income',
      getTranslation(
        'patient.validation.annualIncomeRequiredForSlidingFeeScale',
        'Annual income is required for sliding fee scale',
      ),
      ['invoiceInsurancePlanId', 'familySize'],
      (planIds, familySize) => isSlidingFeeScaleSelected(planIds) && Boolean(familySize),
    ),
    payor1Id: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'payor1Id',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.payor1Id.label" fallback="Payor 1" />,
        ),
      'Payor 1',
    ),
    payor1ReferenceNumber: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'payor1ReferenceNumber',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.payor1ReferenceNumber.label"
            fallback="Payor 1 reference number"
          />,
        ),
      'Payor 1 reference number',
    ),
    payor2Id: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'payor2Id',
      yup
        .string()
        .translatedLabel(
          <TranslatedText stringId="general.localisedField.payor2Id.label" fallback="Payor 2" />,
        ),
      'Payor 2',
    ),
    payor2ReferenceNumber: requiredWhenConfiguredMandatory(
      getSetting,
      getTranslation,
      'payor2ReferenceNumber',
      yup
        .string()
        .translatedLabel(
          <TranslatedText
            stringId="general.localisedField.payor2ReferenceNumber.label"
            fallback="Payor 2 reference number"
          />,
        ),
      'Payor 2 reference number',
    ),
  });

  const validatedProperties = Object.keys(patientDetailsValidationSchema.describe().fields);
  const localisedFields = getSetting('fields');
  const localisedPatientFields = Object.keys(localisedFields).filter(fieldName =>
    Object.prototype.hasOwnProperty.call(localisedFields[fieldName], 'requiredPatientData'),
  );

  // Validate if any localised patient fields are missing schema validation,
  // so that we don't miss mandatory validation for any patient fields
  if (!isEqual(validatedProperties.sort(), localisedPatientFields.sort())) {
    const differences = localisedPatientFields.filter(item => !validatedProperties.includes(item));

    throw new Error(
      `Missing schema validation for these following localised patient fields: ${differences.toString()}`,
    );
  }

  return patientDetailsValidationSchema;
};
