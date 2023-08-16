import React from 'react';
import styled from 'styled-components';
import { LOCATION_AVAILABILITY_TAG_CONFIG } from '@tamanu/constants';
import { Tag } from '../../components';

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
    title: 'Area',
    minWidth: 100,
    accessor: ({ area }) => area || '-',
  },
  {
    key: 'location',
    title: 'Location',
    minWidth: 100,
  },
  {
    key: 'alos',
    title: 'ALOS',
    minWidth: 30,
    accessor: ({ alos }) => `${Math.round((alos || 0) * 10) / 10} days`,
    sortable: false,
    tooltip: 'Average length of stay, last 30 days',
  },
  {
    key: 'occupancy',
    title: 'Occupancy',
    minWidth: 30,
    accessor: occupancyAccessor,
    sortable: false,
    tooltip: 'Bed occupancy, last 30 days',
  },
  {
    key: 'numberOfOccupants',
    title: 'No. occupants',
    minWidth: 30,
    sortable: false,
    tooltip: 'Current number of occupants',
  },
  {
    key: 'patientFirstName',
    title: 'First Name',
    minWidth: 100,
    accessor: patientFirstNameAccessor,
  },
  {
    key: 'patientLastName',
    title: 'Last Name',
    minWidth: 100,
    accessor: patientLastNameAccessor,
  },
  {
    key: 'status',
    title: 'Status',
    minWidth: 100,
    CellComponent: StatusCell,
  },
];
