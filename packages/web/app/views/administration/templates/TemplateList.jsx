import React, { useMemo } from 'react';

import { DataFetchingTable, DateDisplay, TranslatedEnum } from '../../../components';
import { TEMPLATE_ENDPOINT } from '../constants';
import { TEMPLATE_TYPES, TEMPLATE_TYPE_LABELS, REFERENCE_TYPES } from '@tamanu/constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { TranslatedReferenceData } from '../../../components/Translation';
import { useSuggestionsQuery } from '../../../api/queries/useSuggestionsQuery';

const getDisplayName = ({ createdBy }) => (createdBy || {}).displayName || 'Unknown';

export const TemplateList = React.memo((props) => {
  const { data: noteTypes = [] } = useSuggestionsQuery('noteType');

  const noteTypeNameMap = useMemo(() => {
    const map = new Map();
    noteTypes.forEach(noteType => {
      map.set(noteType.id, noteType.name);
    });
    return map;
  }, [noteTypes]);

  const renderTemplateType = (type) => {
    // If it's Patient Letter, use TranslatedEnum with TEMPLATE_TYPE_LABELS
    if (type === TEMPLATE_TYPES.PATIENT_LETTER) {
      return (
        <TranslatedEnum
          value={TEMPLATE_TYPES.PATIENT_LETTER}
          enumValues={TEMPLATE_TYPE_LABELS}
          data-testid="translatedenum-kmfz"
        />
      );
    }

    return (
      <TranslatedReferenceData
        fallback={noteTypeNameMap.get(type) || type}
        value={type}
        category={REFERENCE_TYPES.NOTE_TYPE}
      />
    );
  };

  return (
    <DataFetchingTable
      endpoint={TEMPLATE_ENDPOINT}
      columns={[
        {
          key: 'type',
          title: (
            <TranslatedText
              stringId="general.type.label"
              fallback="Type"
              data-testid="translatedtext-vrku"
            />
          ),
          accessor: (record) => renderTemplateType(record.type),
          sortable: false,
        },
      {
        key: 'name',
        title: (
          <TranslatedText
            stringId="patientLetterTemplate.templateName.label"
            fallback="Template name"
            data-testid="translatedtext-phs6"
          />
        ),
        sortable: false,
      },
      {
        key: 'title',
        title: (
          <TranslatedText
            stringId="general.localisedField.title.label"
            fallback="Title"
            data-testid="translatedtext-9glj"
          />
        ),
        sortable: false,
      },
      {
        key: 'dateCreated',
        title: (
          <TranslatedText
            stringId="admin.template.table.column.createdOn"
            fallback="Created on"
            data-testid="translatedtext-w1zn"
          />
        ),
        accessor: ({ dateCreated }) => (
          <DateDisplay date={dateCreated} data-testid="datedisplay-lyfl" />
        ),
        sortable: false,
      },
      {
        key: 'createdBy',
        title: (
          <TranslatedText
            stringId="admin.template.table.column.createdBy"
            fallback="Created by"
            data-testid="translatedtext-o5kk"
          />
        ),
        accessor: getDisplayName,
        sortable: false,
      },
      {
        key: 'body',
        title: (
          <TranslatedText
            stringId="admin.template.content.label"
            fallback="Contents"
            data-testid="translatedtext-v93w"
          />
        ),
        maxWidth: 200,
        sortable: false,
      },
    ]}
    noDataMessage={
      <TranslatedText
        stringId="admin.template.table.noData"
        fallback="No templates found"
        data-testid="translatedtext-wgb7"
      />
    }
      {...props}
      data-testid="datafetchingtable-jb8p"
    />
  );
});
