import React from 'react';
import { Card, CardHeader, CardItem, CardBody } from '../../../components';

const getDepartmentName = ({ department }) => (department ? department.name : 'Unknown');
const getLocationName = ({ location }) => (location ? location.name : 'Unknown');
const getExaminerName = ({ examiner }) => (examiner ? examiner.displayName : 'Unknown');

export const EncounterInfoPane = React.memo(({ encounter }) => (
  <Card>
    {encounter.plannedLocation && (
      <CardHeader>
        <CardItem label="Planned move" value={encounter.plannedLocation.name} />
      </CardHeader>
    )}
    <CardBody>
      <CardItem label="Department" value={getDepartmentName(encounter)} />
      <CardItem label="Patient type" value={encounter.patientBillingTypeId} />
      <CardItem label="Location" value={getLocationName(encounter)} />
      <CardItem label="Encounter type" value={encounter.encounterType} />
      <CardItem
        style={{ gridColumn: '1/-1' }}
        label="Reason for encounter"
        value={encounter.reasonForEncounter}
      />
    </CardBody>
  </Card>
));
//
// export const EncounterInfoPane = React.memo(({ disabled, encounter }) => (
//   <FormGrid columns={3}>
//     <DateInput disabled={disabled} value={encounter.startDate} label="Arrival date" />
//     <DateInput disabled={disabled} value={encounter.endDate} label="Discharge date" />
//     <SuggesterSelectField
//       disabled
//       label="Patient type"
//       field={{ name: 'patientBillingTypeId', value: encounter.patientBillingTypeId }}
//       endpoint="patientBillingType"
//     />
//     <TextInput disabled={disabled} value={getDepartmentName(encounter)} label="Department" />
//     <SelectInput
//       disabled={disabled}
//       value={encounter.encounterType}
//       label="Encounter type"
//       options={encounterOptions}
//     />
//     <TextInput disabled={disabled} value={getExaminerName(encounter)} label="Doctor/Nurse" />
//     <TextInput disabled={disabled} value={getLocationName(encounter)} label="Location" />
//     {encounter.plannedLocation && (
//       <TextInput
//         disabled={disabled}
//         value={encounter.plannedLocation.name}
//         label="Planned location"
//       />
//     )}
//     <TextInput
//       disabled={disabled}
//       value={encounter.reasonForEncounter}
//       label="Reason for encounter"
//       style={{ gridColumn: 'span 2' }}
//     />
//   </FormGrid>
// ));
