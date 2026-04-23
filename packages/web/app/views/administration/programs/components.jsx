import React from 'react';
import styled from 'styled-components';

import { NONPATIENT_VISIBILITY_STATUS_VALUES, STATUS_COLOR } from '@tamanu/constants';
import {
  Field,
  SelectField,
  TAMANU_COLORS,
  TranslatedText,
  TranslatedVisibilityStatus,
  VisibilityStatusChip,
} from '@tamanu/ui-components';
import { Colors } from '../../../constants';
import { ContentContainer } from '../components/AdminViewContainer';

export const Article = styled.article`
  overflow: auto;
  padding-block: 26px;
  padding-inline: 30px;
  ${ContentContainer}:has(&) {
    background-color: ${TAMANU_COLORS.background2};
  }
`;

export const TableScopeHeader = styled.header`
  align-items: flex-end;
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-start-end-radius: 0.3125rem;
  border-start-start-radius: 0.3125rem;
  display: flex;
  gap: 10px;
  padding-block: 16px;
  padding-inline: 24px;
`;

export const TableScopeSelect = styled(SelectField).attrs({
  isClearable: false,
})`
  min-inline-size: 23rem;
`;

export const programRegistryClinicalStatusColorOptions = Object.keys(STATUS_COLOR)
  .sort()
  .map(key => ({
    value: key,
    label: key,
  }));

export function ProgramRegistryClinicalStatusColorField({ isClearable = false, ...props }) {
  return (
    <Field
      isClearable={isClearable}
      {...props}
      component={SelectField}
      options={programRegistryClinicalStatusColorOptions}
    />
  );
}

export const visibilityStatusOptions = NONPATIENT_VISIBILITY_STATUS_VALUES.map(value => ({
  value,
  label: <TranslatedVisibilityStatus visibilityStatus={value} />,
}));

export function VisibilityStatusField({ isClearable = false, ...props }) {
  return (
    <Field
      isClearable={isClearable}
      {...props}
      component={SelectField}
      options={visibilityStatusOptions}
    />
  );
}

const Empty = styled.em`
  color: ${TAMANU_COLORS.softText};
`;

const Uppercase = styled.span`
  text-transform: uppercase;
`;

export function VisibilityStatusCell({ visibilityStatus }) {
  return visibilityStatus ? (
    <VisibilityStatusChip visibilityStatus={visibilityStatus} />
  ) : (
    <Empty>
      <TranslatedText stringId="general.none" fallback="None" />
    </Empty>
  );
}

export function NullableBooleanCell({ value }) {
  if (value == null)
    return (
      <Empty>
        <TranslatedText stringId="general.unknown" fallback="Unknown" />
      </Empty>
    );

  return (
    <Uppercase>
      {value ? (
        <TranslatedText stringId="general.boolean.true" fallback="True" />
      ) : (
        <TranslatedText stringId="general.boolean.false" fallback="False" />
      )}
    </Uppercase>
  );
}
