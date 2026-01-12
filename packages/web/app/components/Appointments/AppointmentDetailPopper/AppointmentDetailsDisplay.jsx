import { PriorityHigh as HighPriorityIcon } from '@material-ui/icons';
import Overnight from '@mui/icons-material/Brightness2';
import { isSameDay, parseISO } from 'date-fns';
import { styled } from '@mui/material/styles';
import React from 'react';
import { useDispatch } from 'react-redux';
import { Link, generatePath, useNavigate } from 'react-router';
import { Colors } from '../../../constants';
import { PATIENT_PATHS, PATIENT_CATEGORIES } from '../../../constants/patientPaths';
import { DateDisplay, TimeDisplay, useDateTimeFormat } from '@tamanu/ui-components';
import { TranslatedReferenceData, TranslatedText } from '../../Translation';
import { ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';
import { DetailsDisplay } from './SharedComponents';
import { LimitedLinesCell } from '../../FormattedTableCell';
import { useTranslation } from '../../../contexts/Translation';
import { reloadPatient } from '../../../store';
import { useEncounter } from '../../../contexts/Encounter';

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

const EncounterLink = styled(Link)`
  cursor: pointer;
  text-decoration: underline;
  &:hover {
    color: ${Colors.primary};
  }
  ${({ $isOvernight }) => $isOvernight && `
    display: block;
    max-width: calc(100% - 68px);
  `}
`;

const ClinicianContainer = styled('div')`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  > div {
    flex: 1;
    flex-shrink: 0;
    width: 0;
  }
`;

const LinkedEncounter = ({ encounter, isOvernight }) => {
  const { formatShort } = useDateTimeFormat();
  const { getTranslation, getEnumTranslation, getReferenceDataTranslation } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loadEncounter } = useEncounter();

  const encounterPath = generatePath(PATIENT_PATHS.ENCOUNTER, {
    category: PATIENT_CATEGORIES.ALL,
    patientId: encounter.patientId,
    encounterId: encounter.id,
  });

  const encounterLabel = `${formatShort(encounter.startDate)}${
    encounter.endDate ? '' : ' - ' + getTranslation('general.date.current', 'Current').toLowerCase()
  } | ${getEnumTranslation(
    ENCOUNTER_TYPE_LABELS,
    encounter.encounterType,
  )} | ${getReferenceDataTranslation({
    value: encounter?.location?.facility.id,
    category: 'facility',
    fallback: encounter?.location?.facility.name,
  })}`;

  const handleClick = async (e) => {
    e.preventDefault();
    await Promise.all([
      dispatch(reloadPatient(encounter.patientId)),
      loadEncounter(encounter.id),
    ]);
    navigate((encounterPath));
  };

  return (
    <EncounterLink
      to={encounterPath}
      onClick={handleClick}
      $isOvernight={isOvernight}
    >
      <LimitedLinesCell
        value={encounterLabel}
        maxLines={isOvernight ? undefined : 1}
        isOneLine={!isOvernight}
        PopperProps={{ style: { maxWidth: '200px' } }}
      />
    </EncounterLink>
  );
};

const LocationBookingDetails = ({
  location,
  locationGroup,
  bookingType,
  isOvernight,
  appointmentProcedureTypes,
  linkEncounter,
}) => {
  const { getReferenceDataTranslation } = useTranslation();
  const appointmentProcedureTypesValue = appointmentProcedureTypes
    ?.map(({ procedureType }) =>
      getReferenceDataTranslation({
        value: procedureType.id,
        category: procedureType.type,
        fallback: procedureType.name,
      }),
    )
    .join(', ');

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
            <span>
              {(location?.locationGroup?.id || locationGroup?.id) && (
                <>
                  <TranslatedReferenceData
                    fallback={location?.locationGroup?.name || locationGroup?.name}
                    value={location?.locationGroup?.id || locationGroup?.id}
                    category="locationGroup"
                    data-testid="translatedreferencedata-gbn6"
                  />
                  {', '}
                </>
              )}
              <TranslatedReferenceData
                fallback={location?.name}
                value={location?.id}
                category="location"
                data-testid="translatedreferencedata-505o"
              />
            </span>
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
            fallback="Procedure"
            data-testid="translatedtext-v4x2"
          />
        }
        value={
          appointmentProcedureTypesValue && (
            <LimitedLinesCell
              value={appointmentProcedureTypesValue}
              maxLines={1}
              isOneLine
              PopperProps={{ style: { maxWidth: '200px' } }}
            />
          )
        }
        data-testid="detailsdisplay-ll5z"
      />
      <DetailsDisplay
        label={
          <TranslatedText
            stringId="appointment.linkedEncounter.label"
            fallback="Linked encounter"
            data-testid="translatedtext-linkedencounter"
          />
        }
        value={linkEncounter && <LinkedEncounter encounter={linkEncounter} isOvernight={isOvernight} />}
        data-testid="detailsdisplay-linkedencounter"
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
    linkEncounter,
    additionalClinician,
  } = appointment;

  const doesSpanMultipleDays = !isSameDay(parseISO(startTime), parseISO(endTime)); 

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
        value={doesSpanMultipleDays
          ? <><DateDisplay date={startTime} showTime />{' '}–{' '}<DateDisplay date={endTime} showTime /></>
          : <><DateDisplay date={startTime} showTime />{' '}–{' '}<TimeDisplay date={endTime} /></>
        }
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
        <DetailsDisplay
          label={
            <TranslatedText
              stringId="general.localisedField.additionalClinician.label.short"
              fallback="Additional clinician"
              data-testid="translatedtext-additionalclinician"
            />
          }
          value={
            additionalClinician?.displayName && (
              <LimitedLinesCell
                value={additionalClinician?.displayName}
                maxLines={1}
                isOneLine
                PopperProps={{ style: { maxWidth: '140px' } }}
              />
            )
          }
          data-testid="detailsdisplay-additionalclinician"
        />
      </ClinicianContainer>
      {/* Location booking specific data */}
      {location && bookingType && (
        <LocationBookingDetails
          location={location}
          locationGroup={locationGroup}
          bookingType={bookingType}
          isOvernight={isOvernight}
          appointmentProcedureTypes={appointmentProcedureTypes}
          linkEncounter={linkEncounter}
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
