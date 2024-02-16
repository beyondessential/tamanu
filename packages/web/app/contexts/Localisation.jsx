import React, { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { get } from 'lodash';

const overrides = {
  fields: {
    "countryName": {
      "shortLabel": "Country",
      "longLabel": "Country",
      "hidden": false
    },
    "emergencyContactName": {
      "shortLabel": "Emergency contact name",
      "longLabel": "Guardian's name",
      "requiredPatientData": false
    },
    "emergencyContactNumber": {
      "shortLabel": "Emergency contact number",
      "longLabel": "Guardian's number",
      "requiredPatientData": false
    },
    "markedForSync": {
      "shortLabel": "Sync",
      "longLabel": "Marked for sync"
    },
    "displayId": {
      "shortLabel": "NHN",
      "longLabel": "National Health Number",
      "pattern": "[\\s\\S]*"
    },
    "firstName": {
      "shortLabel": "First name",
      "longLabel": "First name",
      "requiredPatientData": false
    },
    "middleName": {
      "shortLabel": "Middle name",
      "longLabel": "Middle name",
      "hidden": false,
      "requiredPatientData": false
    },
    "lastName": {
      "shortLabel": "Last name",
      "longLabel": "Last name",
      "requiredPatientData": false
    },
    "culturalName": {
      "shortLabel": "Cultural name",
      "longLabel": "Mother's first name",
      "hidden": false,
      "requiredPatientData": false
    },
    "sex": {
      "shortLabel": "Sex",
      "longLabel": "Sex",
      "hidden": false,
      "requiredPatientData": false
    },
    "email": {
      "shortLabel": "Email",
      "longLabel": "Email",
      "hidden": false,
      "requiredPatientData": false
    },
    "dateOfBirth": {
      "shortLabel": "DOB",
      "longLabel": "Date of birth",
      "requiredPatientData": false
    },
    "dateOfBirthFrom": {
      "shortLabel": "DOB from",
      "longLabel": "Date of birth from"
    },
    "dateOfBirthTo": {
      "shortLabel": "DOB to",
      "longLabel": "Date of birth to"
    },
    "dateOfBirthExact": {
      "shortLabel": "DOB exact",
      "longLabel": "Date of birth exact"
    },
    "dateOfDeath": {
      "shortLabel": "Death",
      "longLabel": "Date of death"
    },
    "bloodType": {
      "shortLabel": "Blood type",
      "longLabel": "Blood type",
      "hidden": false,
      "requiredPatientData": false
    },
    "title": {
      "shortLabel": "Title",
      "longLabel": "Title",
      "hidden": false,
      "requiredPatientData": false
    },
    "placeOfBirth": {
      "shortLabel": "Birth location",
      "longLabel": "Birth location",
      "hidden": false,
      "requiredPatientData": false
    },
    "countryOfBirthId": {
      "shortLabel": "Country of birth",
      "longLabel": "Country of birth",
      "hidden": false,
      "requiredPatientData": false
    },
    "maritalStatus": {
      "shortLabel": "Marital status",
      "longLabel": "Marital status",
      "hidden": false,
      "requiredPatientData": false
    },
    "primaryContactNumber": {
      "shortLabel": "Primary contact number",
      "longLabel": "Mother's contact number",
      "hidden": false,
      "requiredPatientData": false
    },
    "secondaryContactNumber": {
      "shortLabel": "Secondary contact number",
      "longLabel": "Father's contact number",
      "hidden": false,
      "requiredPatientData": false
    },
    "socialMedia": {
      "shortLabel": "Social media",
      "longLabel": "Social media",
      "hidden": false,
      "requiredPatientData": false
    },
    "settlementId": {
      "shortLabel": "Settlement",
      "longLabel": "Commune",
      "hidden": false,
      "requiredPatientData": false
    },
    "streetVillage": {
      "shortLabel": "Street no. & name",
      "longLabel": "Street no. & name",
      "hidden": false,
      "requiredPatientData": false
    },
    "cityTown": {
      "shortLabel": "City/town",
      "longLabel": "City/town",
      "hidden": false,
      "requiredPatientData": false
    },
    "subdivisionId": {
      "shortLabel": "District",
      "longLabel": "District",
      "hidden": false,
      "requiredPatientData": false
    },
    "divisionId": {
      "shortLabel": "Division",
      "longLabel": "Province",
      "hidden": false,
      "requiredPatientData": false
    },
    "countryId": {
      "shortLabel": "Country",
      "longLabel": "Country",
      "hidden": false,
      "requiredPatientData": false
    },
    "medicalAreaId": {
      "shortLabel": "Medical area",
      "longLabel": "Operational district",
      "hidden": false,
      "requiredPatientData": false
    },
    "nursingZoneId": {
      "shortLabel": "Nursing zone",
      "longLabel": "Health center",
      "hidden": false,
      "requiredPatientData": false
    },
    "nationalityId": {
      "shortLabel": "Nationality",
      "longLabel": "Nationality",
      "hidden": false,
      "requiredPatientData": false
    },
    "ethnicityId": {
      "shortLabel": "Ethnicity",
      "longLabel": "Ethnicity",
      "hidden": false,
      "requiredPatientData": false
    },
    "occupationId": {
      "shortLabel": "Occupation",
      "longLabel": "Occupation",
      "hidden": false,
      "requiredPatientData": false
    },
    "educationalLevel": {
      "shortLabel": "Educational attainment",
      "longLabel": "Educational attainment",
      "hidden": false,
      "requiredPatientData": false
    },
    "villageName": {
      "shortLabel": "Village",
      "longLabel": "Village",
      "hidden": false
    },
    "villageId": {
      "shortLabel": "Village",
      "longLabel": "Village",
      "hidden": false
    },
    "birthCertificate": {
      "shortLabel": "Birth certificate",
      "longLabel": "Birth certificate number",
      "hidden": false,
      "requiredPatientData": false
    },
    "drivingLicense": {
      "shortLabel": "Driving license",
      "longLabel": "Driving license number",
      "hidden": false,
      "requiredPatientData": false
    },
    "passport": {
      "shortLabel": "Passport",
      "longLabel": "Passport number",
      "hidden": false,
      "requiredPatientData": false
    },
    "religionId": {
      "shortLabel": "Religion",
      "longLabel": "Religion",
      "hidden": false,
      "requiredPatientData": false
    },
    "patientBillingTypeId": {
      "shortLabel": "Type",
      "longLabel": "Patient type",
      "hidden": false,
      "requiredPatientData": false
    },
    "ageRange": {
      "shortLabel": "Age range",
      "longLabel": "Age range"
    },
    "age": {
      "shortLabel": "Age",
      "longLabel": "Age"
    },
    "motherId": {
      "shortLabel": "Mother",
      "longLabel": "Mother",
      "hidden": false,
      "requiredPatientData": false
    },
    "fatherId": {
      "shortLabel": "Father",
      "longLabel": "Father",
      "hidden": false,
      "requiredPatientData": false
    },
    "birthWeight": {
      "shortLabel": "Birth weight (kg)",
      "longLabel": "Birth weight (kg)",
      "hidden": false,
      "requiredPatientData": false
    },
    "birthLength": {
      "shortLabel": "Birth length (cm)",
      "longLabel": "Birth length (cm)",
      "hidden": false,
      "requiredPatientData": false
    },
    "birthDeliveryType": {
      "shortLabel": "Delivery type",
      "longLabel": "Delivery type",
      "hidden": false,
      "requiredPatientData": false
    },
    "gestationalAgeEstimate": {
      "shortLabel": "Gestational age (weeks)",
      "longLabel": "Gestational age (weeks)",
      "hidden": false,
      "requiredPatientData": false
    },
    "apgarScoreOneMinute": {
      "shortLabel": "Apgar score at 1 min",
      "longLabel": "Apgar score at 1 min",
      "hidden": false,
      "requiredPatientData": false
    },
    "apgarScoreFiveMinutes": {
      "shortLabel": "Apgar score at 5 min",
      "longLabel": "Apgar score at 5 min",
      "hidden": false,
      "requiredPatientData": false
    },
    "apgarScoreTenMinutes": {
      "shortLabel": "Apgar score at 10 min",
      "longLabel": "Apgar score at 10 min",
      "hidden": false,
      "requiredPatientData": false
    },
    "timeOfBirth": {
      "shortLabel": "Time of birth",
      "longLabel": "Time of birth",
      "hidden": false,
      "requiredPatientData": false
    },
    "attendantAtBirth": {
      "shortLabel": "Attendant at birth",
      "longLabel": "Attendant at birth",
      "hidden": false,
      "requiredPatientData": false
    },
    "nameOfAttendantAtBirth": {
      "shortLabel": "Name of attendant",
      "longLabel": "Name of attendant",
      "hidden": false,
      "requiredPatientData": false
    },
    "birthType": {
      "shortLabel": "Single/Plural birth",
      "longLabel": "Single/Plural birth",
      "hidden": false,
      "requiredPatientData": false
    },
    "birthFacilityId": {
      "shortLabel": "Name of health facility (if applicable)",
      "longLabel": "Name of health facility (if applicable)",
      "hidden": false,
      "requiredPatientData": false
    },
    "registeredBirthPlace": {
      "shortLabel": "Place of birth",
      "longLabel": "Place of birth",
      "hidden": false,
      "requiredPatientData": false
    },
    "referralSourceId": {
      "shortLabel": "Referral source",
      "longLabel": "Referral source",
      "hidden": false
    },
    "arrivalModeId": {
      "shortLabel": "Arrival mode",
      "longLabel": "Arrival mode",
      "hidden": false
    },
    "prescriber": {
      "shortLabel": "Prescriber",
      "longLabel": "Prescriber",
      "hidden": false
    },
    "prescriberId": {
      "shortLabel": "Prescriber ID",
      "longLabel": "Prescriber ID",
      "hidden": false
    },
    "facility": {
      "shortLabel": "Facility",
      "longLabel": "Facility",
      "hidden": false
    },
    "locationId": {
      "shortLabel": "Location",
      "longLabel": "Location"
    },
    "locationGroupId": {
      "shortLabel": "Area",
      "longLabel": "Area"
    },
    "dischargeDisposition": {
      "shortLabel": "Discharge disposition",
      "longLabel": "Discharge disposition",
      "hidden": true
    },
    "clinician": {
      "shortLabel": "Clinician",
      "longLabel": "Clinician"
    },
    "diagnosis": {
      "shortLabel": "Diagnosis",
      "longLabel": "Diagnosis"
    },
    "userDisplayId": {
      "shortLabel": "Registration number",
      "longLabel": "Registration number"
    }
  }
}; // add keys to this object to help with development

const LocalisationContext = React.createContext({
  getLocalisation: () => {},
});

export const useLocalisation = () => useContext(LocalisationContext);

export const LocalisationProvider = ({ children }) => {
  const [localisation, setLocalisation] = useState({});
  const reduxLocalisation = useSelector(state => state.auth.localisation);

  useEffect(() => {
    setLocalisation({ ...reduxLocalisation, ...overrides });
  }, [reduxLocalisation]);

  return (
    <LocalisationContext.Provider
      value={{
        getLocalisation: path => get(localisation, path),
      }}
    >
      {children}
    </LocalisationContext.Provider>
  );
};
