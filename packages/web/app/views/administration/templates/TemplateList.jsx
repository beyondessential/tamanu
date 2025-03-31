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
          data-testid='translatedtext-7d6s' />,
        accessor: record => (
          <TranslatedEnum
            value={record.type}
            enumValues={TEMPLATE_TYPE_LABELS}
            data-testid='translatedenum-7r6a' />
        ),
        sortable: false,
      },
      {
        key: 'name',
        title: (
          <TranslatedText
            stringId="patientLetterTemplate.templateName.label"
            fallback="Template name"
            data-testid='translatedtext-ry7n' />
        ),
        sortable: false,
      },
      {
        key: 'title',
        title: <TranslatedText
          stringId="general.localisedField.title.label"
          fallback="Title"
          data-testid='translatedtext-j0on' />,
        sortable: false,
      },
      {
        key: 'dateCreated',
        title: (
          <TranslatedText
            stringId="admin.template.table.column.createdOn"
            fallback="Created on"
            data-testid='translatedtext-ifxa' />
        ),
        accessor: ({ dateCreated }) => <DateDisplay date={dateCreated} data-testid='datedisplay-7jge' />,
        sortable: false,
      },
      {
        key: 'createdBy',
        title: (
          <TranslatedText
            stringId="admin.template.table.column.createdBy"
            fallback="Created by"
            data-testid='translatedtext-mzz0' />
        ),
        accessor: getDisplayName,
        sortable: false,
      },
      {
        key: 'body',
        title: <TranslatedText
          stringId="admin.template.content.label"
          fallback="Contents"
          data-testid='translatedtext-akke' />,
        maxWidth: 200,
        sortable: false,
      },
    ]}
    noDataMessage={
      <TranslatedText
        stringId="admin.template.table.noData"
        fallback="No templates found"
        data-testid='translatedtext-aocs' />
    }
    {...props}
    data-testid='datafetchingtable-ue8m' />
));
