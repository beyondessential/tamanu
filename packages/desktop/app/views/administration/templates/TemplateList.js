import ms from 'ms';
import React from 'react';

import { TopBar, PageContainer, DataFetchingTable, DateDisplay } from '../../../components';
import { TEMPLATE_ENDPOINT } from '../constants';

export const TemplateList = React.memo(props => (
  <DataFetchingTable
    endpoint={TEMPLATE_ENDPOINT}
    columns={[
      {
        key: 'type',
        title: 'Type',
        accessor: () => 'Patient Letter',
      },
      {
        key: 'name',
        title: 'Template name',
      },
      {
        key: 'title',
        title: 'Title',
      },
      {
        key: 'dateCreated',
        title: 'Created on',
        accessor: ({ dateCreated }) => <DateDisplay date={dateCreated} />,
      },
      {
        key: 'createdBy',
        title: 'Created by',
        // accessor: ({ completedAt }) => <DateDisplay date={completedAt} showTime />,
      },
      {
        key: 'body',
        title: 'Contents',
      },
    ]}
    noDataMessage="No data"
    {...props}
  />
));
