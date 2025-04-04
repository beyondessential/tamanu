import React, { useMemo, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { useParams } from 'react-router-dom';
import { REGISTRATION_STATUSES } from '@tamanu/constants';
import { reloadPatient } from '../../store';
import { DateDisplay, getReferenceDataStringId, MenuButton, SearchTable } from '../../components';
import { DeleteProgramRegistryFormModal } from './DeleteProgramRegistryFormModal';
import { RemoveProgramRegistryFormModal } from './RemoveProgramRegistryFormModal';
import { ChangeStatusFormModal } from './ChangeStatusFormModal';
import { Colors } from '../../constants';
import { LimitedLinesCell } from '../../components/FormattedTableCell';
import { RegistrationStatusIndicator } from './RegistrationStatusIndicator';
import { ClinicalStatusCell } from './ClinicalStatusDisplay';
import { useRefreshCount } from '../../hooks/useRefreshCount';
import { ActivatePatientProgramRegistry } from './ActivatePatientProgramRegistry';
import { TranslatedText } from '../../components/Translation';
import { useTranslation } from '../../contexts/Translation';

export const ProgramRegistryTable = ({ searchParameters }) => {
  const params = useParams();
  const [openModal, setOpenModal] = useState();
  const { getTranslation } = useTranslation();
  const [refreshCount, updateRefreshCount] = useRefreshCount();
  const columns = useMemo(() => {
    return [
      {
        key: 'registrationStatus',
        title: '',
        accessor: data => (
          <RegistrationStatusIndicator
            patientProgramRegistration={data}
            hideText
            data-testid='registrationstatusindicator-wejg' />
        ),
        sortable: false,
      },
      {
        key: 'displayId',
        title: (
          <TranslatedText
            stringId="general.localisedField.displayId.label.short"
            fallback="NHN"
            data-testid='translatedtext-tze9' />
        ),
        accessor: ({ patient }) => patient.displayId || 'Unknown',
      },
      {
        key: 'patientName',
        title: <TranslatedText
          stringId="general.patientName.label"
          fallback="Patient name"
          data-testid='translatedtext-8o4r' />,
        accessor: ({ patient }) => `${patient.firstName} ${patient.lastName}`,
        maxWidth: 200,
      },
      {
        key: 'dateOfBirth',
        title: (
          <TranslatedText
            stringId="general.localisedField.dateOfBirth.label.short"
            fallback="DOB"
            data-testid='translatedtext-t2my' />
        ),
        accessor: ({ patient }) => <DateDisplay date={patient.dateOfBirth} data-testid='datedisplay-p1cb' />,
      },
      {
        key: 'sex',
        title: <TranslatedText
          stringId="general.localisedField.sex.label"
          fallback="Sex"
          data-testid='translatedtext-62g1' />,
        accessor: ({ patient }) => patient.sex && patient.sex.slice(0, 1).toUpperCase(),
        sortable: false,
      },
      {
        key: 'homeVillage',
        title: (
          <TranslatedText
            stringId="programRegistry.homeVillage.label"
            fallback="Home village"
            data-testid='translatedtext-07sc' />
        ),
        accessor: ({ patient }) => patient.village.name,
      },
      {
        key: 'currentlyIn',
        title: (
          <TranslatedText
            stringId="programRegistry.currentlyIn.label"
            fallback="Currently in"
            data-testid='translatedtext-b7jb' />
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
            data-testid='translatedtext-sl0n' />
        ),
        sortable: false,
        accessor: ({ conditions }) => {
          return conditions
            ?.map(condition => {
              const { id, name } = condition;
              return getTranslation(getReferenceDataStringId(id, 'programRegistryCondition'), name);
            })
            .sort((a, b) => b.localeCompare(a))
            .join(', ');
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
            data-testid='translatedtext-9hbo' />
        ),
        accessor: ({ registeringFacility }) => registeringFacility.name,
      },
      {
        key: 'division',
        title: (
          <TranslatedText
            stringId="general.localisedField.division.label"
            fallback="Division"
            data-testid='translatedtext-hv6t' />
        ),
        accessor: ({ patient }) => patient.division.name,
      },
      {
        key: 'subdivision',
        title: (
          <TranslatedText
            stringId="general.localisedField.subdivision.label"
            fallback="Subdivision"
            data-testid='translatedtext-eymk' />
        ),
        accessor: ({ patient }) => patient.subdivision.name,
      },
      {
        key: 'clinicalStatus',
        title: <TranslatedText
          stringId="programRegistry.clinicalStatus.label"
          fallback="Status"
          data-testid='translatedtext-f3lm' />,
        CellComponent: ClinicalStatusCell,
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
                <TranslatedText
                  stringId="general.action.changeStatus"
                  fallback="Change status"
                  data-testid='translatedtext-z6xe' />
              ),
              action: () => setOpenModal({ action: 'ChangeStatus', data: row }),
            },
            {
              label: <TranslatedText
                stringId="general.action.remove"
                fallback="Remove"
                data-testid='translatedtext-5iqz' />,
              action: () => setOpenModal({ action: 'Remove', data: row }),
            },
            {
              label: <TranslatedText
                stringId="general.action.delete"
                fallback="Delete"
                data-testid='translatedtext-962y' />,
              action: () => setOpenModal({ action: 'Delete', data: row }),
            },
          ];

          if (isRemoved)
            actions = [
              {
                label: <TranslatedText
                  stringId="general.action.activate"
                  fallback="Activate"
                  data-testid='translatedtext-fgjj' />,
                action: () => setOpenModal({ action: 'Activate', data: row }),
              },
              {
                label: <TranslatedText
                  stringId="general.action.delete"
                  fallback="Delete"
                  data-testid='translatedtext-fs18' />,
                action: () => setOpenModal({ action: 'Delete', data: row }),
              },
            ];

          if (isDeleted)
            actions = [
              {
                label: <TranslatedText
                  stringId="general.action.activate"
                  fallback="Activate"
                  data-testid='translatedtext-a4v9' />,
                action: () => setOpenModal({ action: 'Activate', data: row }),
              },
              {
                label: <TranslatedText
                  stringId="general.action.remove"
                  fallback="Remove"
                  data-testid='translatedtext-7igi' />,
                action: () => setOpenModal({ action: 'Remove', data: row }),
              },
            ];
          return <MenuButton onClick={() => {}} actions={actions} data-testid='menubutton-nz7n' />;
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
            data-testid='translatedtext-7bm8' />
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
        data-testid='searchtable-8bmj' />
      {openModal && openModal?.data && openModal?.action === 'ChangeStatus' && (
        <ChangeStatusFormModal
          patientProgramRegistration={openModal?.data}
          onClose={() => {
            updateRefreshCount();
            setOpenModal(undefined);
          }}
          open
          data-testid='changestatusformmodal-yxag' />
      )}
      {openModal && openModal?.data && openModal?.action === 'Activate' && (
        <ActivatePatientProgramRegistry
          patientProgramRegistration={openModal?.data}
          onClose={() => {
            updateRefreshCount();
            setOpenModal(undefined);
          }}
          open
          data-testid='activatepatientprogramregistry-hayl' />
      )}
      {openModal && openModal?.data && openModal?.action === 'Remove' && (
        <RemoveProgramRegistryFormModal
          patientProgramRegistration={openModal?.data}
          onClose={() => {
            updateRefreshCount();
            setOpenModal(undefined);
          }}
          open
          data-testid='removeprogramregistryformmodal-h14o' />
      )}
      {openModal && openModal?.data && openModal?.action === 'Delete' && (
        <DeleteProgramRegistryFormModal
          patientProgramRegistration={openModal?.data}
          onClose={() => {
            updateRefreshCount();
            setOpenModal(undefined);
          }}
          open
          data-testid='deleteprogramregistryformmodal-286b' />
      )}
    </>
  );
};
