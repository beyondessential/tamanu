import React from 'react';
import styled from 'styled-components';
import { DateDisplay } from '../../../components';
import { ENCOUNTER_OPTIONS_BY_VALUE } from '../../../constants';
import { getFullLocationName } from '../../../utils/location';
import {
  EncounterInfoCard as InfoCard,
  EncounterInfoCardHeader as InfoCardHeader,
  EncounterInfoCardItem as InfoCardItem,
} from '../../../components/EncounterInfoCard';
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
  triageScoreIcon,
} from '../../../constants/images';
import { isInpatient } from '../../../utils/isInpatient';
import { isEmergencyPatient } from '../../../utils/isEmergencyPatient';
import { TranslatedReferenceData } from '../../../components/Translation/index.js';
import { ThemedTooltip } from '../../../components/Tooltip.jsx';

const CardLabel = styled.span`
  margin-right: 5px;
  font-weight: 400;
  color: ${props => props.theme.palette.text.secondary};
`;

const CardValue = styled(CardLabel)`
  font-weight: 500;
  color: ${props => props.theme.palette.text.primary};
`;

const InfoCardFirstColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 40%;
`;

const InfoCardSecondColumn = styled(InfoCardFirstColumn)`
  width: 60%;
`;

const DietCardValue = styled.div`
  max-width: calc(100% - 28px);
  overflow: hidden;
  text-overflow: ellipsis;
`;

const getReferralSource = ({ referralSource }) =>
  referralSource ? (
    <TranslatedReferenceData
      category="referralSource"
      fallback={referralSource.name}
      value={referralSource.id}
      data-test-id='translatedreferencedata-9mph' />
  ) : (
    <TranslatedText
      stringId="general.fallback.unknown"
      fallback="Unknown"
      data-test-id='translatedtext-oj9i' />
  );

const getDiet = ({ diets }) => {
  if (!diets?.length) return '-';

  const dietsDisplay = (
    <DietCardValue>
      {' '}
      {diets.map((diet, index) => (
        <>
          {!!index && ', '}
          <TranslatedReferenceData
            category="diet"
            fallback={diet.name}
            value={diet.id}
            data-test-id='translatedreferencedata-121n' />
        </>
      ))}
    </DietCardValue>
  );
  return <ThemedTooltip title={dietsDisplay}>{dietsDisplay}</ThemedTooltip>;
};

export const getEncounterType = ({ encounterType }) =>
  encounterType ? ENCOUNTER_OPTIONS_BY_VALUE[encounterType]?.label : 'Unknown';

const referralSourcePath = 'referralSourceId';

export const EncounterInfoPane = React.memo(({ encounter, getSetting, patientBillingType }) => (
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
              data-test-id='translatedtext-gzsj' />
          }
          value={getFullLocationName(encounter.plannedLocation)}
        />
      )
    }
  >
    <InfoCardFirstColumn>
      <InfoCardItem
        label={
          <TranslatedText
            stringId="encounter.summary.encounterType.label"
            fallback="Encounter type"
            data-test-id='translatedtext-6rzc' />
        }
        value={getEncounterType(encounter)}
        icon={encounterTypeIcon}
      />
      <InfoCardItem
        label={<TranslatedText
          stringId="general.department.label"
          fallback="Department"
          data-test-id='translatedtext-bzn2' />}
        value={getDepartmentName(encounter)}
        icon={departmentIcon}
      />
      {isEmergencyPatient(encounter.encounterType) && (
        <InfoCardItem
          label={
            <TranslatedText
              stringId="encounter.summary.triageScore.label"
              fallback="Triage score"
              data-test-id='translatedtext-rxrm' />
          }
          value={encounter.triages?.[0]?.score || '—'}
          icon={triageScoreIcon}
        />
      )}
      {!isEmergencyPatient(encounter.encounterType) && (
        <InfoCardItem
          label={
            <TranslatedText
              stringId="encounter.summary.patientType.label"
              fallback="Patient type"
              data-test-id='translatedtext-0o52' />
          }
          value={patientBillingType}
          icon={patientTypeIcon}
        />
      )}
      {isInpatient(encounter?.encounterType) && (
        <InfoCardItem
          label={<TranslatedText
            stringId="encounter.summary.diet.label"
            fallback="Diet"
            data-test-id='translatedtext-8p18' />}
          value={getDiet(encounter)}
          icon={dietIcon}
        />
      )}
      <InfoCardItem
        label={<TranslatedText
          stringId="general.location.label"
          fallback="Location"
          data-test-id='translatedtext-i51y' />}
        value={getFullLocationName(encounter?.location)}
        icon={locationIcon}
      />
    </InfoCardFirstColumn>
    <InfoCardSecondColumn>
      <InfoCardItem
        label={<TranslatedText
          stringId="encounter.arrivalDate.label"
          fallback="Arrival date"
          data-test-id='translatedtext-xch1' />}
        value={
          <>
            <DateDisplay date={encounter.startDate} data-test-id='datedisplay-0uky' />
            {encounter.endDate && (
              <>
                <CardLabel>
                  {' – '}
                  <TranslatedText
                    stringId="encounter.summary.dischargeDate.label"
                    fallback="Discharge date"
                    data-test-id='translatedtext-4vho' />
                  {':'}
                </CardLabel>
                <CardValue>{DateDisplay.stringFormat(encounter.endDate)}</CardValue>
              </>
            )}
          </>
        }
        icon={arrivalDateIcon}
      />
      <InfoCardItem
        label={
          <TranslatedText
            stringId="general.supervisingClinician.label"
            fallback="Supervising :clinician"
            replacements={{
              clinician: (
                <TranslatedText
                  stringId="general.localisedField.clinician.label.short"
                  fallback="Clinician"
                  casing="lower"
                  data-test-id='translatedtext-snb9' />
              ),
            }}
            data-test-id='translatedtext-9y4w' />
        }
        value={encounter.examiner?.displayName || 'Unknown'}
        icon={supervisingClinicianIcon}
      />
      {!getSetting(`${referralSourcePath}.hidden`) &&
        !isEmergencyPatient(encounter.encounterType) && (
          <InfoCardItem
            label={
              <TranslatedText
                stringId="general.localisedField.referralSourceId.label"
                fallback="Referral source"
                data-test-id='translatedtext-62u2' />
            }
            value={getReferralSource(encounter)}
            icon={referralSourceIcon}
          />
        )}
      <InfoCardItem
        label={
          <TranslatedText
            stringId="encounter.reasonForEncounter.label"
            fallback="Reason for encounter"
            data-test-id='translatedtext-sxqq' />
        }
        value={encounter.reasonForEncounter}
        icon={reasonForEncounterIcon}
        $whiteSpace="normal"
      />
    </InfoCardSecondColumn>
  </InfoCard>
));
