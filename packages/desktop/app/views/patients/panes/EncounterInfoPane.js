import React from 'react';
import { DateDisplay } from '../../../components';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../../../constants';
import { getFullLocationName } from '../../../utils/location';
import { InfoCard, InfoCardItem, InfoCardHeader } from '../../../components/InfoCard';
import { getDepartmentName } from '../../../utils/department';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const getReferralSource = ({ referralSource }) =>
  referralSource ? referralSource.name : 'Unknown';

export const getEncounterType = ({ encounterType }) =>
  encounterType ? ENCOUNTER_OPTIONS_BY_VALUE[encounterType]?.label : 'Unknown';

export const EncounterInfoPane = React.memo(
  ({ encounter, getLocalisation, patientBillingType }) => (
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
      {!getLocalisation(`fields.referralSourceId.hidden`) && (
        <InfoCardItem
          label={
            <TranslatedText
              stringId="general.localisedField.referralSourceId.label"
              fallback="Referral source"
            />
          }
          value={getReferralSource(encounter)}
        />
      )}
      <InfoCardItem label="Encounter type" value={getEncounterType(encounter)} />
      {encounter.endDate && (
        <InfoCardItem label="Discharge date" value={DateDisplay.stringFormat(encounter.endDate)} />
      )}
      <InfoCardItem label="Reason for encounter" value={encounter.reasonForEncounter} />
    </InfoCard>
  ),
);
