import React from 'react';
import styled from 'styled-components';
import { LOCATION_AVAILABILITY_TAG_CONFIG } from 'shared/constants';
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

const patientFirstNameAccessor = row =>
  row.location_max_occupancy === 1
    ? row.patient_first_name || row.planned_patient_first_name || '-'
    : 'N/A';

const patientLastNameAccessor = row =>
  row.location_max_occupancy === 1
    ? row.patient_last_name || row.planned_patient_last_name || '-'
    : 'N/A';

const occupancyAccessor = row =>
  row.location_max_occupancy === 1 ? `${Math.round((row.occupancy || 0) * 10) / 10}%` : 'N/A';

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
    tooltip: 'Average length of stay',
  },
  {
    key: 'occupancy',
    title: 'Occupancy',
    minWidth: 30,
    accessor: occupancyAccessor,
    sortable: false,
    tooltip: '% occupancy, last 30 days',
  },
  {
    key: 'number_of_occupants',
    title: 'No. occupants',
    minWidth: 30,
    sortable: false,
    tooltip: 'Current number of occupants',
  },
  {
    key: 'patient_first_name',
    title: 'First Name',
    minWidth: 100,
    accessor: patientFirstNameAccessor,
  },
  {
    key: 'patient_last_name',
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
