import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { useParams } from 'react-router-dom';
import { STATUS_COLOR } from '@tamanu/constants';
import { reloadPatient } from '../../store';
import { SearchTable, DateDisplay, MenuButton } from '../../components';
import { DeleteProgramRegistryFormModal } from './DeleteProgramRegistryFormModal';
import { RemoveProgramRegistryFormModal } from './RemoveProgramRegistryFormModal';
import { ChangeStatusFormModal } from './ChangeStatusFormModal';
import { Colors } from '../../constants';
import { LimitedLinesCell } from '../../components/FormattedTableCell';
import { RegistrationStatusIndicator } from './RegistrationStatusIndicator';

const ClippedConditionName = styled.span`
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-wrap: break-word;
  width: 95%;
`;

const StatusBadge = styled.div`
  padding: 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  height: 20px;
  color: ${props => props.color};
  background-color: ${props => props.backgroundColor};
  width: fit-content;
`;

export const ProgramRegistryTable = ({ searchParameters }) => {
  const params = useParams();
  const [openModal, setOpenModal] = useState();
  const [refreshCount, setRefreshCount] = useState(0);
  const columns = useMemo(() => {
    return [
      {
        accessor: data => (
          <RegistrationStatusIndicator patientProgramRegistration={data} hideText={true} />
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
        key: 'clinicalStatus',
        title: 'Status',
        accessor: row => {
          return (
            <StatusBadge
              color={STATUS_COLOR[row.clinicalStatus.color].color}
              backgroundColor={STATUS_COLOR[row.clinicalStatus.color].background}
            >
              {row.clinicalStatus.name}
            </StatusBadge>
          );
        },
        maxWidth: 200,
      },
      {
        accessor: row => {
          return (
            <MenuButton
              onClick={() => {}}
              actions={{
                'Change status': () => setOpenModal({ action: 'ChangeStatus', data: row }),
                Remove: () => setOpenModal({ action: 'Remove', data: row }),
                Delete: () => setOpenModal({ action: 'Delete', data: row }),
              }}
            />
          );
        },
        sortable: false,
        dontCallRowInput: true,
      },
    ];
  }, []);

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
        autoRefresh
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

      <ChangeStatusFormModal
        patientProgramRegistration={openModal?.data}
        onClose={() => {
          setRefreshCount(refreshCount + 1);
          setOpenModal(undefined);
        }}
        open={openModal && openModal?.data && openModal?.action === 'ChangeStatus'}
      />

      <RemoveProgramRegistryFormModal
        patientProgramRegistration={openModal?.data}
        onClose={() => {
          setRefreshCount(refreshCount + 1);
          setOpenModal(undefined);
        }}
        open={openModal && openModal?.data && openModal?.action === 'Remove'}
      />

      <DeleteProgramRegistryFormModal
        patientProgramRegistration={openModal?.data}
        onClose={() => {
          setRefreshCount(refreshCount + 1);
          setOpenModal(undefined);
        }}
        open={openModal && openModal?.data && openModal?.action === 'Delete'}
      />
    </>
  );
};
