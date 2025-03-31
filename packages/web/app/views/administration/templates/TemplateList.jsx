import React from 'react';

import { DataFetchingTable, DateDisplay, TranslatedEnum } from '../../../components';
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
        title: <TranslatedText
          stringId="general.type.label"
          fallback="Type"
          data-test-id='translatedtext-7d6s' />,
        accessor: record => (
          <TranslatedEnum
            value={record.type}
            enumValues={TEMPLATE_TYPE_LABELS}
            data-test-id='translatedenum-7r6a' />
        ),
        sortable: false,
      },
      {
        key: 'name',
        title: (
          <TranslatedText
            stringId="patientLetterTemplate.templateName.label"
            fallback="Template name"
            data-test-id='translatedtext-ry7n' />
        ),
        sortable: false,
      },
      {
        key: 'title',
        title: <TranslatedText
          stringId="general.localisedField.title.label"
          fallback="Title"
          data-test-id='translatedtext-j0on' />,
        sortable: false,
      },
      {
        key: 'dateCreated',
        title: (
          <TranslatedText
            stringId="admin.template.table.column.createdOn"
            fallback="Created on"
            data-test-id='translatedtext-ifxa' />
        ),
        accessor: ({ dateCreated }) => <DateDisplay date={dateCreated} data-test-id='datedisplay-7jge' />,
        sortable: false,
      },
      {
        key: 'createdBy',
        title: (
          <TranslatedText
            stringId="admin.template.table.column.createdBy"
            fallback="Created by"
            data-test-id='translatedtext-mzz0' />
        ),
        accessor: getDisplayName,
        sortable: false,
      },
      {
        key: 'body',
        title: <TranslatedText
          stringId="admin.template.content.label"
          fallback="Contents"
          data-test-id='translatedtext-akke' />,
        maxWidth: 200,
        sortable: false,
      },
    ]}
    noDataMessage={
      <TranslatedText
        stringId="admin.template.table.noData"
        fallback="No templates found"
        data-test-id='translatedtext-aocs' />
    }
    {...props}
    data-test-id='datafetchingtable-ue8m' />
));
