import React from 'react';

import { DateDisplay } from '../../DateDisplay';
import { getImagingRequestType } from '../../../utils/getImagingRequestType';
import { getAreaNote } from '../../../utils/areaNote';
import { useLocalisation } from '../../../contexts/Localisation';

export const COLUMN_KEYS = {
  ID: 'id',
  SELECTED: 'selected',
  REQUESTED_DATE: 'requestedDate',
  REQUESTED_BY: 'requestedBy',
  URGENT: 'urgent',
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
    title: 'Request ID',
    sortable: false,
    printout: { widthProportion: 4 },
  },
  {
    key: COLUMN_KEYS.REQUESTED_DATE,
    title: 'Request date',
    sortable: false,
    accessor: ({ requestedDate }) => <DateDisplay date={requestedDate} />,
    printout: { widthProportion: 4 },
  },
  {
    key: COLUMN_KEYS.REQUESTED_BY,
    title: 'Requesting clinician',
    sortable: false,
    maxWidth: 300,
    accessor: ({ requestedBy }) => requestedBy?.displayName || '',
    printout: { widthProportion: 4 },
  },
  {
    key: COLUMN_KEYS.URGENT,
    title: 'Urgent',
    sortable: false,
    accessor: ({ priority }) => (priority?.toLowerCase() === 'urgent' ? 'Yes' : 'No'),
    form: { hidden: true },
    printout: { widthProportion: 3 },
  },
  {
    key: COLUMN_KEYS.TYPE,
    title: 'Type',
    sortable: false,
    maxWidth: 70,
    accessor: ({ imagingType }) => <ImagingType imagingType={imagingType} />,
    printout: { widthProportion: 4 },
  },
  {
    key: COLUMN_KEYS.AREAS,
    title: 'Areas to be imaged',
    sortable: false,
    accessor: getAreaNote,
    printout: { widthProportion: 6 },
  },
];

export const FORM_COLUMNS = COMMON_COLUMNS.filter(c => !c.form?.hidden).map(
  ({ printout, form, ...column }) => ({
    ...column,
    ...form,
  }),
);

export const PRINTOUT_COLUMNS = COMMON_COLUMNS.filter(c => !c.printout?.hidden).map(
  ({ printout, form, ...column }) => ({
    ...column,
    ...printout,
  }),
);
