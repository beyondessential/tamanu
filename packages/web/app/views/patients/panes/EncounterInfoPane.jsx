import React from 'react';
import { DateDisplay } from '../../../components';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../../../constants';
import { getFullLocationName } from '../../../utils/location';
import { InfoCard, InfoCardHeader, InfoCardItem } from '../../../components/InfoCard';
import { getDepartmentName } from '../../../utils/department';

const getReferralSource = ({ referralSource }) =>
  referralSource ? referralSource.name : 'Unknown';

export const getEncounterType = ({ encounterType }) =>
  encounterType ? ENCOUNTER_OPTIONS_BY_VALUE[encounterType]?.label : 'Unknown';

const referralSourcePath = 'localisation.fields.referralSourceId';

export const EncounterInfoPane = React.memo(({ encounter, getSetting, patientBillingType }) => (
  <InfoCard
    inlineValues
    headerContent={
      encounter.plannedLocation && (
        <InfoCardHeader
          label="Planned move"
          value={getFullLocationName(encounter.plannedLocation)}
        />
      )
    }
  >
    <InfoCardItem label="Department" value={getDepartmentName(encounter)} />
    <InfoCardItem label="Patient type" value={patientBillingType} />
    <InfoCardItem label="Location" value={getFullLocationName(encounter?.location)} />
    {!getSetting(`${referralSourcePath}.hidden`) && (
      <InfoCardItem
        label={getSetting(`${referralSourcePath}.shortLabel`)}
        value={getReferralSource(encounter)}
      />
    )}
    <InfoCardItem label="Encounter type" value={getEncounterType(encounter)} />
    {encounter.endDate && (
      <InfoCardItem label="Discharge date" value={DateDisplay.stringFormat(encounter.endDate)} />
    )}
    <InfoCardItem label="Reason for encounter" value={encounter.reasonForEncounter} />
  </InfoCard>
));
