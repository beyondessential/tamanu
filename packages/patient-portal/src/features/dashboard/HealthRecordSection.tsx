import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router';
import { Ban, ChevronDown, HeartPulse, Pill, Stethoscope, Syringe, User } from 'lucide-react';
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
  rowLayout,
  RowText,
  RowTitle,
  Section,
  SectionTitle,
} from '@components/layout';
import { DetailsRecord } from '../details/DetailsRecord';
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

const DisclosureButton = styled.button`
  ${rowLayout}
  width: 100%;
  margin: 0;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  text-align: start;
  cursor: pointer;

  &:active {
    background: var(--pf-option);
  }

  > svg:last-child {
    flex: none;
    width: 20px;
    height: 20px;
    color: var(--pf-text-tertiary);
    transition: transform 150ms;
  }

  &[aria-expanded='true'] > svg:last-child {
    transform: rotate(180deg);
  }
`;

const RecordContent = styled.div`
  border-top: 1px solid var(--pf-line);
`;

const RecordPart = styled.div`
  & + & {
    border-top: 1px solid var(--pf-line);
  }
`;

/** A part of the record that expands in place to show what's in it. */
const RecordDisclosure = ({
  id,
  icon,
  title,
  detail,
  isInitiallyOpen = false,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: React.ReactNode;
  detail: React.ReactNode;
  isInitiallyOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);
  const contentId = `${id}-content`;
  return (
    <RecordPart id={id}>
      <DisclosureButton
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setIsOpen(open => !open)}
      >
        <RowIcon>{icon}</RowIcon>
        <RowText>
          <RowTitle>{title}</RowTitle>
          {detail}
        </RowText>
        <ChevronDown aria-hidden />
      </DisclosureButton>
      {isOpen && <RecordContent id={contentId}>{children}</RecordContent>}
    </RecordPart>
  );
};

/** The patient's details and record, each opened in place. */
export const HealthRecordSection = () => {
  const { hash } = useLocation();
  const { data: conditions } = useOngoingConditionsQuery();
  const { data: allergies } = useAllergiesQuery();
  const { data: medications } = useMedicationsQuery();
  const { data: vaccines } = useAdministeredVaccinesQuery();
  const { data: procedures } = useProceduresQuery();

  // Coming back from editing details, the patient lands on them
  const isReturningToDetails = hash === '#details';
  useEffect(() => {
    if (isReturningToDetails) document.getElementById('details')?.scrollIntoView();
  }, [isReturningToDetails]);

  return (
    <Section aria-labelledby="record-title">
      <SectionTitle id="record-title">
        <TranslatedText stringId="patientPortal.record.title" fallback="Your health record" />
      </SectionTitle>
      <Panel>
        <RecordDisclosure
          id="details"
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
          isInitiallyOpen={isReturningToDetails}
        >
          <DetailsRecord />
        </RecordDisclosure>
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
