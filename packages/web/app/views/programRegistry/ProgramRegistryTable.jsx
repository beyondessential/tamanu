import React, { useMemo, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { useParams } from 'react-router-dom';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { reloadPatient } from '../../store';
import { DateDisplay, MenuButton, SearchTable } from '../../components';
import { DeleteProgramRegistryFormModal } from './DeleteProgramRegistryFormModal';
import { RemoveProgramRegistryFormModal } from './RemoveProgramRegistryFormModal';
import { PatientProgramRegistryUpdateFormModal } from '../../features/ProgramRegistry/PatientProgramRegistryUpdateFormModal.jsx';
import { Colors } from '../../constants';
import { LimitedLinesCell } from '../../components/FormattedTableCell';
import { RegistrationStatusIndicator } from './RegistrationStatusIndicator';
import { ClinicalStatusDisplay } from './ClinicalStatusDisplay';
import { useRefreshCount } from '../../hooks/useRefreshCount';
import { ActivatePatientProgramRegistry } from './ActivatePatientProgramRegistry';
import { TranslatedText } from '../../components/Translation';

export const ProgramRegistryTable = ({ searchParameters }) => {
  const params = useParams();
  const [openModal, setOpenModal] = useState();
  const [refreshCount, updateRefreshCount] = useRefreshCount();
  const columns = useMemo(() => {
    return [
      {
        key: 'registrationStatus',
        title: '',
        accessor: data => (
          <RegistrationStatusIndicator patientProgramRegistration={data} hideText />
        ),
        sortable: false,
      },
      {
        key: 'displayId',
        title: (
          <TranslatedText stringId="general.localisedField.displayId.label.short" fallback="NHN" />
        ),
        accessor: ({ patient }) => patient.displayId || 'Unknown',
      },
      {
        key: 'patientName',
        title: <TranslatedText stringId="general.patientName.label" fallback="Patient name" />,
        accessor: ({ patient }) => `${patient.firstName} ${patient.lastName}`,
        maxWidth: 200,
      },
      {
        key: 'dateOfBirth',
        title: (
          <TranslatedText
            stringId="general.localisedField.dateOfBirth.label.short"
            fallback="DOB"
          />
        ),
        accessor: ({ patient }) => <DateDisplay date={patient.dateOfBirth} />,
      },
      {
        key: 'sex',
        title: <TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />,
        accessor: ({ patient }) => patient.sex && patient.sex.slice(0, 1).toUpperCase(),
        sortable: false,
      },
      {
        key: 'homeVillage',
        title: (
          <TranslatedText stringId="programRegistry.homeVillage.label" fallback="Home village" />
        ),
        accessor: ({ patient }) => patient.village.name,
      },
      {
        key: 'currentlyIn',
        title: (
          <TranslatedText stringId="programRegistry.currentlyIn.label" fallback="Currently in" />
        ),
        accessor: row => {
          if (row.programRegistry.currentlyAtType === 'village') return row.village.name;
          if (row.programRegistry.currentlyAtType === 'facility') return row.facility.name;
          return '';
        },
      },
      {
        key: 'conditions',
        title: (
          <TranslatedText
            stringId="programRegistry.relatedConditions.label"
            fallback="Related conditions"
          />
        ),
        sortable: false,
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
        key: 'registeringFacility',
        title: (
          <TranslatedText
            stringId="programRegistry.registeringFacility.label"
            fallback="Registering facility"
          />
        ),
        accessor: ({ registeringFacility }) => registeringFacility.name,
      },
      {
        key: 'division',
        title: (
          <TranslatedText stringId="general.localisedField.division.label" fallback="Division" />
        ),
        accessor: ({ patient }) => patient.division.name,
      },
      {
        key: 'subdivision',
        title: (
          <TranslatedText
            stringId="general.localisedField.subdivision.label"
            fallback="Subdivision"
          />
        ),
        accessor: ({ patient }) => patient.subdivision.name,
      },
      {
        key: 'clinicalStatus',
        title: <TranslatedText stringId="programRegistry.clinicalStatus.label" fallback="Status" />,
        accessor: row => {
          return <ClinicalStatusDisplay clinicalStatus={row.clinicalStatus} />;
        },
        maxWidth: 200,
      },
      {
        key: 'actions',
        title: '',
        accessor: row => {
          const isRemoved = row.registrationStatus === REGISTRATION_STATUSES.INACTIVE;
          const isDeleted = row.registrationStatus === REGISTRATION_STATUSES.RECORDED_IN_ERROR;

          let actions = [
            {
              label: (
                <TranslatedText stringId="general.action.changeStatus" fallback="Change status" />
              ),
              action: () => setOpenModal({ action: 'ChangeStatus', data: row }),
            },
            {
              label: <TranslatedText stringId="general.action.remove" fallback="Remove" />,
              action: () => setOpenModal({ action: 'Remove', data: row }),
            },
            {
              label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
              action: () => setOpenModal({ action: 'Delete', data: row }),
            },
          ];

          if (isRemoved)
            actions = [
              {
                label: <TranslatedText stringId="general.action.activate" fallback="Activate" />,
                action: () => setOpenModal({ action: 'Activate', data: row }),
              },
              {
                label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
                action: () => setOpenModal({ action: 'Delete', data: row }),
              },
            ];

          if (isDeleted)
            actions = [
              {
                label: <TranslatedText stringId="general.action.activate" fallback="Activate" />,
                action: () => setOpenModal({ action: 'Activate', data: row }),
              },
              {
                label: <TranslatedText stringId="general.action.remove" fallback="Remove" />,
                action: () => setOpenModal({ action: 'Remove', data: row }),
              },
            ];
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
        noDataMessage={
          <TranslatedText
            stringId="programRegistry.registryTable.noDataMessage"
            fallback="No program registry found"
          />
        }
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
        <PatientProgramRegistryUpdateFormModal
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
