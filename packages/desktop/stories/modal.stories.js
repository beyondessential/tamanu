import React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Modal } from '../app/components/Modal';
import { Button } from '../app/components/Button';
import { ButtonRow, ConfirmCancelRow } from '../app/components/ButtonRow';
import { BeginPatientMoveModal } from '../app/views/patients/components/BeginPatientMoveModal';
import { FinalisePatientMoveModal } from '../app/views/patients/components/FinalisePatientMoveModal';
import { ViewAdministeredVaccineModal } from '../app/components/ViewAdministeredVaccineModal';

storiesOf('Modal', module)
  .add('ConfirmCancel', () => (
    <Modal
      title="Confirm/Cancel modal"
      open
      actions={<ConfirmCancelRow onConfirm={action('confirm')} onCancel={action('cancel')} />}
    >
      Some modal content
    </Modal>
  ))
  .add('With custom buttons', () => (
    <Modal
      title="Custom buttons modal"
      open
      actions={
        <ButtonRow>
          <Button onClick={action('plier')} variant="contained" color="primary">
            Plier
          </Button>
          <Button onClick={action('etendre')} variant="contained" color="secondary">
            Etendre
          </Button>
          <Button onClick={action('relever')} variant="contained">
            Relever
          </Button>
          <Button onClick={action('glisser')} variant="contained">
            Glisser
          </Button>
        </ButtonRow>
      }
    >
      Some modal content
    </Modal>
  ));

storiesOf('Modal', module)
  .addDecorator(Story => (
    <MemoryRouter initialEntries={['/path/108']}>
      <Route path="/path/:myId">
        <Story />
      </Route>
    </MemoryRouter>
  ))
  .add('BeginMove', () => (
    <BeginPatientMoveModal
      encounter={{ id: '123', plannedLocation: 'Unit 1' }}
      open
      onClose={() => {
        console.log('close');
      }}
    />
  ))
  .add('FinaliseMove', () => (
    <FinalisePatientMoveModal
      encounter={{ id: '123', plannedLocation: 'Unit 1' }}
      open
      onClose={() => {
        console.log('close');
      }}
    />
  ));

const vaccineRecord = {
  givenOverseas: false,
  recordingType: 'NOT GIVEN',
  vaccineName: 'covid 20',
  vaccineBrand: 'pfizer',
  disease: 'COVID-19',

  id: 'c89c9009-a393-493b-ac48-96a82b3882fd',
  batch: null,
  consent: true,
  status: 'GIVEN',
  reason: null,
  injectionSite: null,
  givenBy: null,
  date: '2023-02-23 13:19:37',
  updatedAtSyncTick: '23914',
  createdAt: '2023-02-23T00:19:52.495Z',
  updatedAt: '2023-02-23T00:19:52.495Z',
  encounterId: 'ae84c475-fe8c-4189-ab3c-3ad1bc63da9a',
  scheduledVaccineId: '382dc076-9d62-45f4-833e-b89824865908',
  recorderId: 'bb6512d9-4b94-46ef-8e1b-954bcb820fa7',
  locationId: 'location-ClinicalTreatmentRoom',
  departmentId: 'department-Emergency',
  department: {
    name: 'test department',
  },
  encounter: {
    id: 'ae84c475-fe8c-4189-ab3c-3ad1bc63da9a',
    encounterType: 'clinic',
    startDate: '2023-02-23 13:19:37',
    endDate: '2023-02-23 13:19:37',
    reasonForEncounter: null,
    deviceId: null,
    plannedLocationStartTime: null,
    updatedAtSyncTick: '23914',
    createdAt: '2023-02-23T00:19:52.477Z',
    updatedAt: '2023-02-23T00:19:52.477Z',
    patientId: 'e328292f-4122-48bb-853c-500605b6bbeb',
    examinerId: 'bb6512d9-4b94-46ef-8e1b-954bcb820fa7',
    locationId: 'location-ClinicalTreatmentRoom',
    plannedLocationId: null,
    departmentId: 'department-Emergency',
    patientBillingTypeId: null,
    referralSourceId: null,
    department: {
      id: 'department-Emergency',
      code: 'Emergency',
      name: 'Emergency',
      visibilityStatus: 'current',
      updatedAtSyncTick: '-999',
      createdAt: '2022-12-02T01:58:50.823Z',
      updatedAt: '2023-02-02T20:04:13.188Z',
      facilityId: 'ref/facility/ba',
    },
    examiner: {
      id: 'bb6512d9-4b94-46ef-8e1b-954bcb820fa7',
      email: 'admin@tamanu.io',
      displayName: 'Initial Admin',
      role: 'admin',
      updatedAtSyncTick: '35366',
      createdAt: '2022-12-02T01:58:50.810Z',
      updatedAt: '2023-03-09T03:50:57.448Z',
    },
    location: {
      id: 'location-ClinicalTreatmentRoom',
      code: 'ClinicalTreatmentRoom',
      name: 'Clinical Treatment Room',
      visibilityStatus: 'current',
      maxOccupancy: null,
      updatedAtSyncTick: '-999',
      createdAt: '2022-12-02T01:58:50.853Z',
      updatedAt: '2023-01-25T20:45:01.380Z',
      facilityId: 'ref/facility/ba',
      locationGroupId: 'location-group-one',
      facility: {
        id: 'ref/facility/ba',
        code: 'Faciliyba',
        name: 'Facility ba',
        email: null,
        contactNumber: null,
        streetAddress: null,
        cityTown: null,
        division: null,
        type: null,
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2022-12-02T01:58:50.564Z',
        updatedAt: '2022-12-02T01:58:50.564Z',
      },
      locationGroup: {
        id: 'location-group-one',
        code: 'LocationGroupOne',
        name: 'Location Group Area 1',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2023-01-25T20:45:01.358Z',
        updatedAt: '2023-01-25T20:45:01.358Z',
        facilityId: 'ref/facility/ba',
      },
    },
    plannedLocation: null,
    referralSource: null,
  },
  location: {
    id: 'location-ClinicalTreatmentRoom',
    code: 'ClinicalTreatmentRoom',
    name: 'Clinical Treatment Room',
    visibilityStatus: 'current',
    maxOccupancy: null,
    updatedAtSyncTick: '-999',
    createdAt: '2022-12-02T01:58:50.853Z',
    updatedAt: '2023-01-25T20:45:01.380Z',
    facilityId: 'ref/facility/ba',
    facility: {
      name: 'test facility',
    },
    locationGroupId: 'location-group-one',
    locationGroup: {
      id: 'location-group-one',
      code: 'LocationGroupOne',
      name: 'Location Group Area 1',
      visibilityStatus: 'current',
      updatedAtSyncTick: '-999',
      createdAt: '2023-01-25T20:45:01.358Z',
      updatedAt: '2023-01-25T20:45:01.358Z',
      facilityId: 'ref/facility/ba',
    },
  },
  scheduledVaccine: {
    id: '382dc076-9d62-45f4-833e-b89824865908',
    category: 'Campaign',
    label: 'COVID-19 Pfizer',
    schedule: 'Dose 2',
    weeksFromBirthDue: null,
    weeksFromLastVaccinationDue: 6,
    index: 2,
    visibilityStatus: 'current',
    updatedAtSyncTick: '-999',
    createdAt: '2022-12-02T01:58:50.745Z',
    updatedAt: '2022-12-02T01:58:50.745Z',
    vaccineId: 'drug-COVID-19-Pfizer',
    vaccine: {
      id: 'drug-COVID-19-Pfizer',
      code: 'COVID-19-Pfizer',
      type: 'drug',
      name: 'COVID-19 Pfizer',
      visibilityStatus: 'current',
      updatedAtSyncTick: '-999',
      createdAt: '2022-12-02T01:58:50.623Z',
      updatedAt: '2022-12-02T01:58:50.623Z',
    },
  },
  certifiable: true,
};

storiesOf('Modal', module).add('ViewAdministeredVaccine', () => (
  <ViewAdministeredVaccineModal open vaccineRecord={vaccineRecord} />
));
