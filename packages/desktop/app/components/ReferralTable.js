import React, { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { REFERRAL_STATUSES } from '@tamanu/constants';
import { REFERRAL_STATUS_LABELS } from '../constants';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

import { EncounterModal } from './EncounterModal';
import { useApi, isErrorUnknownAllow404s } from '../api';
import { SurveyResponseDetailsModal } from './SurveyResponseDetailsModal';
import { DeleteButton } from './Button';
import { ConfirmModal } from './ConfirmModal';
import { useAuth } from '../contexts/Auth';
import { MenuButton } from './MenuButton';
import { DeleteReferralModal } from '../views/patients/components/DeleteReferralModal';
import { useEncounter } from '../contexts/Encounter';

const fieldNames = ['Referring doctor', 'Referral completed by'];
const ReferralBy = ({ surveyResponse: { survey, answers } }) => {
  const api = useApi();
  const [name, setName] = useState('N/A');

  useEffect(() => {
    (async () => {
      const referralByComponent = survey.components.find(({ dataElement }) =>
        fieldNames.includes(dataElement.name),
      );
      if (!referralByComponent) {
        return;
      }
      const referralByAnswer = answers.find(
        ({ dataElementId }) => dataElementId === referralByComponent.dataElementId,
      );
      if (!referralByAnswer) {
        setName('');
        return;
      }

      try {
        const user = await api.get(
          `user/${encodeURIComponent(referralByAnswer.body)}`,
          {},
          { isErrorUnknown: isErrorUnknownAllow404s },
        );
        setName(user.displayName);
      } catch (e) {
        if (e.message === 'Facility server error response: 404') {
          setName(referralByAnswer.body);
        } else {
          setName('Unknown');
        }
      }
    })();
  }, [survey, answers, api]);

  return name;
};

const getDate = ({ surveyResponse: { submissionDate } }) => {
  return <DateDisplay date={submissionDate} />;
};
const getReferralType = ({ surveyResponse: { survey } }) => survey.name;
const getReferralBy = ({ surveyResponse }) => <ReferralBy surveyResponse={surveyResponse} />;
const getStatus = ({ status }) => REFERRAL_STATUS_LABELS[status] || 'Unknown';

const MODAL_IDS = {
  ADMIT: 'admit',
  COMPLETE: 'complete',
  CANCEL: 'cancel',
  DELETE: 'delete',
};

export const ReferralTable = React.memo(({ patientId }) => {
  const api = useApi();
  const patient = useSelector(state => state.patient);
  const { ability } = useAuth();
  const { loadEncounter } = useEncounter();
  const [modalId, setModalId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [selectedReferral, setSelectedReferral] = useState({});
  const [selectedReferralId, setSelectedReferralId] = useState(null);
  const onSelectReferral = useCallback(referral => {
    setSelectedReferralId(referral.surveyResponseId);
  }, []);
  const refreshTable = () => setRefreshCount(refreshCount + 1);

  const endpoint = `patient/${patientId}/referrals`;

  const onCancelReferral = async () => {
    await api.put(`referral/${selectedReferral.id}`, { status: REFERRAL_STATUSES.CANCELLED });
    setModalOpen(false);
    refreshTable();
  };
  const onCompleteReferral = async () => {
    await api.put(`referral/${selectedReferral.id}`, { status: REFERRAL_STATUSES.COMPLETED });
    refreshTable();
  };
  const onViewEncounter = useCallback(async () => {
    loadEncounter(selectedReferral.encounterId, true);
  }, [selectedReferral, loadEncounter]);

  const MODALS = {
    [MODAL_IDS.ADMIT]: ({ referralToDelete, ...props }) => (
      <EncounterModal {...props} patient={patient} referral={referralToDelete} />
    ),
    [MODAL_IDS.CANCEL]: props => (
      <ConfirmModal
        {...props}
        title="Cancel referral"
        text="WARNING: This action is irreversible!"
        subText="Are you sure you want to cancel this referral?"
        cancelButtonText="No"
        confirmButtonText="Yes"
        ConfirmButton={DeleteButton}
        onConfirm={onCancelReferral}
        onCancel={() => setModalOpen(false)}
      />
    ),
    [MODAL_IDS.DELETE]: DeleteReferralModal,
  };

  const menuActions = [
    {
      label: 'Admit',
      action: () => handleChangeModalId(MODAL_IDS.ADMIT),
    },
    {
      label: 'Complete',
      action: onCompleteReferral,
    },
    {
      label: 'Cancel',
      action: () => handleChangeModalId(MODAL_IDS.CANCEL),
    },
    {
      label: 'Delete',
      action: () => handleChangeModalId(MODAL_IDS.DELETE),
      permissionCheck: () => {
        return ability?.can('delete', 'Referral');
      },
    },
    // Worth keeping around to address in proper linear card
    {
      label: 'View',
      permissionCheck: () => false, // always false, field no longer exists.
      action: onViewEncounter,
    },
  ];

  const actions = menuActions
    .filter(({ permissionCheck }) => {
      return permissionCheck ? permissionCheck() : true;
    })
    .reduce((acc, { label, action }) => {
      acc[label] = action;
      return acc;
    }, {});

  const columns = [
    { key: 'date', title: 'Referral date', accessor: getDate },
    { key: 'referralType', title: 'Referral type', accessor: getReferralType },
    { key: 'referredBy', title: 'Referral completed by', accessor: getReferralBy },
    { key: 'status', title: 'Status', accessor: getStatus },
    {
      key: 'actions',
      title: 'Actions',
      dontCallRowInput: true,
      sortable: false,
      CellComponent: ({ data }) => {
        return (
          <div onMouseEnter={() => setSelectedReferral(data)}>
            <MenuButton actions={actions} />
          </div>
        );
      },
    },
  ];

  const onCloseReferral = useCallback(() => setSelectedReferralId(null), []);

  const handleChangeModalId = id => {
    setModalId(id);
    setModalOpen(true);
  };

  const ActiveModal = MODALS[modalId] || null;

  return (
    <>
      <SurveyResponseDetailsModal surveyResponseId={selectedReferralId} onClose={onCloseReferral} />
      <DataFetchingTable
        columns={columns}
        endpoint={endpoint}
        initialSort={{
          orderBy: 'date',
          order: 'asc',
        }}
        noDataMessage="No referrals found"
        onRowClick={onSelectReferral}
        allowExport={false}
        refreshCount={refreshCount}
      />
      {ActiveModal && (
        <ActiveModal
          open={modalOpen}
          referralToDelete={selectedReferral}
          endpoint={endpoint}
          onClose={() => {
            setModalOpen(false);
            refreshTable();
          }}
        />
      )}
    </>
  );
});
