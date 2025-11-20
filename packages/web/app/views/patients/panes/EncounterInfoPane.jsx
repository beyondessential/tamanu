import React from 'react';
import styled from 'styled-components';
import { differenceInMinutes, formatDuration, intervalToDuration, parseISO } from 'date-fns';
import { DateDisplay, TranslatedEnum } from '../../../components';
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
  dischargeDateIcon,
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
import { ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';

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
      data-testid="translatedreferencedata-oxsl"
    />
  ) : (
    '-'
  );

const getDiet = ({ diets }) => {
  if (!diets?.length) return '-';

  const dietsDisplay = (
    <DietCardValue data-testid="dietcardvalue-jzea">
      {' '}
      {diets.map((diet, index) => (
        <>
          {!!index && ', '}
          <TranslatedReferenceData
            category="diet"
            fallback={diet.name}
            value={diet.id}
            data-testid={`translatedreferencedata-g2vp-${diet.code}`}
          />
        </>
      ))}
    </DietCardValue>
  );
  return (
    <ThemedTooltip title={dietsDisplay} data-testid="themedtooltip-2ii0">
      {dietsDisplay}
    </ThemedTooltip>
  );
};

export const getEncounterType = ({ encounterType }) => (
  <TranslatedEnum enumValues={ENCOUNTER_TYPE_LABELS} value={encounterType} />
);

const referralSourcePath = 'referralSourceId';

const LengthOfStayText = styled.span`
  font-weight: 400;
  color: ${props => props.theme.palette.text.darkestText};
`;

const LengthOfStayDisplay = ({ startDate, endDate }) => {
  const parsedEndDate = endDate ? parseISO(endDate) : new Date();
  const parsedStartDate = parseISO(startDate);

  const duration = intervalToDuration({ start: parsedStartDate, end: parsedEndDate });
  const totalMinutes = differenceInMinutes(parsedEndDate, parsedStartDate);

  let formattedDuration;
  if (totalMinutes === 0) {
    formattedDuration = formatDuration(duration, { format: ['seconds'] });
  } else if (totalMinutes < 60) {
    formattedDuration = formatDuration(duration, { format: ['minutes'] });
  } else if (totalMinutes < 1440) {
    formattedDuration = formatDuration(duration, { format: ['hours'] });
  } else {
    formattedDuration = formatDuration(duration, { format: ['days'] });
  }

  if (!formattedDuration) return null;

  return (
    <LengthOfStayText>
      (<TranslatedText stringId="encounter.summary.lengthOfStay.label" fallback="LOS" />
      {' - '}
      {formattedDuration})
    </LengthOfStayText>
  );
};

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
              data-testid="translatedtext-g6p7"
            />
          }
          value={getFullLocationName(encounter.plannedLocation)}
          data-testid="infocardheader-xwcz"
        />
      )
    }
    data-testid="infocard-o4i8"
  >
    <InfoCardFirstColumn data-testid="infocardfirstcolumn-u3u3">
      <InfoCardItem
        label={
          <TranslatedText
            stringId="encounter.summary.encounterType.label"
            fallback="Encounter type"
            data-testid="translatedtext-zxo7"
          />
        }
        value={getEncounterType(encounter)}
        icon={encounterTypeIcon}
        data-testid="infocarditem-us9s"
      />
      <InfoCardItem
        label={
          <TranslatedText
            stringId="general.department.label"
            fallback="Department"
            data-testid="translatedtext-0lrt"
          />
        }
        value={getDepartmentName(encounter)}
        icon={departmentIcon}
        data-testid="infocarditem-in64"
      />
      {isEmergencyPatient(encounter.encounterType) && (
        <InfoCardItem
          label={
            <TranslatedText
              stringId="encounter.summary.triageScore.label"
              fallback="Triage score"
              data-testid="translatedtext-l4wd"
            />
          }
          value={encounter.triages?.[0]?.score || '—'}
          icon={triageScoreIcon}
          data-testid="infocarditem-p5t5"
        />
      )}
      {!isEmergencyPatient(encounter.encounterType) && (
        <InfoCardItem
          label={
            <TranslatedText
              stringId="encounter.summary.patientType.label"
              fallback="Patient type"
              data-testid="translatedtext-vk46"
            />
          }
          value={patientBillingType}
          icon={patientTypeIcon}
          data-testid="infocarditem-3svu"
        />
      )}
      {isInpatient(encounter?.encounterType) && (
        <InfoCardItem
          label={
            <TranslatedText
              stringId="encounter.summary.diet.label"
              fallback="Diet"
              data-testid="translatedtext-49f7"
            />
          }
          value={getDiet(encounter)}
          icon={dietIcon}
          data-testid="infocarditem-m5lp"
        />
      )}
      <InfoCardItem
        label={
          <TranslatedText
            stringId="general.location.label"
            fallback="Location"
            data-testid="translatedtext-iwqn"
          />
        }
        value={getFullLocationName(encounter?.location)}
        icon={locationIcon}
        data-testid="infocarditem-82xq"
      />
    </InfoCardFirstColumn>
    <InfoCardSecondColumn data-testid="infocardsecondcolumn-oh1m">
      <InfoCardItem
        label={
          <TranslatedText
            stringId="encounter.admissionDate.label"
            fallback="Admission date"
            data-testid="translatedtext-i6p7"
          />
        }
        value={
          <>
            <DateDisplay date={encounter.startDate} data-testid="datedisplay-fa08" />{' '}
            {isInpatient(encounter?.encounterType) && (
              <LengthOfStayDisplay startDate={encounter.startDate} endDate={encounter.endDate} />
            )}
          </>
        }
        icon={arrivalDateIcon}
        data-testid="infocarditem-18xs"
      />
      {encounter.endDate && (
        <InfoCardItem
          label={
            <TranslatedText
              stringId="encounter.summary.dischargeDate.label"
              fallback="Discharge date"
              data-testid="translatedtext-btml"
            />
          }
          value={DateDisplay.stringFormat(encounter.endDate)}
          icon={dischargeDateIcon}
          data-testid="infocarditem-w2sg"
        />
      )}
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
                  data-testid="translatedtext-fktj"
                />
              ),
            }}
            data-testid="translatedtext-ok8u"
          />
        }
        value={encounter.examiner?.displayName || 'Unknown'}
        icon={supervisingClinicianIcon}
        data-testid="infocarditem-fmd5"
      />
      {!getSetting(`${referralSourcePath}.hidden`) &&
        !isEmergencyPatient(encounter.encounterType) && (
          <InfoCardItem
            label={
              <TranslatedText
                stringId="general.localisedField.referralSourceId.label"
                fallback="Referral source"
                data-testid="translatedtext-cwip"
              />
            }
            value={getReferralSource(encounter)}
            icon={referralSourceIcon}
            data-testid="infocarditem-n7q6"
          />
        )}
      <InfoCardItem
        label={
          <TranslatedText
            stringId="encounter.reasonForEncounter.label"
            fallback="Reason for encounter"
            data-testid="translatedtext-3602"
          />
        }
        value={encounter.reasonForEncounter}
        icon={reasonForEncounterIcon}
        $whiteSpace="normal"
        data-testid="infocarditem-axjq"
      />
    </InfoCardSecondColumn>
  </InfoCard>
));
