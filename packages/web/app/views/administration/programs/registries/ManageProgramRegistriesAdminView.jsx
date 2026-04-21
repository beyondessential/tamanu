import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import React, { useId, useMemo } from 'react';
import { Link, Outlet, useLocation, useMatch, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';

import { TranslatedText, VisibilityStatusChip } from '@tamanu/ui-components';
import { TabDisplay } from '../../../../components/TabDisplay';
import { Colors } from '../../../../constants';
import { Article, TableScopeHeader, TableScopeSelect } from '../components';
import { EditProgramRegistryButton } from './EditProgramRegistryModal';
import { useProgramRegistriesQuery, useProgramRegistryQuery } from './queries';

const Metadata = styled.div`
  align-items: baseline;
  display: flex;
  font-size: 14px;
  gap: 10px;
  letter-spacing: 0.015em;
`;

const StyledTabDisplay = styled(TabDisplay)`
  background-color: unset;
  border-inline: 1px solid ${Colors.outline};
`;

const TabKey = /** @type {const} */ ({
  ClinicalStatuses: 'statuses',
  Conditions: 'conditions',
  RelatedConditionCategories: 'conditionCategories',
});

const tabs = /** @type {const} */ ([
  {
    key: TabKey.ClinicalStatuses,
    label: (
      <TranslatedText
        stringId="admin.programRegistries.tab.statuses"
        fallback="Clinical statuses"
      />
    ),
    render: Outlet,
  },
  {
    key: TabKey.Conditions,
    label: (
      <TranslatedText stringId="admin.programRegistries.tab.conditions" fallback="Conditions" />
    ),
    render: Outlet,
  },
  {
    key: TabKey.RelatedConditionCategories,
    label: (
      <TranslatedText
        stringId="admin.programRegistries.tab.conditionCategories"
        fallback="Related condition categories"
      />
    ),
    render: Outlet,
  },
]);

const tabPathSegments = new Set(Object.values(TabKey));

export function ManageProgramRegistriesAdminView() {
  const { programRegistryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const scopedTableId = useId();

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
    const subPath = tabPathSegments.has(lastSegment) ? lastSegment : TabKey.ClinicalStatuses;
    navigate(`/admin/programs/registries/${encodeURIComponent(next)}/${subPath}`);
  };

  const { data: registries, isLoading: isRegistriesLoading } = useProgramRegistriesQuery({
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

  const {
    data: registry,
    isLoading: isRegistryLoading,
    isSuccess: isRegistrySuccess,
  } = useProgramRegistryQuery(programRegistryId);

  const isConditionsRoute = Boolean(
    useMatch('/admin/programs/registries/:programRegistryId/conditions'),
  );
  const isConditionCategoriesRoute = Boolean(
    useMatch('/admin/programs/registries/:programRegistryId/conditionCategories'),
  );
  const currentTab = (() => {
    if (isConditionsRoute) return TabKey.Conditions;
    if (isConditionCategoriesRoute) return TabKey.RelatedConditionCategories;
    return TabKey.ClinicalStatuses;
  })();

  const onTabSelect = tabKey => {
    if (!programRegistryId) return;
    navigate(`/admin/programs/registries/${encodeURIComponent(programRegistryId)}/${tabKey}`);
  };

  return (
    <Article>
      <TableScopeHeader>
        <TableScopeSelect
          aria-busy={isRegistriesLoading}
          // This aria-controls attribute gets attached to the MuiFormControl-root (default <div>),
          // but I couldn’t find any appropriate <select> (or any `role="combobox"` node) rendered
          // by react-select to forward it to.
          aria-controls={scopedTableId}
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
            registry?.program && (
              <Typography variant="body1" style={{ fontSize: 'inherit' }}>
                <Link
                  to={`/admin/programs/forms/manage/${encodeURIComponent(registry.program.id)}`}
                >
                  {registry.program.name}
                </Link>
              </Typography>
            )
          )}
        </Metadata>
        <EditProgramRegistryButton
          disabled={!isRegistrySuccess}
          style={{ marginInlineStart: 'auto' }}
        />
      </TableScopeHeader>
      <article id={scopedTableId}>
        {programRegistryId && (
          <StyledTabDisplay
            currentTab={currentTab}
            onTabSelect={onTabSelect}
            scrollable={false}
            tabs={tabs}
          />
        )}
      </article>
    </Article>
  );
}
