import React from 'react';

import { DataFetchingTable, DateDisplay } from '../../../components';
import { TEMPLATE_ENDPOINT } from '../constants';
import { TEMPLATE_TYPE_LABELS } from '@tamanu/constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const getDisplayName = ({ createdBy }) => (createdBy || {}).displayName || 'Unknown';

export const TemplateList = React.memo(props => (
  <DataFetchingTable
    endpoint={TEMPLATE_ENDPOINT}
    columns={[
      {
        key: 'type',
        title: <TranslatedText stringId="general.type.label" fallback="Type" />,
        accessor: record => TEMPLATE_TYPE_LABELS[record.type],
        sortable: false,
      },
      {
        key: 'name',
        title: (
          <TranslatedText
            stringId="patientLetterTemplate.templateName.label"
            fallback="Template name"
          />
        ),
        sortable: false,
      },
      {
        key: 'title',
        title: <TranslatedText stringId="general.localisedField.title.label" fallback="Title" />,
        sortable: false,
      },
      {
        key: 'dateCreated',
        title: <TranslatedText stringId="admin.template.table.column.createdOn" fallback="Created on" />,
        accessor: ({ dateCreated }) => <DateDisplay date={dateCreated} />,
        sortable: false,
      },
      {
        key: 'createdBy',
        title: <TranslatedText stringId="admin.template.table.column.createdBy" fallback="Created by" />,
        accessor: getDisplayName,
        sortable: false,
      },
      {
        key: 'body',
        title: <TranslatedText stringId="admin.template.content.label" fallback="Contents" />,
        maxWidth: 200,
        sortable: false,
      },
    ]}
    noDataMessage={
      <TranslatedText stringId="admin.template.table.noData" fallback="No templates found" />
    }
    {...props}
  />
));
