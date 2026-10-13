import React from 'react';
import { Ban, HeartPulse, Pill, Stethoscope, Syringe, User } from 'lucide-react';
import { TranslatedText } from '@tamanu/ui-components';

import { useAdministeredVaccinesQuery } from '@api/queries/useAdministeredVaccinesQuery';
import { useAllergiesQuery } from '@api/queries/useAllergiesQuery';
import { useMedicationsQuery } from '@api/queries/useMedicationsQuery';
import { useOngoingConditionsQuery } from '@api/queries/useOngoingConditionsQuery';
import { useProceduresQuery } from '@api/queries/useProceduresQuery';
import {
  Panel,
  RowDetail,
  RowIcon,
  RowLink,
  RowText,
  RowTitle,
  Section,
  SectionTitle,
} from '@components/layout';

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

const RecordRow = ({
  to,
  icon,
  title,
  detail,
}: {
  to: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  detail: React.ReactNode;
}) => (
  <RowLink to={to}>
    <RowIcon>{icon}</RowIcon>
    <RowText>
      <RowTitle>{title}</RowTitle>
      {detail}
    </RowText>
  </RowLink>
);

/** Each part of the patient's record opens on its own page. */
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
        <RecordRow
          to="/details"
          icon={<User aria-hidden />}
          title={<TranslatedText stringId="patientPortal.details.title" fallback="Your details" />}
          detail={
            <RowDetail>
              <TranslatedText
                stringId="patientPortal.details.summary"
                fallback="Contact, address and emergency contact"
              />
            </RowDetail>
          }
        />
        <RecordRow
          to="/conditions"
          icon={<Stethoscope aria-hidden />}
          title={
            <TranslatedText
              stringId="patientPortal.conditions.title"
              fallback="Ongoing conditions"
            />
          }
          detail={<RecordCount count={conditions?.length} />}
        />
        <RecordRow
          to="/allergies"
          icon={<Ban aria-hidden />}
          title={<TranslatedText stringId="patientPortal.allergies.title" fallback="Allergies" />}
          detail={<RecordCount count={allergies?.length} />}
        />
        <RecordRow
          to="/medications"
          icon={<Pill aria-hidden />}
          title={
            <TranslatedText stringId="patientPortal.medications.title" fallback="Medications" />
          }
          detail={<RecordCount count={medications?.length} />}
        />
        <RecordRow
          to="/vaccinations"
          icon={<Syringe aria-hidden />}
          title={
            <TranslatedText stringId="patientPortal.vaccinations.title" fallback="Vaccinations" />
          }
          detail={<RecordCount count={vaccines?.length} />}
        />
        <RecordRow
          to="/procedures"
          icon={<HeartPulse aria-hidden />}
          title={<TranslatedText stringId="patientPortal.procedures.title" fallback="Procedures" />}
          detail={<RecordCount count={procedures?.length} />}
        />
      </Panel>
    </Section>
  );
};
