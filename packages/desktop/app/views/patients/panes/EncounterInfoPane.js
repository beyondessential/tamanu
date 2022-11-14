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
import { useLocalisation } from '../../../contexts/Localisation';
import { getFullLocationName } from '../../../utils/location';

const getDepartmentName = ({ department }) => (department ? department.name : 'Unknown');
const getReferralSource = ({ referralSource }) =>
  referralSource ? referralSource.name : 'Unknown';

export const getEncounterType = ({ encounterType }) =>
  encounterType ? ENCOUNTER_OPTIONS_BY_VALUE[encounterType]?.label : 'Unknown';

export const EncounterInfoPane = React.memo(({ encounter }) => {
  const { getLocalisation } = useLocalisation();
  const patientTypeData = useReferenceData(encounter.patientBillingTypeId);
  const referralSourcePath = 'fields.referralSourceId';

  return (
    <Card>
      {encounter.plannedLocation && (
        <CardHeader>
          <CardItem label="Planned move" value={getFullLocationName(encounter.plannedLocation)} />
        </CardHeader>
      )}
      <CardBody>
        <CardDivider />
        <CardItem label="Department" value={getDepartmentName(encounter)} />
        <CardItem label="Patient type" value={patientTypeData?.name} />
        <CardItem label="Location" value={getFullLocationName(encounter?.location)} />
        {!getLocalisation(`${referralSourcePath}.hidden`) && (
          <CardItem
            label={getLocalisation(`${referralSourcePath}.shortLabel`)}
            value={getReferralSource(encounter)}
          />
        )}
        <CardItem label="Encounter type" value={getEncounterType(encounter)} />
        {encounter.endDate && (
          <CardItem label="Discharge date" value={formatShort(encounter.endDate)} />
        )}
        <CardItem label="Reason for encounter" value={encounter.reasonForEncounter} />
      </CardBody>
    </Card>
  );
});
