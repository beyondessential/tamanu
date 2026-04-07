import React, { useMemo } from 'react';
import { Outlet, useLocation, useMatch, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';

import { Chip } from '@mui/material';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { Button, SelectField, TranslatedText } from '@tamanu/ui-components';
import { TabContainer, TabDisplay } from '../../../../components/TabDisplay';
import { Colors } from '../../../../constants';
import { ContentContainer } from '../../components/AdminViewContainer';
import { useAdminProgramRegistriesQuery, useAdminProgramRegistryQuery } from './queries';

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

const programRegistryVisibilityChipCopy = {
  [VISIBILITY_STATUSES.CURRENT]: {
    stringId: 'admin.programRegistries.visibilityStatus.current',
    fallback: 'Current',
  },
  [VISIBILITY_STATUSES.HISTORICAL]: {
    stringId: 'admin.programRegistries.visibilityStatus.historical',
    fallback: 'Historical',
  },
  [VISIBILITY_STATUSES.MERGED]: {
    stringId: 'admin.programRegistries.visibilityStatus.merged',
    fallback: 'Merged',
  },
};

export function ManageProgramRegistriesAdminView() {
  const { programRegistryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const switchToProgramRegistry = id => {
    const prev = programRegistryId ? String(programRegistryId) : '';
    const next = id ? String(id) : '';
    if (next === prev) return;
    if (!next) {
      navigate('/admin/programs/registries');
      return;
    }
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments.at(-1);
    const subPath = tabPathSegments.has(lastSegment) ? lastSegment : tab.ClinicalStatuses;
    navigate(`/admin/programs/registries/${encodeURIComponent(next)}/${subPath}`);
  };

  const { data: registries } = useAdminProgramRegistriesQuery({
    onSuccess: function defaultToFirst(data) {
      if (programRegistryId) return;
      const firstRegistryId = data?.[0]?.id;
      if (!firstRegistryId) return;
      switchToProgramRegistry(firstRegistryId);
    },
  });
  const options = useMemo(
    () => registries?.map(({ id, name }) => ({ value: id, label: name })) ?? [],
    [registries],
  );

  const { data: registry } = useAdminProgramRegistryQuery(programRegistryId);

  const isConditionsRoute = Boolean(
    useMatch('/admin/programs/registries/:programRegistryId/conditions'),
  );
  const isConditionCategoriesRoute = Boolean(
    useMatch('/admin/programs/registries/:programRegistryId/conditionCategories'),
  );
  const currentTab = (() => {
    if (isConditionsRoute) return tab.Conditions;
    if (isConditionCategoriesRoute) return tab.RelatedConditionCategories;
    return tab.ClinicalStatuses;
  })();

  const onTabSelect = tabKey => {
    if (!programRegistryId) return;
    navigate(`/admin/programs/registries/${encodeURIComponent(programRegistryId)}/${tabKey}`);
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
          onChange={e => switchToProgramRegistry(e.target.value)}
          options={options}
          value={programRegistryId ?? ''}
        />
        {programRegistryId && registry?.visibilityStatus && (
          <Chip
            label={
              <TranslatedText
                {...(programRegistryVisibilityChipCopy[registry.visibilityStatus] ?? {
                  stringId: 'admin.programRegistries.visibilityStatus.unknown',
                  fallback: registry.visibilityStatus,
                })}
              />
            }
            color="#ededed"
          />
        )}
        <Button style={{ marginInlineStart: 'auto' }}>
          <TranslatedText
            stringId="admin.programRegistries.editMetadata"
            fallback="Edit program registry metadata"
          />
        </Button>
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
