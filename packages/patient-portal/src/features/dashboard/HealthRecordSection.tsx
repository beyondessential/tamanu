import React from 'react';
import { Ban, HeartPulse, Pill, Stethoscope, Syringe } from 'lucide-react';
import { TranslatedText } from '@tamanu/ui-components';

import { useAdministeredVaccinesQuery } from '@api/queries/useAdministeredVaccinesQuery';
import { useAllergiesQuery } from '@api/queries/useAllergiesQuery';
import { useMedicationsQuery } from '@api/queries/useMedicationsQuery';
import { useOngoingConditionsQuery } from '@api/queries/useOngoingConditionsQuery';
import { useProceduresQuery } from '@api/queries/useProceduresQuery';
import { Panel, RowDetail, Section, SectionTitle } from '@components/layout';
import { RecordDisclosure } from './RecordDisclosure';
import {
  AllergiesRecord,
  ConditionsRecord,
  MedicationsRecord,
  ProceduresRecord,
  VaccinationsRecord,
} from '../record/records';

/** How many records a part of the health record holds, once it has loaded. */
const RecordCount = ({ count }: { count: number | undefined }) => {
  if (count === undefined) return null;
  return (
    <RowDetail>
      {count === 0 ? (
        <TranslatedText stringId="patientPortal.record.countNone" fallback="None recorded" />
      ) : (
        <TranslatedText
          stringId="patientPortal.record.count"
          fallback=":count recorded"
          replacements={{ count }}
        />
      )}
    </RowDetail>
  );
};

/** Each part of the patient's record, opened in place. */
export const HealthRecordSection = () => {
  const { data: conditions } = useOngoingConditionsQuery();
  const { data: allergies } = useAllergiesQuery();
  const { data: medications } = useMedicationsQuery();
  const { data: vaccines } = useAdministeredVaccinesQuery();
  const { data: procedures } = useProceduresQuery();

  return (
    <Section aria-labelledby="record-title">
      <SectionTitle id="record-title">
        <TranslatedText stringId="patientPortal.record.title" fallback="Your health record" />
      </SectionTitle>
      <Panel>
        <RecordDisclosure
          id="conditions"
          icon={<Stethoscope aria-hidden />}
          title={
            <TranslatedText
              stringId="patientPortal.conditions.title"
              fallback="Ongoing conditions"
            />
          }
          detail={<RecordCount count={conditions?.length} />}
        >
          <ConditionsRecord />
        </RecordDisclosure>
        <RecordDisclosure
          id="allergies"
          icon={<Ban aria-hidden />}
          title={<TranslatedText stringId="patientPortal.allergies.title" fallback="Allergies" />}
          detail={<RecordCount count={allergies?.length} />}
        >
          <AllergiesRecord />
        </RecordDisclosure>
        <RecordDisclosure
          id="medications"
          icon={<Pill aria-hidden />}
          title={
            <TranslatedText stringId="patientPortal.medications.title" fallback="Medications" />
          }
          detail={<RecordCount count={medications?.length} />}
        >
          <MedicationsRecord />
        </RecordDisclosure>
        <RecordDisclosure
          id="vaccinations"
          icon={<Syringe aria-hidden />}
          title={
            <TranslatedText stringId="patientPortal.vaccinations.title" fallback="Vaccinations" />
          }
          detail={<RecordCount count={vaccines?.length} />}
        >
          <VaccinationsRecord />
        </RecordDisclosure>
        <RecordDisclosure
          id="procedures"
          icon={<HeartPulse aria-hidden />}
          title={<TranslatedText stringId="patientPortal.procedures.title" fallback="Procedures" />}
          detail={<RecordCount count={procedures?.length} />}
        >
          <ProceduresRecord />
        </RecordDisclosure>
      </Panel>
    </Section>
  );
};
