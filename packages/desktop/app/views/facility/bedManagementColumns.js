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
    title: (
      <TranslatedText stringId="facilityAdmin.bedManagement.table.column.area" fallback="Area" />
    ),
    minWidth: 100,
    accessor: ({ area }) => area || '-',
  },
  {
    key: 'location',
    title: (
      <TranslatedText
        stringId="facilityAdmin.bedManagement.table.column.location"
        fallback="Location"
      />
    ),
    minWidth: 100,
  },
  {
    key: 'alos',
    title: (
      <TranslatedText stringId="facilityAdmin.bedManagement.table.column.alos" fallback="ALOS" />
    ),
    minWidth: 30,
    accessor: ({ alos }) => `${Math.round((alos || 0) * 10) / 10} days`,
    sortable: false,
    tooltip: (
      <TranslatedText
        stringId="facilityAdmin.bedManagement.table.column.alos.tooltip"
        fallback="Average length of stay, last 30 days"
      />
    ),
  },
  {
    key: 'occupancy',
    title: (
      <TranslatedText
        stringId="facilityAdmin.bedManagement.table.column.occupancy"
        fallback="Occupancy"
      />
    ),
    minWidth: 30,
    accessor: occupancyAccessor,
    sortable: false,
    tooltip: (
      <TranslatedText
        stringId="facilityAdmin.bedManagement.table.column.occupancy.tooltip"
        fallback="Bed occupancy, last 30 days"
      />
    ),
  },
  {
    key: 'numberOfOccupants',
    title: (
      <TranslatedText
        stringId="facilityAdmin.bedManagement.table.column.numberOfOccupants"
        fallback="No. occupants"
      />
    ),
    minWidth: 30,
    sortable: false,
    tooltip: (
      <TranslatedText
        stringId="facilityAdmin.bedManagement.table.column.numberOfOccupants.tooltip"
        fallback="Current number of occupants"
      />
    ),
  },
  {
    key: 'patientFirstName',
    title: (
      <TranslatedText stringId="general.table.column.patientFirstName" fallback="First Name" />
    ),
    minWidth: 100,
    accessor: patientFirstNameAccessor,
  },
  {
    key: 'patientLastName',
    title: <TranslatedText stringId="general.table.column.patientLastName" fallback="Last name" />,
    minWidth: 100,
    accessor: patientLastNameAccessor,
  },
  {
    key: 'status',
    title: <TranslatedText stringId="general.table.column.status" fallback="Status" />,
    minWidth: 100,
    CellComponent: StatusCell,
  },
];
