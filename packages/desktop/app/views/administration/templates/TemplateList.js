import React from 'react';

import { DataFetchingTable, DateDisplay } from '../../../components';
import { TEMPLATE_ENDPOINT } from '../constants';

const getDisplayName = ({ createdBy }) => (createdBy || {}).displayName || 'Unknown';

export const TemplateList = React.memo(props => (
  <DataFetchingTable
    endpoint={TEMPLATE_ENDPOINT}
    columns={[
      {
        key: 'type',
        title: 'Type',
        accessor: () => 'Patient Letter',
        sortable: false,
      },
      {
        key: 'name',
        title: 'Template name',
        sortable: false,
      },
      {
        key: 'title',
        title: 'Title',
        sortable: false,
      },
      {
        key: 'dateCreated',
        title: 'Created on',
        accessor: ({ dateCreated }) => <DateDisplay date={dateCreated} />,
        sortable: false,
      },
      {
        key: 'createdBy',
        title: 'Created by',
        accessor: getDisplayName,
        sortable: false,
      },
      {
        key: 'body',
        title: 'Contents',
        maxWidth: 200,
        sortable: false,
      },
    ]}
    noDataMessage="No templates found"
    {...props}
  />
));
