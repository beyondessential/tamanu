import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import React, { useCallback, useMemo, useState } from 'react';
import { Outlet, useLocation, useMatch, useNavigate, useParams } from 'react-router';
import styled from 'styled-components';

import { CURRENTLY_AT_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { FORM_TYPES } from '@tamanu/constants/forms';
import * as yup from 'yup';
import {
  Button,
  Field,
  Form,
  OutlinedButton,
  ReadOnlyTextField,
  SelectField,
  TextField,
  TranslatedText,
} from '@tamanu/ui-components';
import { FormModal } from '../../../../components';
import { TabDisplay } from '../../../../components/TabDisplay';
import { Colors } from '../../../../constants';
import { notifySuccess } from '../../../../utils';
import { ContentContainer } from '../../components/AdminViewContainer';
import { VisibilityStatusChip } from './components';
import {
  useProgramRegistriesQuery,
  useProgramRegistryMutation,
  useProgramRegistryQuery,
} from './queries';

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
  background-color: unset;
  border-bottom: unset;
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

const visibilityStatusSelectOptions = [
  VISIBILITY_STATUSES.CURRENT,
  VISIBILITY_STATUSES.HISTORICAL,
].map(value => ({
  value,
  label: value,
}));

const currentlyAtTypeSelectOptions = Object.values(CURRENTLY_AT_TYPES).map(value => ({
  value,
  label: value,
}));

const Fieldset = styled.fieldset`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 0.8rem;
`;

const Footer = styled.footer`
  border-block-start: 1px solid ${props => props.theme.palette.divider};
  display: flex;
  flex-direction: row-reverse;
  gap: 16px;
  justify-content: flex-start;
  margin-block-start: 24px;
  padding-block-start: 20px;
`;

const metadataValidationSchema = yup.object().shape({
  name: yup.string().trim().required('Required'),
  visibilityStatus: yup
    .string()
    .required('Required')
    .oneOf([VISIBILITY_STATUSES.CURRENT, VISIBILITY_STATUSES.HISTORICAL]),
  currentlyAtType: yup.string().required('Required'),
});

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
    const subPath = tabPathSegments.has(lastSegment) ? lastSegment : TabKey.ClinicalStatuses;
    navigate(`/admin/programs/registries/${encodeURIComponent(next)}/${subPath}`);
  };

  const { data: registries } = useProgramRegistriesQuery({
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

  const {
    data: registry,
    isLoading: isRegistryLoading,
    isSuccess: isRegistrySuccess,
  } = useProgramRegistryQuery(programRegistryId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const openMetadataModal = useCallback(() => void setIsModalOpen(true), []);
  const closeMetadataModal = useCallback(() => void setIsModalOpen(false), []);

  const { mutateAsync: mutateProgramRegistry } = useProgramRegistryMutation({
    onSuccess: () => {
      setIsModalOpen(false);
      notifySuccess(
        <TranslatedText
          stringId="admin.programRegistries.metadataUpdateSuccess"
          fallback="Program registry updated"
        />,
      );
    },
  });

  const metadataInitialValues = useMemo(
    () => ({
      code: registry?.code ?? '',
      name: registry?.name ?? '',
      visibilityStatus: registry?.visibilityStatus ?? '',
      currentlyAtType: registry?.currentlyAtType ?? '',
    }),
    [registry],
  );

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
        <Button
          disabled={!isRegistrySuccess}
          onClick={openMetadataModal}
          style={{ marginInlineStart: 'auto' }}
        >
          <TranslatedText
            stringId="admin.programRegistries.editMetadata"
            fallback="Edit program registry metadata"
          />
        </Button>
      </Header>
      <FormModal
        onClose={closeMetadataModal}
        open={isModalOpen}
        title={
          <TranslatedText
            stringId="admin.programRegistries.editMetadata"
            fallback="Edit program registry metadata"
          />
        }
      >
        {isModalOpen && registry ? (
          <Form
            enableReinitialize
            formType={FORM_TYPES.EDIT_FORM}
            initialValues={metadataInitialValues}
            onSubmit={async values => {
              if (!programRegistryId) return;
              await mutateProgramRegistry({
                programRegistryId,
                name: values.name,
                visibilityStatus: values.visibilityStatus,
                currentlyAtType: values.currentlyAtType,
              });
            }}
            render={({ submitForm, isSubmitting }) => (
              <>
                <Fieldset>
                  <Field name="code" component={ReadOnlyTextField} label="code" />
                  <Field name="name" component={TextField} disabled={isSubmitting} label="name" />
                  <Field
                    name="visibilityStatus"
                    component={SelectField}
                    disabled={isSubmitting}
                    isClearable={false}
                    label="visibilityStatus"
                    options={visibilityStatusSelectOptions}
                  />
                  <Field
                    name="currentlyAtType"
                    component={SelectField}
                    disabled={isSubmitting}
                    isClearable={false}
                    label="currentlyAtType"
                    options={currentlyAtTypeSelectOptions}
                  />
                </Fieldset>
                <Footer>
                  <Button isSubmitting={isSubmitting} onClick={submitForm} type="submit">
                    <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                  </Button>
                  <OutlinedButton
                    disabled={isSubmitting}
                    onClick={closeMetadataModal}
                    type="button"
                  >
                    <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                  </OutlinedButton>
                </Footer>
              </>
            )}
            validationSchema={metadataValidationSchema}
          />
        ) : null}
      </FormModal>
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
