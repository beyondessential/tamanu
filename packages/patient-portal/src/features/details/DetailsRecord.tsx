import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router';
import { Pencil } from 'lucide-react';
import { TranslatedText } from '@tamanu/ui-components';

import { usePortalSettingsQuery } from '@api/queries/usePortalSettingsQuery';
import { Loading } from '@components/layout';
import { useCurrentUser } from '@routes/PrivateRoute';
import { DETAIL_GROUPS, type DetailField, getEditableFields, getShownFields } from './detailFields';

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

const GroupHeading = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 40px;
  margin-top: 8px;

  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: var(--pf-text);
  }
`;

const EditLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
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

const NotRecorded = styled.span`
  color: var(--pf-text-tertiary);
  font-weight: 400;
`;

export const DetailValue = ({ field }: { field: DetailField }) => {
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

/** The patient's details under their group headings, with Edit at the top. */
export const DetailsRecord = () => {
  const { data: settings, isLoading } = usePortalSettingsQuery();
  if (isLoading) return <Loading />;

  const fieldSettings = settings?.fields;
  const groups = DETAIL_GROUPS.map(group => ({
    group,
    fields: getShownFields(group, fieldSettings),
  })).filter(({ fields }) => fields.length > 0);
  const isEditable = DETAIL_GROUPS.some(
    group => getEditableFields(group, fieldSettings).length > 0,
  );

  return (
    <DetailGrid>
      {groups.map(({ group, fields }, index) => (
        <React.Fragment key={group.key}>
          <GroupHeading>
            <h3>{group.title}</h3>
            {index === 0 && isEditable && (
              <EditLink to="/details/edit">
                <Pencil aria-hidden />
                <TranslatedText stringId="general.action.edit" fallback="Edit" />
              </EditLink>
            )}
          </GroupHeading>
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
        </React.Fragment>
      ))}
    </DetailGrid>
  );
};
