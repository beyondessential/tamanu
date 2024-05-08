import React from 'react';
import styled from 'styled-components';
import { DateDisplay } from '../../../components';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../../../constants';
import { getFullLocationName } from '../../../utils/location';
import { InfoCard, InfoCardHeader, InfoCardItem } from '../../../components/InfoCard';
import { getDepartmentName } from '../../../utils/department';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import {
  arrivalDateIcon,
  departmentIcon,
  dietIcon,
  encounterTypeIcon,
  locationIcon,
  patientTypeIcon,
  reasonForEncounterIcon,
  referralSourceIcon,
  supervisingClinicianIcon,
} from '../../../constants/images';
import { isInpatient } from '../../../utils/isInpatient';

const CardLabel = styled.span`
  margin-right: 5px;
  font-weight: 400;
  color: ${props => props.theme.palette.text.secondary};
`;

const CardValue = styled(CardLabel)`
  font-weight: 500;
  color: ${props => props.theme.palette.text.primary};
`;

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
      contentPadding={25}
      paddingTop={0}
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
        label={
          <TranslatedText
            stringId="encounter.summary.encounterType.label"
            fallback="Encounter type"
          />
        }
        value={getEncounterType(encounter)}
        icon={encounterTypeIcon}
      />
      <InfoCardItem
        label={<TranslatedText stringId="encounter.arrivalDate.label" fallback="Arrival date" />}
        value={<>
          <DateDisplay date={encounter.startDate} />
          {encounter.endDate && (
            <>
              <CardLabel>
                {" - "}
                <TranslatedText
                  stringId="encounter.summary.dischargeDate.label"
                  fallback="Discharge date"
                />
              </CardLabel>
              <CardValue>
                {DateDisplay.stringFormat(encounter.endDate)}
              </CardValue>
            </>
          )}
        </>}
        icon={arrivalDateIcon}
      />
      <InfoCardItem
        label={<TranslatedText stringId="general.department.label" fallback="Department" />}
        value={getDepartmentName(encounter)}
        icon={departmentIcon}
      />
      <InfoCardItem
        label={
          <TranslatedText
            stringId="general.supervisingClinician.label"
            fallback="Supervising clinician"
          />
        }
        value={encounter.examiner?.displayName || 'Unknown'}
        icon={supervisingClinicianIcon}
      />
      <InfoCardItem
        label={
          <TranslatedText stringId="encounter.summary.patientType.label" fallback="Patient type" />
        }
        value={patientBillingType}
        icon={patientTypeIcon}
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
          icon={referralSourceIcon}
        />
      )}
      {isInpatient(encounter?.encounterType) && <InfoCardItem
        label={
          <TranslatedText
            stringId="encounter.summary.diet.label"
            fallback="Diet"
          />
        }
        value={getDiet(encounter)}
        icon={dietIcon}
      />}
      <InfoCardItem
        label={
          <TranslatedText
            stringId="encounter.summary.reason.label"
            fallback="Reason for encounter"
          />
        }
        value={encounter.reasonForEncounter}
        icon={reasonForEncounterIcon}
      />
      <InfoCardItem
        label={<TranslatedText stringId="general.location.label" fallback="Location" />}
        value={getFullLocationName(encounter?.location)}
        icon={locationIcon}
      />
    </InfoCard>
  ),
);
