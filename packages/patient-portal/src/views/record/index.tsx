import React from 'react';
import { TranslatedText } from '@tamanu/ui-components';

import { useAllergiesQuery } from '@api/queries/useAllergiesQuery';
import { useMedicationsQuery } from '@api/queries/useMedicationsQuery';
import { useOngoingConditionsQuery } from '@api/queries/useOngoingConditionsQuery';
import { formatDose, formatFrequency, formatRoute } from '@utils/format';
import { formatRecordDate, RecordItem, RecordList, RecordPage } from './RecordPage';

export { ProceduresView } from './ProceduresView';
export { VaccinationsView } from './VaccinationsView';

export const ConditionsView = () => {
  const { data: conditions, isLoading } = useOngoingConditionsQuery();
  return (
    <RecordPage
      title={
        <TranslatedText stringId="patientPortal.conditions.title" fallback="Ongoing conditions" />
      }
    >
      <RecordList
        items={conditions}
        isLoading={isLoading}
        empty={
          <TranslatedText
            stringId="patientPortal.conditions.none"
            fallback="No ongoing conditions recorded"
          />
        }
        renderItem={condition => (
          <RecordItem
            key={condition.id}
            title={condition.condition?.name}
            details={[
              formatRecordDate(condition.recordedDate) && (
                <TranslatedText
                  stringId="patientPortal.record.recordedOn"
                  fallback="Recorded :date"
                  replacements={{ date: formatRecordDate(condition.recordedDate) }}
                />
              ),
            ]}
          />
        )}
      />
    </RecordPage>
  );
};

export const AllergiesView = () => {
  const { data: allergies, isLoading } = useAllergiesQuery();
  return (
    <RecordPage
      title={<TranslatedText stringId="patientPortal.allergies.title" fallback="Allergies" />}
    >
      <RecordList
        items={allergies}
        isLoading={isLoading}
        empty={
          <TranslatedText
            stringId="patientPortal.allergies.none"
            fallback="No allergies recorded"
          />
        }
        renderItem={allergy => (
          <RecordItem
            key={allergy.id}
            title={allergy.allergy?.name}
            details={[
              allergy.reaction?.name && (
                <TranslatedText
                  stringId="patientPortal.allergies.reaction"
                  fallback="Reaction: :reaction"
                  replacements={{ reaction: allergy.reaction.name }}
                />
              ),
            ]}
          />
        )}
      />
    </RecordPage>
  );
};

/** "1 tablet, twice daily, oral", leaving out what isn't recorded. */
const describeDosing = ({
  doseAmount,
  dosingUnit,
  frequency,
  route,
}: {
  doseAmount?: number | null;
  dosingUnit?: string | null;
  frequency?: string | null;
  route?: string | null;
}) =>
  [
    formatDose(doseAmount, dosingUnit ?? undefined),
    formatFrequency(frequency ?? undefined),
    formatRoute(route ?? undefined),
  ]
    .filter(part => part !== '--')
    .join(' · ');

export const MedicationsView = () => {
  const { data: medications, isLoading } = useMedicationsQuery();
  return (
    <RecordPage
      title={<TranslatedText stringId="patientPortal.medications.title" fallback="Medications" />}
    >
      <RecordList
        items={medications}
        isLoading={isLoading}
        empty={
          <TranslatedText
            stringId="patientPortal.medications.none"
            fallback="No medications recorded"
          />
        }
        renderItem={medication => (
          <RecordItem
            key={medication.id}
            title={medication.medication?.name}
            details={[
              describeDosing(medication),
              formatRecordDate(medication.startDate) && (
                <TranslatedText
                  stringId="patientPortal.medications.started"
                  fallback="Started :date"
                  replacements={{ date: formatRecordDate(medication.startDate) }}
                />
              ),
              medication.prescriber?.displayName,
            ]}
          />
        )}
      />
    </RecordPage>
  );
};
