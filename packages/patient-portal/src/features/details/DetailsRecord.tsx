import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router';
import { Pencil } from 'lucide-react';
import { TranslatedText } from '@tamanu/ui-components';

import { type FieldSetting, usePortalSettingsQuery } from '@api/queries/usePortalSettingsQuery';
import { Loading, Panel, Section } from '@components/layout';
import { useCurrentUser } from '@routes/PrivateRoute';
import { RecordDisclosure } from '../dashboard/RecordDisclosure';
import {
  BASIC_FIELD_NAMES,
  DETAIL_GROUPS,
  type DetailField,
  getEditableFields,
  getShownFields,
  NAME_FIELD_NAMES,
} from './detailFields';

type Patient = ReturnType<typeof useCurrentUser>;

/** One grid for every group, so all the values line up. */
export const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: fit-content(45%) 1fr;
  column-gap: 20px;
  padding: 4px 16px 16px;
`;

/** A group's details, laid out on the shared grid's columns. */
export const GroupDetails = styled.dl`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: subgrid;
  row-gap: 8px;
  margin: 0;

  dt {
    color: var(--pf-text-secondary);
  }

  dd {
    margin: 0;
    font-weight: 500;
    overflow-wrap: anywhere;
  }
`;

const BasicDetails = styled(DetailGrid)`
  padding-top: 16px;
`;

const GroupHeading = styled.h3`
  grid-column: 1 / -1;
  margin: 16px 0 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--pf-text);
`;

const SectionHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;

  h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 500;
  }
`;

const EditLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  margin: -8px 0;
  padding: 0 14px;
  border-radius: 20px;
  background: var(--pf-primary-tint);
  color: var(--pf-primary);
  font-weight: 500;
  text-decoration: none;

  svg {
    width: 16px;
    height: 16px;
  }
`;

/** Whether the patient has this detail recorded. Details without one are left out. */
export const hasDetail = (field: DetailField, patient: Patient) => Boolean(field.getValue(patient));

export const DetailValue = ({ field }: { field: DetailField }) => {
  const patient = useCurrentUser();
  return <>{field.getDisplayValue?.(patient) ?? field.getValue(patient)}</>;
};

export const DetailList = ({ fields }: { fields: DetailField[] }) => (
  <GroupDetails>
    {fields.map(field => (
      <React.Fragment key={field.name}>
        <dt>{field.label}</dt>
        <dd>
          <DetailValue field={field} />
        </dd>
      </React.Fragment>
    ))}
  </GroupDetails>
);

/** The patient's name, as a single detail, leaving out any part the deployment hides. */
const getNameField = (fieldSettings: Record<string, FieldSetting>): DetailField => ({
  name: 'name',
  label: <TranslatedText stringId="patientPortal.details.name" fallback="Name" />,
  getValue: patient =>
    [patient.firstName, !fieldSettings.middleName?.hidden && patient.middleName, patient.lastName]
      .filter(Boolean)
      .join(' '),
});

/** Everything beyond the basics, under group headings, leaving out what isn't recorded. */
const MoreDetails = ({
  groups,
}: {
  groups: { key: string; title: React.ReactNode; fields: DetailField[] }[];
}) => (
  <DetailGrid>
    {groups.map(group => (
      <React.Fragment key={group.key}>
        <GroupHeading>{group.title}</GroupHeading>
        <DetailList fields={group.fields} />
      </React.Fragment>
    ))}
  </DetailGrid>
);

/**
 * The patient's basic details, always in view, with the rest of their recorded details a tap
 * away and one Edit for all of them.
 */
export const YourDetailsSection = () => {
  const patient = useCurrentUser();
  const { hash } = useLocation();
  const { data: settings, isLoading } = usePortalSettingsQuery();
  const fieldSettings = settings?.fields ?? {};

  // Coming back from editing details, the patient lands on them
  const isReturningToDetails = hash === '#details';
  useEffect(() => {
    if (isReturningToDetails && !isLoading) document.getElementById('details')?.scrollIntoView();
  }, [isReturningToDetails, isLoading]);

  const shownFields = DETAIL_GROUPS.flatMap(group => getShownFields(group, fieldSettings));
  const basicFields = [
    getNameField(fieldSettings),
    ...BASIC_FIELD_NAMES.map(name => shownFields.find(field => field.name === name)),
  ].filter((field): field is DetailField => Boolean(field) && hasDetail(field!, patient));
  const moreGroups = DETAIL_GROUPS.map(group => ({
    key: group.key,
    title: group.title,
    fields: getShownFields(group, fieldSettings).filter(
      field =>
        !BASIC_FIELD_NAMES.includes(field.name) &&
        !NAME_FIELD_NAMES.includes(field.name) &&
        hasDetail(field, patient),
    ),
  })).filter(group => group.fields.length > 0);
  const isEditable = DETAIL_GROUPS.some(
    group => getEditableFields(group, fieldSettings).length > 0,
  );

  return (
    <Section id="details" aria-labelledby="details-title">
      <SectionHeading>
        <h2 id="details-title">
          <TranslatedText stringId="patientPortal.details.title" fallback="Your details" />
        </h2>
        {isEditable && (
          <EditLink to="/details/edit" aria-describedby="details-title">
            <Pencil aria-hidden />
            <TranslatedText stringId="general.action.edit" fallback="Edit" />
          </EditLink>
        )}
      </SectionHeading>
      <Panel>
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <BasicDetails>
              <DetailList fields={basicFields} />
            </BasicDetails>
            {moreGroups.length > 0 && (
              <RecordDisclosure
                id="more-details"
                title={
                  <TranslatedText stringId="patientPortal.details.more" fallback="More details" />
                }
                isInitiallyOpen={isReturningToDetails}
              >
                <MoreDetails groups={moreGroups} />
              </RecordDisclosure>
            )}
          </>
        )}
      </Panel>
    </Section>
  );
};
