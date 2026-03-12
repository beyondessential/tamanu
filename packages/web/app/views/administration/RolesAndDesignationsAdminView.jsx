import React from 'react';
import styled from 'styled-components';

import { DataFetchingTable, TranslatedText } from '../../components';
import { Colors } from '../../constants';
import { AdminViewContainer } from './components/AdminViewContainer';
import { ROLES_ENDPOINT } from './constants';

const TableContainer = styled.div`
  padding: 24px 30px;
  background-color: ${Colors.background};
  border-top: 1px solid ${Colors.outline};
`;

const COLUMNS = /** @type {const} */ ([
  {
    key: 'name',
    title: <TranslatedText stringId="admin.roles.name.column" fallback="Name" />,
    sortable: true,
  },
  {
    key: 'id',
    title: <TranslatedText stringId="admin.roles.id.column" fallback="ID" />,
    sortable: true,
  },
]);

export const RolesAndDesignationsAdminView = () => (
  <AdminViewContainer
    title={
      <TranslatedText
        stringId="adminSidebar.rolesAndDesignations"
        fallback="Roles & designations"
        data-testid="translatedtext-roles-designations-title"
      />
    }
  >
    <TableContainer>
      <DataFetchingTable
        endpoint={ROLES_ENDPOINT}
        columns={COLUMNS}
        noDataMessage={
          <TranslatedText stringId="admin.roles.noData.message" fallback="No roles found" />
        }
        defaultRowsPerPage={10}
        initialSort={{ orderBy: 'name', order: 'asc' }}
        data-testid="roles-table"
        allowExport={false}
      />
    </TableContainer>
  </AdminViewContainer>
);
