import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { useParams } from 'react-router-dom';
import { STATUS_COLOR } from '@tamanu/constants';
import { reloadPatient } from '../../store';
import { SearchTable, DateDisplay, MenuButton } from '../../components';
import { ConditionalTooltip } from '../../components/Tooltip';
import { DeleteProgramRegistryFormModal } from './DeleteProgramRegistryFormModal';
import { RemoveProgramRegistryFormModal } from './RemoveProgramRegistryFormModal';
import { ChangeStatusFormModal } from './ChangeStatusFormModal';
import { Colors } from '../../constants';

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
`;

export const ProgramRegistryTable = ({ searchParameters }) => {
  const params = useParams();
  const [openModal, setOpenModal] = useState();
  const columns = useMemo(() => {
    return [
      {
        key: 'displayId',
        accessor: ({ patientDisplayId }) => patientDisplayId || 'Unknown',
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
        accessor: ({ patient }) => patient.sex,
        sortable: false,
      },
      {
        key: 'homeVillage',
        title: 'Home village',
        accessor: ({ patient }) => patient.village,
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
          if (row.programRegistry.currentlyAt === 'village') return row.village.name;
          if (row.programRegistry.currentlyAt === 'facility') return row.facility.name;
          return '';
        },
      },
      {
        key: 'conditions',
        title: 'Conditions',
        accessor: row => {
          const conditions = row.conditions.map(x => ` ${x.name}`).toString();
          return (
            <ConditionalTooltip title={conditions} visible={conditions.length > 30}>
              <ClippedConditionName>{conditions}</ClippedConditionName>
            </ConditionalTooltip>
          );
        },
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
              actions={{
                'Change status': () => setOpenModal({ action: 'ChangeStatus', data: row }),
                Remove: () => setOpenModal({ action: 'Remove', data: row }),
                Delete: () => setOpenModal({ action: 'Delete', data: row }),
              }}
            />
          );
        },
        sortable: false,
      },
    ];
  }, []);

  const dispatch = useDispatch();
  const selectLab = async registration => {
    const { patientId } = registration;
    if (patientId) {
      await dispatch(reloadPatient(patientId));
    }
    dispatch(push(`/patients/all/${patientId}/program-registry/${params.programRegistryId}`));
  };

  return (
    <>
      <SearchTable
        autoRefresh
        endpoint="patientProgramRegistration"
        columns={columns}
        noDataMessage="No Program registry found"
        onRowClick={selectLab}
        fetchOptions={searchParameters}
        rowStyle={({ isDeceased }) => {
          return isDeceased ? `& > td { color: ${Colors.alert}; }` : '';
        }}
        initialSort={{
          order: 'desc',
          orderBy: 'patientDisplayId',
        }}
      />
      {openModal && openModal.data && openModal.action === 'ChangeStatus' && (
        <ChangeStatusFormModal
          patientProgramRegistration={openModal.data}
          onSubmit={() => {}}
          onCancel={() => setOpenModal(undefined)}
          open
        />
      )}
      {openModal && openModal.data && openModal.action === 'Remove' && (
        <DeleteProgramRegistryFormModal
          programRegistry={openModal.data}
          onSubmit={() => {}}
          onCancel={() => setOpenModal(undefined)}
          open
        />
      )}
      {openModal && openModal.data && openModal.action === 'Delete' && (
        <RemoveProgramRegistryFormModal
          patientProgramRegistration={openModal.data}
          onSubmit={() => {}}
          onCancel={() => setOpenModal(undefined)}
          open
        />
      )}
    </>
  );
};
