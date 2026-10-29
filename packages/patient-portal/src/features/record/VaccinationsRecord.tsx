import React from 'react';
import { TranslatedEnum, TranslatedText, useTranslation } from '@tamanu/ui-components';
import { VACCINE_STATUS, VACCINE_STATUS_LABELS } from '@tamanu/constants';

import { useAdministeredVaccinesQuery } from '@api/queries/useAdministeredVaccinesQuery';
import { useUpcomingVaccinesQuery } from '@api/queries/useUpcomingVaccinesQuery';
import { type BadgeTone, Muted } from '@components/layout';
import { formatVaccineFacilityOrCountry, formatVaccineGivenBy, formatWeekOf } from '@utils/format';
import { formatRecordDate, RecordItem, RecordList, RecordSubsection } from './recordList';

const STATUS_TONES: Partial<Record<string, BadgeTone>> = {
  [VACCINE_STATUS.DUE]: 'success',
  [VACCINE_STATUS.OVERDUE]: 'warning',
  [VACCINE_STATUS.MISSED]: 'alert',
  [VACCINE_STATUS.UPCOMING]: 'info',
};

export const VaccinationsRecord = () => {
  const { getTranslation } = useTranslation();
  const { data: upcoming, isLoading: isLoadingUpcoming } = useUpcomingVaccinesQuery();
  const { data: recorded, isLoading: isLoadingRecorded } = useAdministeredVaccinesQuery();

  const isLoading = isLoadingUpcoming || isLoadingRecorded;
  if (!isLoading && !upcoming?.length && !recorded?.length) {
    return (
      <Muted>
        <TranslatedText
          stringId="patientPortal.vaccinations.noneAtAll"
          fallback="No vaccinations scheduled or recorded"
        />
      </Muted>
    );
  }

  return (
    <>
      <RecordSubsection
        id="vaccine-schedule"
        title={
          <TranslatedText stringId="patientPortal.vaccinations.schedule" fallback="Schedule" />
        }
      >
        <RecordList
          items={upcoming}
          isLoading={isLoadingUpcoming}
          empty={
            <TranslatedText
              stringId="patientPortal.vaccinations.noneScheduled"
              fallback="No vaccinations scheduled"
            />
          }
          renderItem={vaccine => (
            <RecordItem
              key={vaccine.scheduledVaccine.id}
              title={vaccine.scheduledVaccine.label}
              details={[
                vaccine.scheduledVaccine.doseLabel,
                formatWeekOf(vaccine.dueDate, getTranslation),
              ]}
              badge={<TranslatedEnum value={vaccine.status} enumValues={VACCINE_STATUS_LABELS} />}
              badgeTone={STATUS_TONES[vaccine.status] ?? 'neutral'}
            />
          )}
        />
      </RecordSubsection>
      <RecordSubsection
        id="recorded-vaccines"
        title={
          <TranslatedText stringId="patientPortal.vaccinations.recorded" fallback="Recorded" />
        }
      >
        <RecordList
          items={recorded}
          isLoading={isLoadingRecorded}
          empty={
            <TranslatedText
              stringId="patientPortal.vaccinations.noneRecorded"
              fallback="No vaccinations recorded"
            />
          }
          renderItem={vaccine => (
            <RecordItem
              key={vaccine.id}
              title={vaccine.scheduledVaccine?.label}
              details={[
                [vaccine.scheduledVaccine?.doseLabel, formatRecordDate(vaccine.date)]
                  .filter(Boolean)
                  .join(' · '),
                [
                  formatVaccineGivenBy(vaccine, getTranslation),
                  formatVaccineFacilityOrCountry(vaccine),
                ]
                  .filter(part => part !== '--')
                  .join(', '),
              ]}
            />
          )}
        />
      </RecordSubsection>
    </>
  );
};
