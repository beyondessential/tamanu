import React, { useState } from 'react';
import styled from 'styled-components';
import {
  DateDisplay,
  FormModal,
  ModalFormActionRow,
  TextButton,
  TranslatedEnum,
} from '../../../components';
import { differenceInMinutes, formatDuration, intervalToDuration, parseISO } from 'date-fns';
import { getFullLocationName } from '../../../utils/location';
import {
  EncounterInfoCard as InfoCard,
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
import { ENCOUNTER_TYPE_LABELS, FORM_TYPES } from '@tamanu/constants';
import { DateField, Field, Form, TAMANU_COLORS } from '@tamanu/ui-components';
import { useEncounter } from '../../../contexts/Encounter.jsx';
import { getEncounterStartDateLabel } from '../../../utils/getEncounterStartDateLabel.jsx';
import { PlusIcon } from '../../../assets/icons/PlusIcon';
import { useAuth } from '../../../contexts/Auth';

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

const AddButton = styled(TextButton)`
  color: ${TAMANU_COLORS.darkestText};
  font-size: 14px;
  line-height: 18px;
`;

const AddButtonText = styled.span`
  text-decoration: underline;
  margin-left: 4px;
`;

const StyledModalFormActionRow = styled(ModalFormActionRow)`
  margin-top: 20px;
`;

const DischargeDateFieldContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const StyledField = styled(Field)`
  width: 350px;
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
    <TranslatedText
      stringId="general.fallback.unknown"
      fallback="Unknown"
      data-testid="translatedtext-k3sk"
    />
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

const SetDischargeDateModal = ({ encounter, open, onClose }) => {
  const { writeAndViewEncounter } = useEncounter();
  return (
    <FormModal
      title={
        <TranslatedText
          stringId="encounter.modal.addEstimatedDischargeDate.title"
          fallback="Add estimated discharge date"
        />
      }
      open={open}
      onClose={onClose}
    >
      <Form
        formType={FORM_TYPES.EDIT_FORM}
        onSubmit={async ({ estimatedEndDate }) =>
          writeAndViewEncounter(encounter.id, { estimatedEndDate })
        }
        render={({ submitForm }) => (
          <>
            <DischargeDateFieldContainer>
              <StyledField
                name="estimatedEndDate"
                label={
                  <TranslatedText
                    stringId="encounter.estimatedDischargeDate.label"
                    fallback="Estimated discharge date"
                  />
                }
                component={DateField}
                saveDateAsString
              />
            </DischargeDateFieldContainer>
            <StyledModalFormActionRow onCancel={onClose} onConfirm={submitForm} />
          </>
        )}
      />
    </FormModal>
  );
};

export const getEncounterType = ({ encounterType }) => (
  <TranslatedEnum enumValues={ENCOUNTER_TYPE_LABELS} value={encounterType} />
);

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

export const EncounterInfoPane = React.memo(({ encounter, getSetting, patientBillingType }) => {
  const { ability } = useAuth();
  const [isEstimatedDischargeModalOpen, setIsEstimatedDischargeModalOpen] = useState(false);
  const canWriteEncounter = ability.can('write', 'Encounter');

  return (
    <InfoCard inlineValues contentPadding={25} paddingTop={0} data-testid="infocard-o4i8">
      <InfoCardFirstColumn data-testid="infocardfirstcolumn-u3u3">
        <InfoCardItem
          label={
            <TranslatedText
              stringId="encounter.summary.encounterType.label"
              fallback="Encounter type"
              data-testid="translatedtext-zxo7"
            />
          }
          value={
            <TranslatedEnum enumValues={ENCOUNTER_TYPE_LABELS} value={encounter.encounterType} />
          }
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
          label={getEncounterStartDateLabel(encounter.encounterType)}
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
        {isInpatient(encounter.encounterType) && (
          <InfoCardItem
            label={
              <TranslatedText
                stringId="encounter.summary.estimatedDischargeDate.label"
                fallback="Estimated discharge date"
                data-testid="translatedtext-49f7"
              />
            }
            value={
              encounter.estimatedEndDate ? (
                <DateDisplay date={encounter.estimatedEndDate} data-testid="datedisplay-fa08" />
              ) : (
                canWriteEncounter && (
                  <>
                    <AddButton onClick={() => setIsEstimatedDischargeModalOpen(true)}>
                      <PlusIcon fill={TAMANU_COLORS.darkestText} />
                      <AddButtonText>
                        <TranslatedText
                          stringId="encounter.summary.addEstimatedDischargeDate"
                          fallback="Add"
                        />
                      </AddButtonText>
                    </AddButton>
                    <SetDischargeDateModal
                      open={isEstimatedDischargeModalOpen}
                      onClose={() => setIsEstimatedDischargeModalOpen(false)}
                      encounter={encounter}
                    />
                  </>
                )
              )
            }
            icon={dischargeDateIcon}
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
        {!getSetting(`referralSourceId.hidden`) && !isEmergencyPatient(encounter.encounterType) && (
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
  );
});
