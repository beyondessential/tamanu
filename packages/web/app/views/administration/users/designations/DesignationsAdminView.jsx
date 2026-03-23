import React, { useCallback, useState } from 'react';
import { useMatch, useNavigate, useSearchParams } from 'react-router';

import { TranslatedText } from '../../../../components';
import { ThreeDotMenu } from '../../../../components/ThreeDotMenu';
import { DESIGNATIONS_ENDPOINT } from '../../constants';
import { AddButton, Article, Header, plusIcon, StyledDataFetchingTable } from '../components';
import { AddDesignationModal } from './AddDesignationModal';
import { DeleteDesignationModal } from './DeleteDesignationModal';
import { DesignationsSearchForm } from './DesignationsSearchForm';

const ActionMenu = ({ data }) => {
  const navigate = useNavigate();
  return (
    <ThreeDotMenu
      items={[
        {
          label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
          onClick: () =>
            navigate({
              pathname: `delete/${encodeURIComponent(data.id)}`,
              search: window.location.search,
            }),
        },
      ]}
    />
  );
};

const columns = /** @type {const} */ ([
  {
    key: 'name',
    title: <TranslatedText stringId="admin.designations.name.column" fallback="Name" />,
    sortable: true,
  },
  {
    key: 'id',
    title: <TranslatedText stringId="admin.designations.id.column" fallback="ID" />,
    sortable: true,
  },
  {
    CellComponent: ActionMenu,
    dontCallRowInput: true,
    isExportable: false,
    key: 'actions',
    numeric: true, // Not really, but applies align="right" to MUI TableCell
    sortable: false,
    title: '',
  },
]);

export const DesignationsAdminView = () => {
  // Search state
  const [searchParams] = useSearchParams();
  const idQuery = searchParams.get('id') ?? undefined;
  const nameQuery = searchParams.get('name') ?? undefined;

  // DataFetchingTable state
  const [refreshCount, setRefreshCount] = useState(0);
  const refreshDataTable = useCallback(() => setRefreshCount(c => c + 1), []);

  // ‘Add designation’ modal route
  const isAddRoute = Boolean(useMatch('/admin/users/rolesAndDesignations/designations/new'));
  const navigate = useNavigate();

  return (
    <Article>
      <Header>
        <DesignationsSearchForm />
        <AddButton onClick={() => navigate({ pathname: 'new', search: window.location.search })}>
          {plusIcon}
          <TranslatedText stringId="general.action.add-designation" fallback="Add designation" />
        </AddButton>
      </Header>
      <StyledDataFetchingTable
        columns={columns}
        defaultRowsPerPage={10}
        endpoint={DESIGNATIONS_ENDPOINT}
        fetchOptions={{ id: idQuery, name: nameQuery }}
        initialSort={{ orderBy: 'name', order: 'asc' }}
        noDataMessage={
          <TranslatedText
            stringId="admin.designations.noData.message"
            fallback="No designations found"
          />
        }
        refreshCount={refreshCount}
      />

      <AddDesignationModal
        open={isAddRoute}
        onClose={() => navigate({ pathname: '..', search: window.location.search })}
        onSuccess={() => setRefreshCount(c => c + 1)}
      />

      <DeleteDesignationModal onSuccess={refreshDataTable} />
    </Article>
  );
};
