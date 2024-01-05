import React, { useMemo, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { useParams } from 'react-router-dom';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { reloadPatient } from '../../store';
import { SearchTable, DateDisplay, MenuButton } from '../../components';
import { DeleteProgramRegistryFormModal } from './DeleteProgramRegistryFormModal';
import { RemoveProgramRegistryFormModal } from './RemoveProgramRegistryFormModal';
import { ChangeStatusFormModal } from './ChangeStatusFormModal';
import { Colors } from '../../constants';
import { LimitedLinesCell } from '../../components/FormattedTableCell';
import { RegistrationStatusIndicator } from './RegistrationStatusIndicator';
import { ClinicalStatusDisplay } from './ClinicalStatusDisplay';
import { useRefreshCount } from '../../hooks/useRefreshCount';
import { ActivatePatientProgramRegistry } from './ActivatePatientProgramRegistry';

export const ProgramRegistryTable = ({ searchParameters }) => {
  const params = useParams();
  const [openModal, setOpenModal] = useState();
  const [refreshCount, updateRefreshCount] = useRefreshCount();
  const columns = useMemo(() => {
    return [
      {
        accessor: data => (
          <RegistrationStatusIndicator patientProgramRegistration={data} hideText />
        ),
        sortable: false,
      },
      {
        key: 'displayId',
        accessor: ({ patient }) => patient.displayId || 'Unknown',
      },
      {
        key: 'firstName',
        title: 'First name',
        accessor: ({ patient }) => patient.firstName,
        maxWidth: 200,
      },
      {
        key: 'lastName',
        title: 'Last name',
        accessor: ({ patient }) => patient.lastName,
        maxWidth: 200,
      },
      {
        key: 'dateOfBirth',
        title: 'DOB',
        accessor: ({ patient }) => <DateDisplay date={patient.dateOfBirth} />,
      },
      {
        key: 'sex',
        title: 'Sex',
        accessor: ({ patient }) => patient.sex && patient.sex.slice(0, 1).toUpperCase(),
        sortable: false,
      },
      {
        key: 'homeVillage',
        title: 'Home village',
        accessor: ({ patient }) => patient.village.name,
      },
      {
        key: 'registeringFacility',
        title: 'Registering facility',
        accessor: ({ registeringFacility }) => registeringFacility.name,
      },
      {
        key: 'currentlyIn',
        title: 'Currently in',
        accessor: row => {
          if (row.programRegistry.currentlyAtType === 'village') return row.village.name;
          if (row.programRegistry.currentlyAtType === 'facility') return row.facility.name;
          return '';
        },
      },
      {
        key: 'conditions',
        title: 'Related conditions',
        accessor: ({ conditions }) => {
          const conditionsText = Array.isArray(conditions)
            ? conditions.map(x => ` ${x}`).toString()
            : '';
          return conditionsText;
        },
        CellComponent: LimitedLinesCell,
        maxWidth: 200,
      },
      {
        key: 'status',
        title: 'Status',
        accessor: row => {
          return <ClinicalStatusDisplay clinicalStatus={row.clinicalStatus} />;
        },
        maxWidth: 200,
      },
      {
        accessor: row => {
          const isRemoved = row.registrationStatus === REGISTRATION_STATUSES.INACTIVE;
          const isDeleted = row.registrationStatus === REGISTRATION_STATUSES.RECORDED_IN_ERROR;

          let actions = {
            'Change status': () => setOpenModal({ action: 'ChangeStatus', data: row }),
            Remove: () => setOpenModal({ action: 'Remove', data: row }),
            Delete: () => setOpenModal({ action: 'Delete', data: row }),
          };

          if (isRemoved)
            actions = {
              Activate: () => setOpenModal({ action: 'Activate', data: row }),
              Delete: () => setOpenModal({ action: 'Delete', data: row }),
            };

          if (isDeleted)
            actions = {
              Activate: () => setOpenModal({ action: 'Activate', data: row }),
              Remove: () => setOpenModal({ action: 'Remove', data: row }),
            };
          return <MenuButton onClick={() => {}} actions={actions} />;
        },
        sortable: false,
        dontCallRowInput: true,
      },
    ];
  }, []);

  useEffect(() => updateRefreshCount(), [updateRefreshCount, searchParameters]);

  const dispatch = useDispatch();
  const selectRegistration = async registration => {
    const { patient, programRegistry } = registration;
    if (patient.id) {
      await dispatch(reloadPatient(patient.id));
    }
    dispatch(
      push(
        `/patients/all/${patient.id}/program-registry/${params.programRegistryId}?title=${programRegistry.name}`,
      ),
    );
  };

  return (
    <>
      <SearchTable
        refreshCount={refreshCount}
        endpoint={`programRegistry/${params.programRegistryId}/registrations`}
        columns={columns}
        noDataMessage="No Program registry found"
        onRowClick={selectRegistration}
        fetchOptions={searchParameters}
        rowStyle={({ patient }) => {
          return patient.dateOfDeath ? `& > td { color: ${Colors.alert}; }` : '';
        }}
        initialSort={{
          order: 'desc',
          orderBy: 'displayId',
        }}
      />

      {openModal && openModal?.data && openModal?.action === 'ChangeStatus' && (
        <ChangeStatusFormModal
          patientProgramRegistration={openModal?.data}
          onClose={() => {
            updateRefreshCount();
            setOpenModal(undefined);
          }}
          open
        />
      )}

      {openModal && openModal?.data && openModal?.action === 'Activate' && (
        <ActivatePatientProgramRegistry
          patientProgramRegistration={openModal?.data}
          onClose={() => {
            updateRefreshCount();
            setOpenModal(undefined);
          }}
          open
        />
      )}

      {openModal && openModal?.data && openModal?.action === 'Remove' && (
        <RemoveProgramRegistryFormModal
          patientProgramRegistration={openModal?.data}
          onClose={() => {
            updateRefreshCount();
            setOpenModal(undefined);
          }}
          open
        />
      )}

      {openModal && openModal?.data && openModal?.action === 'Delete' && (
        <DeleteProgramRegistryFormModal
          patientProgramRegistration={openModal?.data}
          onClose={() => {
            updateRefreshCount();
            setOpenModal(undefined);
          }}
          open
        />
      )}
    </>
  );
};
