import React, { useMemo } from 'react';
import { Outlet, useLocation, useMatch, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';

import { Chip, tabsClasses } from '@mui/material';
import { Button, SelectField, TranslatedText } from '@tamanu/ui-components';
import { TabContainer, TabDisplay } from '../../../../components/TabDisplay';
import { Colors } from '../../../../constants';
import { ContentContainer } from '../../components/AdminViewContainer';
import { useAdminProgramRegistriesQuery } from './useAdminProgramRegistriesQuery';

export const Article = styled.article`
  overflow: auto;
  padding-block: 26px;
  padding-inline: 30px;
  ${ContentContainer}:has(&) {
    background-color: #f7f9fb;
  }
`;

const Header = styled.header`
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

const Select = styled(SelectField)`
  min-inline-size: 23rem;
`;

const StyledTabDisplay = styled(TabDisplay)`
  .MuiTabs-root {
    border-inline: 1px solid ${Colors.outline};
  }
  ${TabContainer} {
    background-color: unset;
    border-bottom: unset;
  }
`;

const tab = /** @type {const} */ ({
  ClinicalStatuses: 'statuses',
  Conditions: 'conditions',
  RelatedConditionCategories: 'conditionCategories',
});

const tabs = /** @type {const} */ ([
  {
    key: tab.ClinicalStatuses,
    label: (
      <TranslatedText
        stringId="admin.programRegistries.tab.statuses"
        fallback="Clinical Statuses"
      />
    ),
    render: Outlet,
  },
  {
    key: tab.Conditions,
    label: (
      <TranslatedText stringId="admin.programRegistries.tab.conditions" fallback="Conditions" />
    ),
    render: Outlet,
  },
  {
    key: tab.RelatedConditionCategories,
    label: (
      <TranslatedText
        stringId="admin.programRegistries.tab.conditionCategories"
        fallback="Related Condition Categories"
      />
    ),
    render: Outlet,
  },
]);

const tabPathSegments = new Set(Object.values(tab));

export function ManageProgramRegistriesAdminView() {
  const { programRegistryId } = useParams();
  const { data: registries } = useAdminProgramRegistriesQuery();
  const options = useMemo(
    () => registries?.map(({ id, name }) => ({ value: id, label: name })),
    [registries],
  );

  const navigate = useNavigate();
  const location = useLocation();

  const matchConditions = Boolean(
    useMatch('/admin/programs/registries/:programRegistryId/conditions'),
  );
  const matchRelatedConditionCategories = Boolean(
    useMatch('/admin/programs/registries/:programRegistryId/conditionCategories'),
  );

  const currentTab = matchRelatedConditionCategories
    ? tab.RelatedConditionCategories
    : matchConditions
      ? tab.Conditions
      : tab.ClinicalStatuses;

  const onTabSelect = tabKey => {
    if (!programRegistryId) return;
    navigate(`/admin/programs/registries/${encodeURIComponent(programRegistryId)}/${tabKey}`);
  };

  const onChange = event => {
    const id = event.target.value;
    const prev = programRegistryId ? String(programRegistryId) : '';
    const next = id ? String(id) : '';
    if (next === prev) return;
    if (!next) {
      navigate('/admin/programs/registries');
      return;
    }
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    const subPath = tabPathSegments.has(lastSegment) ? lastSegment : tab.ClinicalStatuses;
    navigate(`/admin/programs/registries/${encodeURIComponent(next)}/${subPath}`);
  };

  return (
    <Article>
      <Header>
        <Select
          isClearable={false}
          label={
            <TranslatedText
              stringId="admin.program-registry.select.label"
              fallback="Select program registry"
            />
          }
          name="programRegistryId"
          onChange={onChange}
          options={options}
          value={programRegistryId ?? ''}
        />
        <Chip color="#ededed" label="Historical" />
        <Button style={{ marginInlineStart: 'auto' }}>Edit program registry metadata</Button>
      </Header>
      {programRegistryId && (
        <StyledTabDisplay
          currentTab={currentTab}
          onTabSelect={onTabSelect}
          scrollable={false}
          tabs={tabs}
        />
      )}
    </Article>
  );
}
