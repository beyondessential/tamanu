import { PriorityHigh as HighPriorityIcon } from '@material-ui/icons';
import Overnight from '@mui/icons-material/Brightness2';
import { styled } from '@mui/material/styles';
import React from 'react';
import { Link, generatePath } from 'react-router-dom';

import { Colors } from '../../../constants';
import { PATIENT_PATHS, PATIENT_CATEGORIES } from '../../../constants/patientPaths';
import { formatDateTimeRange } from '../../../utils/dateTime';
import { TranslatedReferenceData, TranslatedText, TranslatedEnum } from '../../Translation';
import { ThemedTooltip } from '../../Tooltip';
import { getDateDisplay } from '../../DateDisplay';
import { ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';
import { DetailsDisplay } from './SharedComponents';

const AppointmentDetailsContainer = styled('div')`
  border-block: max(0.0625rem, 1px) solid ${Colors.outline};
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
`;

const Tag = styled('div')`
  display: flex;
  flex-direction: row;
  gap: 0.125rem;
  inset-block-end: 0.75rem;
  inset-inline-end: 0.75rem;
  position: absolute;
`;

const TruncatedText = styled('div')`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
`;

const TooltipContainer = styled('div')`
  max-width: 200px;
`;

const EncounterLink = styled(Link)`
  color: ${Colors.primary};
  text-decoration: none;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const ClinicianContainer = styled('div')`
  display: flex;
  justify-content: space-between;
`;

const ProcedureTypes = ({ appointmentProcedureTypes }) => {
  return appointmentProcedureTypes.length > 0 ? appointmentProcedureTypes.map((appointmentProcedureType, index) => (
    <span key={appointmentProcedureType.id}>
      <TranslatedReferenceData
        value={appointmentProcedureType.procedureType.id}
        fallback={appointmentProcedureType.procedureType.name}
        category="procedureType"
        data-testid={`tooltip-translatedreferencedata-${index}`}
      />
      {index < appointmentProcedureTypes.length - 1 && ', '}
    </span>
  )) : <>&mdash;</>;
};

const LinkedEncounter = ({ encounter }) => {
  if (!encounter) return <>&mdash;</>;
  
  const encounterPath = generatePath(PATIENT_PATHS.ENCOUNTER, {
    category: PATIENT_CATEGORIES.ALL,
    patientId: encounter.patientId,
    encounterId: encounter.id,
  });
  
  const formattedDate = getDateDisplay(encounter.startDate, {
    showDate: true,
    showTime: false,
  });
  
  return (
    <EncounterLink to={encounterPath}>
      <ThemedTooltip title={
        <TooltipContainer>
          {formattedDate} | <TranslatedEnum value={encounter.encounterType} enumValues={ENCOUNTER_TYPE_LABELS} /> | <TranslatedReferenceData value={encounter.location?.facility?.id} fallback={encounter.location?.facility?.name} category="facility" />
        </TooltipContainer>
      }>
      <TruncatedText> 
      {formattedDate} | <TranslatedEnum value={encounter.encounterType} enumValues={ENCOUNTER_TYPE_LABELS} /> | <TranslatedReferenceData value={encounter.location?.facility?.id} fallback={encounter.location?.facility?.name} category="facility" />
      </TruncatedText>
      </ThemedTooltip>
    </EncounterLink>
  );
};

const AdditionalClinician = ({ additionalClinician }) => {
  return (
    <div style={{ maxWidth: '8rem' }}>
      <DetailsDisplay
        label={
          <TranslatedText
            stringId="appointment.additionalClinician.label"
            fallback="Additional Clinician"
            data-testid="translatedtext-additionalClinician"
          />
        }
        value={
          <TooltipContainer>
            <ThemedTooltip title={additionalClinician?.displayName}>
              <TruncatedText>
                {additionalClinician?.displayName || <>&mdash;</>}
              </TruncatedText>
            </ThemedTooltip>
          </TooltipContainer>
        }
        data-testid="detailsdisplay-additionalClinician"
      />
    </div>
  );
};

const LocationBookingDetails = ({ location, locationGroup, bookingType, isOvernight, appointmentProcedureTypes, encounter }) => {
  return (
    <>
      {location && (
        <DetailsDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.locationId.label"
              fallback="Location"
              data-testid="translatedtext-ic34"
            />
          }
          value={
            <div>
              {(location?.locationGroup?.name || locationGroup?.name) && (
                <span>
                  <TranslatedReferenceData
                    fallback={location?.locationGroup?.name || locationGroup?.name}
                    value={location?.locationGroup?.id || locationGroup?.id}
                    category="locationGroup"
                    data-testid="translatedreferencedata-area"
                  />
                  {', '}
                </span>
              )}
              <TranslatedReferenceData
                fallback={location?.name}
                value={location?.id}
                category="location"
                data-testid="translatedreferencedata-505o"
              />
            </div>
          }
          data-testid="detailsdisplay-zzp3"
        />
      )}
      {bookingType && (
        <DetailsDisplay
          label={
            <TranslatedText
              stringId="scheduling.bookingType.label"
              fallback="Booking type"
              data-testid="translatedtext-p3sl"
            />
          }
          value={
            <TranslatedReferenceData
              value={bookingType.id}
              fallback={bookingType.name}
              category="bookingType"
              data-testid="translatedreferencedata-phvh"
            />
          }
          data-testid="detailsdisplay-lr0i"
        />
      )}
      <DetailsDisplay
        label={
          <TranslatedText
            stringId="appointment.procedureType.label"
            fallback="Procedure type"
            data-testid="translatedtext-v4x2"
          />
        }
        value={
          <ThemedTooltip 
            title={
              <TooltipContainer>
                <ProcedureTypes appointmentProcedureTypes={appointmentProcedureTypes} />
              </TooltipContainer>
            }
            data-testid="procedure-types-tooltip"
          >
            <TruncatedText>
              <ProcedureTypes appointmentProcedureTypes={appointmentProcedureTypes} />
            </TruncatedText>
          </ThemedTooltip>
        }
        data-testid="detailsdisplay-ll5z"
      />
      <DetailsDisplay
        label={
          <TranslatedText
            stringId="appointment.encounter.label"
            fallback="Related Encounter"
            data-testid="translatedtext-encounter"
          />
        }
        value={<LinkedEncounter encounter={encounter} />}
        data-testid="detailsdisplay-encounter"
      />
      {isOvernight && (
        <Tag data-testid="tag-j3j7">
          <Overnight
            aria-hidden
            htmlColor={Colors.primary}
            sx={{ fontSize: 15 }}
            data-testid="overnight-ginj"
          />
          <TranslatedText
            stringId="scheduling.bookingType.overnight"
            fallback="Overnight"
            data-testid="translatedtext-0ddf"
          />
        </Tag>
      )}
    </>
  );
};

const AppointmentTypeDetails = ({ appointmentType, isHighPriority }) => {
  return (
    <>
      {appointmentType && (
        <DetailsDisplay
          label={
            <TranslatedText
              stringId="appointment.appointmentType.label.short"
              fallback="Appt type"
              data-testid="translatedtext-v4x2"
            />
          }
          value={
            <TranslatedReferenceData
              value={appointmentType.id}
              fallback={appointmentType.name}
              category="appointmentType"
              data-testid="translatedreferencedata-u7us"
            />
          }
          data-testid="detailsdisplay-ll5z"
        />
      )}
      {isHighPriority && (
        <Tag data-testid="tag-aesu">
          <HighPriorityIcon
            aria-label="High priority"
            htmlColor={Colors.alert}
            style={{ fontSize: 15 }}
            data-testid="highpriorityicon-kkvr"
          />
          <TranslatedText
            stringId="general.highPriority.label"
            fallback="High priority"
            data-testid="translatedtext-ajux"
          />
        </Tag>
      )}
    </>
  );
};

export const AppointmentDetailsDisplay = ({ appointment, isOvernight }) => {
  const {
    startTime,
    endTime,
    clinician,
    locationGroup,
    location,
    bookingType,
    appointmentType,
    appointmentProcedureTypes,
    isHighPriority,
    encounter,
    additionalClinician
  } = appointment;

  return (
    <AppointmentDetailsContainer data-testid="appointmentdetailscontainer-8rgc">
      <DetailsDisplay
        label={
          <TranslatedText
            stringId="general.time.label"
            fallback="Time"
            data-testid="translatedtext-cljh"
          />
        }
        value={formatDateTimeRange(startTime, endTime)}
        data-testid="detailsdisplay-diun"
      />
      <ClinicianContainer>
        <DetailsDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.clinician.label.short"
              fallback="Clinician"
              data-testid="translatedtext-12cf"
            />
          }
          value={clinician?.displayName}
          data-testid="detailsdisplay-an8y"
        />
        {bookingType && <AdditionalClinician additionalClinician={additionalClinician} />}
      </ClinicianContainer>
      {!bookingType && (
        <DetailsDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.locationGroupId.label"
              fallback="Area"
              data-testid="translatedtext-f8to"
            />
          }
          value={
            <TranslatedReferenceData
              fallback={location?.locationGroup?.name || locationGroup?.name}
              value={location?.locationGroup?.id || locationGroup?.id}
              category="locationGroup"
              data-testid="translatedreferencedata-gbn6"
            />
          }
          data-testid="detailsdisplay-w60y"
        />
      )}
      {/* Location booking specific data */}
      {location && bookingType && (
        <LocationBookingDetails
          location={location}
          locationGroup={locationGroup}
          bookingType={bookingType}
          isOvernight={isOvernight}
          appointmentProcedureTypes={appointmentProcedureTypes}
          encounter={encounter}
          data-testid="locationbookingdetails-g1r6"
        />
      )}
      {/* Outpatient appointment specific data */}
      {appointmentType && (
        <AppointmentTypeDetails
          appointmentType={appointmentType}
          isHighPriority={isHighPriority}
          data-testid="appointmenttypedetails-vpuq"
        />
      )}
    </AppointmentDetailsContainer>
  );
};
