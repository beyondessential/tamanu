import React from 'react';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { DateDisplay } from '../../../components';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../../../constants';
import { getFullLocationName } from '../../../utils/location';
import { InfoCard, InfoCardHeader, InfoCardItem } from '../../../components/InfoCard';
import { getDepartmentName } from '../../../utils/department';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { isDietEnabled } from '../../../forms/EncounterForm';

const getReferralSource = ({ referralSource }) =>
  referralSource ? referralSource.name : 'Unknown';

const getDiet = ({ diet }) =>
  diet ? diet.name : '-';

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
        label={<TranslatedText stringId="general.department.label" fallback="Department" />}
        value={getDepartmentName(encounter)}
      />
      <InfoCardItem
        label={
          <TranslatedText stringId="encounter.summary.patientType.label" fallback="Patient type" />
        }
        value={patientBillingType}
      />
      <InfoCardItem
        label={<TranslatedText stringId="general.location.label" fallback="Location" />}
        value={getFullLocationName(encounter?.location)}
      />
      {!getLocalisation(`${referralSourcePath}.hidden`) && (
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
      <InfoCardItem
        label={
          <TranslatedText
            stringId="encounter.summary.encounterType.label"
            fallback="Encounter type"
          />
        }
        value={getEncounterType(encounter)}
      />
      {encounter.endDate && (
        <InfoCardItem
          label={
            <TranslatedText
              stringId="encounter.summary.dischargeDate.label"
              fallback="Discharge date"
            />
          }
          value={DateDisplay.stringFormat(encounter.endDate)}
        />
      )}
      {/* TODO: Integrate with the new UI design */}
      {isDietEnabled(encounter?.encounterType) && <InfoCardItem
        label={
          <TranslatedText
            stringId="encounter.summary.diet.label"
            fallback="Diet"
          />
        }
        value={getDiet(encounter)}
      />}
      <InfoCardItem
        label={
          <TranslatedText
            stringId="encounter.summary.reason.label"
            fallback="Reason for encounter"
          />
        }
        value={encounter.reasonForEncounter}
      />
    </InfoCard>
  ),
);
