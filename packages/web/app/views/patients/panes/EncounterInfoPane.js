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

const referralSourcePath = 'fields.referralSourceId';

export const EncounterInfoPane = React.memo(
  ({ encounter, getLocalisation, patientBillingType }) => (
    <InfoCard
      inlineValues
      headerContent={
        encounter.plannedLocation && (
          <InfoCardHeader
            label={
              <TranslatedText
                stringId="patient.encounter.details.card.plannedMove.label"
                fallback="Planned move"
              />
            }
            value={getFullLocationName(encounter.plannedLocation)}
          />
        )
      }
    >
      <InfoCardItem
        label={<TranslatedText stringId="general.card.department.label" fallback="Department" />}
        value={getDepartmentName(encounter)}
      />
      <InfoCardItem
        label={
          <TranslatedText
            stringId="patient.encounter.details.card.patientType.label"
            fallback="Patient type"
          />
        }
        value={patientBillingType}
      />
      <InfoCardItem
        label={<TranslatedText stringId="general.card.location.label" fallback="Location" />}
        value={getFullLocationName(encounter?.location)}
      />
      {!getLocalisation(`${referralSourcePath}.hidden`) && (
        <InfoCardItem
          label={getLocalisation(`${referralSourcePath}.shortLabel`)}
          value={getReferralSource(encounter)}
        />
      )}
      <InfoCardItem
        label={
          <TranslatedText
            stringId="patient.encounter.details.card.encounterType.label"
            fallback="Encounter type"
          />
        }
        value={getEncounterType(encounter)}
      />
      {encounter.endDate && (
        <InfoCardItem
          label={
            <TranslatedText
              stringId="patient.encounter.details.card.dischargeDate.label"
              fallback="Discharge date"
            />
          }
          value={DateDisplay.stringFormat(encounter.endDate)}
        />
      )}
      <InfoCardItem
        label={
          <TranslatedText
            stringId="patient.encounter.details.card.encounterReason.label"
            fallback="Reason for encounter"
          />
        }
        value={encounter.reasonForEncounter}
      />
    </InfoCard>
  ),
);
