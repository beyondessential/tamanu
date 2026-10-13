import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Link, useLocation } from 'react-router';
import { TranslatedText } from '@tamanu/ui-components';

import { usePortalSettingsQuery } from '@api/queries/usePortalSettingsQuery';
import { BackLink, Loading, PageColumn, PageTitle, Panel, Section } from '@components/layout';
import { useCurrentUser } from '@routes/PrivateRoute';
import {
  DETAIL_GROUPS,
  type DetailField,
  type DetailGroup,
  getEditableFields,
  getShownFields,
} from '../../features/details/detailFields';

const GroupHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;

  h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 500;
  }
`;

const EditLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 20px;
  background: var(--pf-primary-tint);
  color: var(--pf-primary);
  font-weight: 500;
  text-decoration: none;
`;

const DetailList = styled.dl`
  margin: 0;
`;

const Detail = styled.div`
  padding: 10px 16px;

  & + & {
    border-top: 1px solid var(--pf-line);
  }

  dt {
    font-size: 13px;
    color: var(--pf-text-tertiary);
  }

  dd {
    margin: 2px 0 0;
    font-size: 16px;
    overflow-wrap: anywhere;
  }
`;

const NotRecorded = styled.span`
  color: var(--pf-text-tertiary);
`;

const DetailValue = ({ field }: { field: DetailField }) => {
  const patient = useCurrentUser();
  const value = field.getDisplayValue?.(patient) ?? field.getValue(patient);
  if (!value) {
    return (
      <NotRecorded>
        <TranslatedText stringId="patientPortal.details.notRecorded" fallback="Not recorded" />
      </NotRecorded>
    );
  }
  return <>{value}</>;
};

const DetailGroupSection = ({
  group,
  fields,
  isEditable,
}: {
  group: DetailGroup;
  fields: DetailField[];
  isEditable: boolean;
}) => {
  const headingId = `details-${group.key}`;
  return (
    <Section id={group.key} aria-labelledby={headingId}>
      <GroupHeading>
        <h2 id={headingId}>{group.title}</h2>
        {isEditable && (
          <EditLink to={`/details/${group.key}`} aria-describedby={headingId}>
            <TranslatedText stringId="general.action.edit" fallback="Edit" />
          </EditLink>
        )}
      </GroupHeading>
      <Panel>
        <DetailList>
          {fields.map(field => (
            <Detail key={field.name}>
              <dt>{field.label}</dt>
              <dd>
                <DetailValue field={field} />
              </dd>
            </Detail>
          ))}
        </DetailList>
      </Panel>
    </Section>
  );
};

/** The patient's details, each group with its own Edit. */
export const PatientDetailsView = () => {
  const { data: settings, isLoading } = usePortalSettingsQuery();
  const fieldSettings = settings?.fields;
  const { hash } = useLocation();

  // Coming back from editing a group, the patient lands on that group
  useEffect(() => {
    if (isLoading || !hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
  }, [hash, isLoading]);

  return (
    <PageColumn>
      <BackLink to="/">
        <TranslatedText stringId="patientPortal.home" fallback="Home" />
      </BackLink>
      <PageTitle>
        <TranslatedText stringId="patientPortal.details.title" fallback="Your details" />
      </PageTitle>
      {isLoading ? (
        <Loading />
      ) : (
        DETAIL_GROUPS.map(group => {
          const fields = getShownFields(group, fieldSettings);
          if (fields.length === 0) return null;
          return (
            <DetailGroupSection
              key={group.key}
              group={group}
              fields={fields}
              isEditable={getEditableFields(group, fieldSettings).length > 0}
            />
          );
        })
      )}
    </PageColumn>
  );
};
