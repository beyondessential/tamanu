import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { useParams } from 'react-router-dom';
import { STATUS_COLOR } from '@tamanu/constants';
import { reloadPatient } from '../../store';
import { SearchTable, DateDisplay, MenuButton } from '../../components';
import { PatientNameDisplay } from '../../components/PatientNameDisplay';
import { ConditionalTooltip } from '../../components/Tooltip';
import { DeleteProgramRegistryFormModal } from './DeleteProgramRegistryFormModal';
import { RemoveProgramRegistryFormModal } from './RemoveProgramRegistryFormModal';
import { ChangeStatusFormModal } from './ChangeStatusFormModal';

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

const Text = styled.div`
  color: ${props => {
    return props.isDeceased ? '#ff0000' : 'inherit';
  }};
`;

export const ProgramRegistryTable = ({ searchParameters }) => {
  const params = useParams();
  const [openModal, setOpenModal] = useState();
  const columns = useMemo(() => {
    return [
      {
        key: 'displayId',
        accessor: ({ patientDisplayId, isDeceased }) => {
          return <Text isDeceased={isDeceased}>{patientDisplayId || 'Unknown'}</Text>;
        },
      },
      {
        key: 'patientName',
        title: 'Patient name',
        accessor: row => <Text isDeceased={row.isDeceased}>{PatientNameDisplay(row)} </Text>,
        maxWidth: 200,
      },
      {
        key: 'dateOfBirth',
        title: 'DOB',
        accessor: row => (
          <Text isDeceased={row.isDeceased}>
            <DateDisplay date={row.patient.dateOfBirth} />
          </Text>
        ),
      },
      {
        key: 'homeVillage',
        title: 'Home village',
        accessor: ({ patient, isDeceased }) => (
          <Text isDeceased={isDeceased}>{patient.village}</Text>
        ),
      },
      {
        key: 'registeringFacility',
        title: 'Registering facility',
        accessor: ({ registeringFacility, isDeceased }) => (
          <Text isDeceased={isDeceased}>{registeringFacility.name}</Text>
        ),
      },
      {
        key: 'currentlyIn',
        title: 'Currently in',
        accessor: row => {
          if (row.programRegistry.currentlyAt === 'village')
            return <Text isDeceased={row.isDeceased}>{row.village.name}</Text>;
          if (row.programRegistry.currentlyAt === 'facility')
            return <Text isDeceased={row.isDeceased}>{row.facility.name}</Text>;
          return '';
        },
      },
      {
        key: 'conditions',
        title: 'Conditions',
        accessor: row => {
          const conditions = row.conditions.map(x => ` ${x.name}`).toString();
          return (
            <Text isDeceased={row.isDeceased}>
              <ConditionalTooltip title={conditions} visible={conditions.length > 30}>
                <ClippedConditionName>{conditions}</ClippedConditionName>
              </ConditionalTooltip>
            </Text>
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
        key: 'id',
        title: '',
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
        maxWidth: 200,
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
