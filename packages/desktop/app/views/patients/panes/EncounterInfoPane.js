import React from 'react';
import {
  DateInput,
  FormGrid,
  SelectInput,
  SuggesterSelectField,
  TextInput,
} from '../../../components';
import { encounterOptions } from '../../../constants';

const getDepartmentName = ({ department }) => (department ? department.name : 'Unknown');
const getLocationName = ({ location }) => (location ? location.name : 'Unknown');
const getExaminerName = ({ examiner }) => (examiner ? examiner.displayName : 'Unknown');

export const EncounterInfoPane = React.memo(({ disabled, encounter }) => (
  <FormGrid columns={3}>
    <DateInput disabled={disabled} value={encounter.startDate} label="Arrival date" />
    <DateInput disabled={disabled} value={encounter.endDate} label="Discharge date" />
    <SuggesterSelectField
      disabled
      label="Patient type"
      field={{ name: 'patientBillingTypeId', value: encounter.patientBillingTypeId }}
      endpoint="patientBillingType"
    />
    <TextInput disabled={disabled} value={getDepartmentName(encounter)} label="Department" />
    <SelectInput
      disabled={disabled}
      value={encounter.encounterType}
      label="Encounter type"
      options={encounterOptions}
    />
    <TextInput disabled={disabled} value={getExaminerName(encounter)} label="Doctor/Nurse" />
    <TextInput disabled={disabled} value={getLocationName(encounter)} label="Location" />
    {encounter.plannedLocation && (
      <TextInput
        disabled={disabled}
        value={encounter.plannedLocation.name}
        label="Planned location"
      />
    )}
    <TextInput
      disabled={disabled}
      value={encounter.reasonForEncounter}
      label="Reason for encounter"
      style={{ gridColumn: 'span 2' }}
    />
  </FormGrid>
));
