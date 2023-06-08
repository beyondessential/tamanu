import React from 'react';
import { formatShort } from '../../../components';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../../../constants';
import { getFullLocationName } from '../../../utils/location';
import { InfoCard, InfoCardItem, InfoCardHeader } from '../../../components/InfoCard';

const getDepartmentName = ({ department }) => (department ? department.name : 'Unknown');
const getReferralSource = ({ referralSource }) =>
  referralSource ? referralSource.name : 'Unknown';

export const getEncounterType = ({ encounterType }) =>
  encounterType ? ENCOUNTER_OPTIONS_BY_VALUE[encounterType]?.label : 'Unknown';

const referralSourcePath = 'fields.referralSourceId';

export const EncounterInfoPane = React.memo(
  ({ encounter, getLocalisation, patientBillingType }) => (
    <InfoCard inlineValues>
      {encounter.plannedLocation && (
        <InfoCardHeader>
          <InfoCardItem
            label="Planned move"
            value={getFullLocationName(encounter.plannedLocation)}
          />
        </InfoCardHeader>
      )}
      <InfoCardItem label="Department" value={getDepartmentName(encounter)} />
      <InfoCardItem label="Patient type" value={patientBillingType} />
      <InfoCardItem label="Location" value={getFullLocationName(encounter?.location)} />
      {!getLocalisation(`${referralSourcePath}.hidden`) && (
        <InfoCardItem
          label={getLocalisation(`${referralSourcePath}.shortLabel`)}
          value={getReferralSource(encounter)}
        />
      )}
      <InfoCardItem label="Encounter type" value={getEncounterType(encounter)} />
      {encounter.endDate && (
        <InfoCardItem label="Discharge date" value={formatShort(encounter.endDate)} />
      )}
      <InfoCardItem label="Reason for encounter" value={encounter.reasonForEncounter} />
    </InfoCard>
  ),
);
