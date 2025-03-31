import React from 'react';
import styled from 'styled-components';
import { LOCATION_AVAILABILITY_TAG_CONFIG } from '@tamanu/constants';
import { Tag } from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const BiggerTag = styled(Tag)`
  padding-top: 8px;
  padding-bottom: 8px;
`;

const StatusCell = React.memo(({ value }) => (
  <BiggerTag
    $color={LOCATION_AVAILABILITY_TAG_CONFIG[value].color}
    $background={LOCATION_AVAILABILITY_TAG_CONFIG[value].background}
  >
    {LOCATION_AVAILABILITY_TAG_CONFIG[value].label}
  </BiggerTag>
));

const isSinglePatientLocation = row => row.locationMaxOccupancy === 1;

const showIfSinglePatient = accessor => row => {
  if (!isSinglePatientLocation(row)) return 'N/A';
  return accessor(row);
};

const patientFirstNameAccessor = showIfSinglePatient(
  row => row.patientFirstName || row.plannedPatientFirstName || '-',
);
const patientLastNameAccessor = showIfSinglePatient(
  row => row.patientLastName || row.plannedPatientLastName || '-',
);
const occupancyAccessor = showIfSinglePatient(
  row => `${Math.round((row.occupancy || 0) * 10) / 10}%`,
);

export const columns = [
  {
    key: 'area',
    title: <TranslatedText
      stringId="general.table.column.area"
      fallback="Area"
      data-test-id='translatedtext-r4yi' />,
    minWidth: 100,
    accessor: ({ area }) => area || '-',
  },
  {
    key: 'location',
    title: <TranslatedText
      stringId="general.localisedField.locationId.label"
      fallback="Location"
      data-test-id='translatedtext-pje4' />,
    minWidth: 100,
  },
  {
    key: 'alos',
    title: <TranslatedText
      stringId="bedManagement.table.column.alos"
      fallback="ALOS"
      data-test-id='translatedtext-j85r' />,
    minWidth: 30,
    accessor: ({ alos }) => `${Math.round((alos || 0) * 10) / 10} days`,
    sortable: false,
    tooltip: (
      <TranslatedText
        stringId="bedManagement.table.column.alos.tooltip"
        fallback="Average length of stay, last 30 days"
        data-test-id='translatedtext-cx88' />
    ),
  },
  {
    key: 'occupancy',
    title: <TranslatedText
      stringId="bedManagement.table.column.occupancy"
      fallback="Occupancy"
      data-test-id='translatedtext-xk7y' />,
    minWidth: 30,
    accessor: occupancyAccessor,
    sortable: false,
    tooltip: (
      <TranslatedText
        stringId="bedManagement.table.column.occupancy.tooltip"
        fallback="Bed occupancy, last 30 days"
        data-test-id='translatedtext-8w6t' />
    ),
  },
  {
    key: 'numberOfOccupants',
    title: (
      <TranslatedText
        stringId="bedManagement.table.column.numberOfOccupants"
        fallback="No. occupants"
        data-test-id='translatedtext-nppb' />
    ),
    minWidth: 30,
    sortable: false,
    tooltip: (
      <TranslatedText
        stringId="bedManagement.table.column.numberOfOccupants.tooltip"
        fallback="Current number of occupants"
        data-test-id='translatedtext-6sqa' />
    ),
  },
  {
    key: 'patientFirstName',
    title: (
      <TranslatedText
        stringId="general.table.column.patientFirstName"
        fallback="First Name"
        data-test-id='translatedtext-y31c' />
    ),
    minWidth: 100,
    accessor: patientFirstNameAccessor,
  },
  {
    key: 'patientLastName',
    title: <TranslatedText
      stringId="general.table.column.patientLastName"
      fallback="Last name"
      data-test-id='translatedtext-iyq2' />,
    minWidth: 100,
    accessor: patientLastNameAccessor,
  },
  {
    key: 'status',
    title: <TranslatedText
      stringId="general.table.column.status"
      fallback="Status"
      data-test-id='translatedtext-wh00' />,
    minWidth: 100,
    CellComponent: StatusCell,
  },
];
