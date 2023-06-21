import React, { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { REFERRAL_STATUSES } from 'shared/constants';
import { REFERRAL_STATUS_LABELS } from '../constants';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { DropdownButton } from './DropdownButton';

import { EncounterModal } from './EncounterModal';
import { useEncounter } from '../contexts/Encounter';
import { useApi, isErrorUnknownAllow404s } from '../api';
import { SurveyResponseDetailsModal } from './SurveyResponseDetailsModal';
import { DeleteButton } from './Button';
import { ConfirmModal } from './ConfirmModal';

const ACTION_MODAL_STATES = {
  CLOSED: 'closed',
  WARNING_OPEN: 'warning',
  ENCOUNTER_OPEN: 'encounter',
};

const ActionDropdown = React.memo(({ row, refreshTable }) => {
  const [modalStatus, setModalStatus] = useState(ACTION_MODAL_STATES.CLOSED);
  const { loadEncounter } = useEncounter();
  const patient = useSelector(state => state.patient);

  const api = useApi();

  // Modal callbacks
  const onCloseModal = useCallback(() => setModalStatus(ACTION_MODAL_STATES.CLOSED), []);
  const onCancelReferral = useCallback(async () => {
    await api.put(`referral/${row.id}`, { status: REFERRAL_STATUSES.CANCELLED });
    onCloseModal();
    refreshTable();
  }, [row, api, onCloseModal, refreshTable]);

  // Actions callbacks
  const onViewEncounter = useCallback(async () => {
    loadEncounter(row.encounterId, true);
  }, [row, loadEncounter]);
  const onCompleteReferral = useCallback(async () => {
    await api.put(`referral/${row.id}`, { status: REFERRAL_STATUSES.COMPLETED });
    refreshTable();
  }, [row, api, refreshTable]);

  const actions = [
    {
      label: 'Admit',
      condition: () => row.status === REFERRAL_STATUSES.PENDING,
      onClick: () => setModalStatus(ACTION_MODAL_STATES.ENCOUNTER_OPEN),
    },
    // Worth keeping around to address in proper linear card
    {
      label: 'View',
      condition: () => !!row.encounterId, // always false, field no longer exists.
      onClick: onViewEncounter,
    },
    {
      label: 'Complete',
      condition: () => row.status === REFERRAL_STATUSES.PENDING,
      onClick: onCompleteReferral,
    },
    {
      label: 'Cancel',
      condition: () => row.status === REFERRAL_STATUSES.PENDING,
      onClick: () => setModalStatus(ACTION_MODAL_STATES.WARNING_OPEN),
    },
  ].filter(action => !action.condition || action.condition());

  return (
    <>
      <DropdownButton actions={actions} variant="outlined" size="small" />
      <EncounterModal
        open={modalStatus === ACTION_MODAL_STATES.ENCOUNTER_OPEN}
        onClose={onCloseModal}
        patient={patient}
        referral={row}
      />
      <ConfirmModal
        open={modalStatus === ACTION_MODAL_STATES.WARNING_OPEN}
        title="Cancel referral"
        text="WARNING: This action is irreversible!"
        subText="Are you sure you want to cancel this referral?"
        cancelButtonText="No"
        confirmButtonText="Yes"
        ConfirmButton={DeleteButton}
        onConfirm={onCancelReferral}
        onCancel={onCloseModal}
      />
    </>
  );
});

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
const getActions = ({ refreshTable, ...row }) => (
  <ActionDropdown refreshTable={refreshTable} row={row} />
);

const columns = [
  { key: 'date', title: 'Referral date', accessor: getDate },
  { key: 'referralType', title: 'Referral type', accessor: getReferralType },
  { key: 'referredBy', title: 'Referral completed by', accessor: getReferralBy },
  { key: 'status', title: 'Status', accessor: getStatus },
  {
    key: 'actions',
    title: 'Actions',
    accessor: getActions,
    dontCallRowInput: true,
  },
];

export const ReferralTable = React.memo(({ patientId }) => {
  const [selectedReferralId, setSelectedReferralId] = useState(null);
  const onSelectReferral = useCallback(referral => {
    setSelectedReferralId(referral.surveyResponseId);
  }, []);
  const onCloseReferral = useCallback(() => setSelectedReferralId(null), []);

  return (
    <>
      <SurveyResponseDetailsModal surveyResponseId={selectedReferralId} onClose={onCloseReferral} />
      <DataFetchingTable
        columns={columns}
        endpoint={`patient/${patientId}/referrals`}
        initialSort={{
          orderBy: 'date',
          order: 'asc',
        }}
        noDataMessage="No referrals found"
        onRowClick={onSelectReferral}
        allowExport={false}
      />
    </>
  );
});
