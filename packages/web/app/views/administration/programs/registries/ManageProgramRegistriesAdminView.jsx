import Skeleton from '@mui/material/Skeleton';
import { tabsClasses } from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import React, { useMemo } from 'react';
import { Outlet, useLocation, useMatch, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';

import { Button, SelectField, TranslatedText } from '@tamanu/ui-components';
import { TabContainer, TabDisplay } from '../../../../components/TabDisplay';
import { Colors } from '../../../../constants';
import { ContentContainer } from '../../components/AdminViewContainer';
import { VisibilityStatusChip } from './components';
import { useProgramRegistriesQuery, useProgramRegistryQuery } from './queries';

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

const Metadata = styled.div`
  align-items: baseline;
  display: flex;
  font-size: 14px;
  gap: 10px;
  letter-spacing: 0.015em;
`;

const StyledTabDisplay = styled(TabDisplay)`
  .${tabsClasses.root} {
    border-inline: 1px solid ${Colors.outline};
  }
  ${TabContainer} {
    background-color: unset;
    border-bottom: unset;
  }
`;

const Tab = /** @type {const} */ ({
  ClinicalStatuses: 'statuses',
  Conditions: 'conditions',
  RelatedConditionCategories: 'conditionCategories',
});

const tabs = /** @type {const} */ ([
  {
    key: Tab.ClinicalStatuses,
    label: (
      <TranslatedText
        stringId="admin.programRegistries.tab.statuses"
        fallback="Clinical statuses"
      />
    ),
    render: Outlet,
  },
  {
    key: Tab.Conditions,
    label: (
      <TranslatedText stringId="admin.programRegistries.tab.conditions" fallback="Conditions" />
    ),
    render: Outlet,
  },
  {
    key: Tab.RelatedConditionCategories,
    label: (
      <TranslatedText
        stringId="admin.programRegistries.tab.conditionCategories"
        fallback="Related condition categories"
      />
    ),
    render: Outlet,
  },
]);

const tabPathSegments = new Set(Object.values(Tab));

export function ManageProgramRegistriesAdminView() {
  const { programRegistryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const switchProgramRegistry = id => {
    const prev = programRegistryId ? String(programRegistryId) : '';
    const next = id ? String(id) : '';
    if (next === prev) return;
    if (!next) {
      navigate('/admin/programs/registries');
      return;
    }
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const lastSegment = pathSegments.at(-1);
    const subPath = tabPathSegments.has(lastSegment) ? lastSegment : Tab.ClinicalStatuses;
    navigate(`/admin/programs/registries/${encodeURIComponent(next)}/${subPath}`);
  };

  const { data: registries } = useProgramRegistriesQuery({
    onSuccess: function defaultToFirst(data) {
      if (programRegistryId) return;
      const firstRegistryId = data?.[0]?.id;
      if (!firstRegistryId) return;
      switchProgramRegistry(firstRegistryId);
    },
  });
  const options = useMemo(
    () => registries?.map(({ id, name }) => ({ value: id, label: name })) ?? [],
    [registries],
  );

  const { data: registry, isLoading: isRegistryLoading } =
    useProgramRegistryQuery(programRegistryId);

  const isConditionsRoute = Boolean(
    useMatch('/admin/programs/registries/:programRegistryId/conditions'),
  );
  const isConditionCategoriesRoute = Boolean(
    useMatch('/admin/programs/registries/:programRegistryId/conditionCategories'),
  );
  const currentTab = (() => {
    if (isConditionsRoute) return Tab.Conditions;
    if (isConditionCategoriesRoute) return Tab.RelatedConditionCategories;
    return Tab.ClinicalStatuses;
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
              stringId="admin.programRegistry.select.label"
              fallback="Select program registry"
            />
          }
          name="programRegistryId"
          onChange={e => switchProgramRegistry(e.target.value)}
          options={options}
          value={programRegistryId ?? ''}
        />
        <Metadata aria-busy={isRegistryLoading}>
          <VisibilityStatusChip
            isLoading={isRegistryLoading}
            visibilityStatus={registry?.visibilityStatus}
          />
          {isRegistryLoading ? (
            <Skeleton animation="wave" variant="text" width="25ch" />
          ) : (
            registry?.program?.name && (
              <Typography variant="body1" style={{ fontSize: 'inherit' }}>
                {registry.program.name}
              </Typography>
            )
          )}
        </Metadata>
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
