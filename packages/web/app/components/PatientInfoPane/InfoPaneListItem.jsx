import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { Collapse } from '@material-ui/core';
import EditIcon from '@mui/icons-material/Edit';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { route } from '@tamanu/api-client';
import { FormGrid, UnstyledHtmlButton } from '@tamanu/ui-components';
import { Colors } from '../../constants';
import { useApi } from '../../api';
import { useTranslation } from '../../contexts/Translation';

export const InfoPaneRow = styled(UnstyledHtmlButton)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  box-sizing: border-box;
  width: 100%;
  min-height: 36px;
  padding: 4px 0;
  color: ${Colors.darkestText};
  font-size: 14px;
  line-height: 18px;
  text-align: start;
  cursor: pointer;

  &:hover {
    background: ${Colors.veryLightBlue};
  }
`;

export const InfoPaneRowName = styled.span`
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
`;

export const InfoPaneRowEnd = styled.span`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  min-width: 0;
`;

export const InfoPaneChevron = ({ Icon }) => (
  <Icon size={20} color={Colors.midText} style={{ flexShrink: 0 }} />
);

const Item = styled.div`
  ${p => p.$expanded && `border-bottom: 1px solid ${Colors.outline};`}
`;

const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0 8px;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;

  &:first-child {
    align-items: flex-start;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  font-size: 14px;
  line-height: 18px;
`;

const FieldLabel = styled.span`
  color: ${Colors.midText};
  font-weight: 500;
`;

const FieldValue = styled.span`
  color: ${Colors.darkestText};
  overflow-wrap: anywhere;
  white-space: pre-wrap;
`;

const EditButton = styled(UnstyledHtmlButton)`
  display: flex;
  flex-shrink: 0;
  color: ${Colors.primary};
  cursor: pointer;

  .MuiSvgIcon-root {
    font-size: 20px;
  }
`;

export const InfoPaneTextLink = styled(UnstyledHtmlButton)`
  flex-shrink: 0;
  color: ${Colors.darkestText};
  font-size: 14px;
  line-height: 18px;
  text-decoration: underline;
  cursor: pointer;
`;

export const InfoPaneFormContainer = styled.div`
  & > * {
    margin: 0;
  }

  ${FormGrid} {
    margin-top: 0;
    grid-row-gap: 12px;
  }
`;

export const PractitionerName = ({ id }) => {
  const api = useApi();
  const { data } = useQuery(
    ['practitionerName', id],
    () => api.get(route('suggestions/practitioner/:id', { id })),
    { enabled: Boolean(id) },
  );
  return data?.name ?? '-';
};

export const InfoPaneItemDetails = ({ fields, onEdit, action, children }) => {
  const { getTranslation } = useTranslation();
  return (
    <Details data-testid="infopaneitemdetails">
      {fields.map(({ key, label, value }, index) => (
        <DetailRow key={key}>
          <Field>
            <FieldLabel>{label}</FieldLabel>
            <FieldValue data-testid={`infopaneitemdetails-${key}`}>{value || '-'}</FieldValue>
          </Field>
          {index === 0 && onEdit && (
            <EditButton
              type="button"
              onClick={onEdit}
              aria-label={getTranslation('general.action.edit', 'Edit')}
              data-testid="infopaneitemdetails-edit"
            >
              <EditIcon />
            </EditButton>
          )}
          {index === fields.length - 1 && action}
        </DetailRow>
      ))}
      {children}
    </Details>
  );
};

export const InfoPaneListItem = ({ name, tag, expanded, onToggle, children, ...props }) => (
  <Item $expanded={expanded}>
    <InfoPaneRow type="button" onClick={onToggle} aria-expanded={expanded} {...props}>
      <InfoPaneRowName>{name}</InfoPaneRowName>
      <InfoPaneRowEnd>
        {tag}
        <InfoPaneChevron Icon={expanded ? ChevronUp : ChevronDown} />
      </InfoPaneRowEnd>
    </InfoPaneRow>
    <Collapse in={expanded} unmountOnExit>
      {children}
    </Collapse>
  </Item>
);
