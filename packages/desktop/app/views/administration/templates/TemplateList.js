import ms from 'ms';
import React from 'react';

import { TopBar, PageContainer, DataFetchingTable, DateDisplay } from '../../../components';

export const TemplateList = React.memo(props => (
  <DataFetchingTable
    endpoint={'admin/patientLetterTemplate'}
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
        // accessor: ({ completedAt }) => <DateDisplay date={completedAt} showTime />,
      },
      {
        key: 'date_created',
        title: 'Created on',
        accessor: ({ completedAt }) => <DateDisplay date={completedAt} showTime />,
      },
      {
        key: 'created_by',
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
