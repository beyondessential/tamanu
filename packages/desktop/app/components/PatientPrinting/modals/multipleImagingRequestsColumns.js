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
  TYPE: 'imagingType',
  AREAS: 'areas',
};

const ImagingType = () => {
  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};
  return getImagingRequestType(imagingTypes);
};

const COMMON_COLUMNS = [
  {
    key: COLUMN_KEYS.ID,
    title: 'Request ID',
    sortable: false,
  },
  {
    key: COLUMN_KEYS.REQUESTED_DATE,
    title: 'Request date',
    sortable: false,
    accessor: ({ requestedDate }) => <DateDisplay date={requestedDate} />,
  },
  {
    key: COLUMN_KEYS.REQUESTED_BY,
    title: 'Requested by',
    sortable: false,
    maxWidth: 300,
    accessor: ({ requestedBy }) => requestedBy?.displayName || '',
  },
  {
    key: COLUMN_KEYS.TYPE,
    title: 'Type',
    sortable: false,
    maxWidth: 70,
    accessor: ({ imagingType }) => <ImagingType imagingType={imagingType} />,
  },
  {
    key: COLUMN_KEYS.AREAS,
    title: 'Areas to be imaged',
    sortable: false,
    accessor: getAreaNote,
  },
];

export const FORM_COLUMNS = COMMON_COLUMNS.map(({ printout, form, ...column }) => ({
  ...column,
  ...form,
}));

export const PRINTOUT_COLUMNS = COMMON_COLUMNS.map(({ printout, form, ...column }) => ({
  ...column,
  ...printout,
}));
