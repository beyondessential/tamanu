import React from 'react';
import { startCase } from 'lodash';

import { MultilineDatetimeDisplay } from '../../DateDisplay';
import { getImagingRequestType } from '../../../utils/getImagingRequestType';
import { getAreaNote } from '../../../utils/areaNote';
import { useLocalisation } from '../../../contexts/Localisation';
import { TranslatedText } from '../../Translation/TranslatedText';

export const COLUMN_KEYS = {
  ID: 'displayId',
  SELECTED: 'selected',
  REQUESTED_DATE: 'requestedDate',
  REQUESTED_BY: 'requestedBy',
  PRIORITY: 'priority',
  TYPE: 'imagingType',
  AREAS: 'areas',
};

const ImagingType = ({ imagingType }) => {
  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};
  return getImagingRequestType(imagingTypes)({ imagingType });
};

const COMMON_COLUMNS = [
  {
    key: COLUMN_KEYS.ID,
    title: (
      <TranslatedText
        stringId="imaging.requestId.label"
        fallback="Request ID"
        data-testid="translatedtext-req-id"
      />
    ),
    sortable: false,
    printout: { widthProportion: 4 },
  },
  {
    key: COLUMN_KEYS.REQUESTED_DATE,
    title: (
      <TranslatedText
        stringId="general.requestDateTime.label"
        fallback="Request date & time"
        data-testid="translatedtext-req-datetime"
      />
    ),
    sortable: false,
    form: {
      accessor: ({ requestedDate }) => (
        <MultilineDatetimeDisplay
          date={requestedDate}
          data-testid="multilinedatetimedisplay-s1fw"
        />
      ),
    },
    printout: {
      widthProportion: 4,
      accessor: ({ requestedDate }) => (
        <MultilineDatetimeDisplay
          date={requestedDate}
          isTimeSoft={false}
          data-testid="multilinedatetimedisplay-ghti"
        />
      ),
    },
  },
  {
    key: COLUMN_KEYS.REQUESTED_BY,
    title: (
      <TranslatedText
        stringId="general.requestedBy.label"
        fallback="Requested by"
        data-testid="translatedtext-req-by"
      />
    ),
    sortable: false,
    maxWidth: 300,
    accessor: ({ requestedBy }) => requestedBy?.displayName || '',
    printout: { widthProportion: 4 },
  },
  {
    key: COLUMN_KEYS.PRIORITY,
    title: (
      <TranslatedText
        stringId="imaging.priority.label"
        fallback="Priority"
        data-testid="translatedtext-priority"
      />
    ),
    sortable: false,
    form: { hidden: true },
    accessor: ({ priority }) => startCase(priority),
    printout: { widthProportion: 3 },
  },
  {
    key: COLUMN_KEYS.TYPE,
    title: (
      <TranslatedText
        stringId="general.type.label"
        fallback="Type"
        data-testid="translatedtext-type"
      />
    ),
    sortable: false,
    maxWidth: 70,
    accessor: ({ imagingType }) => (
      <ImagingType imagingType={imagingType} data-testid="imagingtype-kkkm" />
    ),
    printout: { widthProportion: 4 },
  },
  {
    key: COLUMN_KEYS.AREAS,
    title: (
      <TranslatedText
        stringId="imaging.areasToBeImaged.label"
        fallback="Areas to be imaged"
        data-testid="translatedtext-areas"
      />
    ),
    sortable: false,
    accessor: getAreaNote,
    printout: { widthProportion: 6 },
  },
];

export const FORM_COLUMNS = COMMON_COLUMNS.filter(c => !c.form?.hidden).map(
  // printout is taken out of ...column
  // eslint-disable-next-line no-unused-vars
  ({ printout, form, ...column }) => ({
    ...column,
    ...form,
  }),
);

export const PRINTOUT_COLUMNS = COMMON_COLUMNS.filter(c => !c.printout?.hidden).map(
  // form is taken out of ...column
  // eslint-disable-next-line no-unused-vars
  ({ printout, form, ...column }) => ({
    ...column,
    ...printout,
  }),
);
