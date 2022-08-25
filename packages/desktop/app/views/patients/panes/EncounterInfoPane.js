import React from 'react';
import {
  Card,
  CardHeader,
  CardItem,
  CardBody,
  CardDivider,
  formatShort,
} from '../../../components';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../../../constants';
import { useReferenceData } from '../../../api/queries';

const getDepartmentName = ({ department }) => (department ? department.name : 'Unknown');
const getLocationName = ({ location }) => (location ? location.name : 'Unknown');
export const getEncounterType = ({ encounterType }) =>
  encounterType ? ENCOUNTER_OPTIONS_BY_VALUE[encounterType]?.label : 'Unknown';

export const EncounterInfoPane = React.memo(({ encounter }) => {
  const patientTypeData = useReferenceData(encounter.patientBillingTypeId);

  return (
    <Card>
      {encounter.plannedLocation && (
        <CardHeader>
          <CardItem label="Planned move" value={encounter.plannedLocation.name} />
        </CardHeader>
      )}
      <CardBody>
        <CardDivider />
        <CardItem label="Department" value={getDepartmentName(encounter)} />
        <CardItem label="Patient type" value={patientTypeData?.name} />
        <CardItem label="Location" value={getLocationName(encounter)} />
        <CardItem label="Encounter type" value={getEncounterType(encounter)} />
        {encounter.endDate && (
          <CardItem label="Discharge date" value={formatShort(encounter.endDate)} />
        )}
        <CardItem
          style={{ gridColumn: '1/-1' }}
          label="Reason for encounter"
          value={encounter.reasonForEncounter}
        />
      </CardBody>
    </Card>
  );
});
