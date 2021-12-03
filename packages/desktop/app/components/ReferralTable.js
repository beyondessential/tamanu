import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

import { REFERRAL_STATUSES } from 'shared/constants';
import { REFERRAL_STATUS_LABELS } from '../constants';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { DropdownButton } from './DropdownButton';

import { EncounterModal } from './EncounterModal';
import { useEncounter } from '../contexts/Encounter';
import { useApi } from '../api';
import { SurveyResponseDetailsModal } from './SurveyResponseDetailsModal';

const ActionDropdown = React.memo(({ row, refreshTable }) => {
  const [open, setOpen] = useState(false);
  const { loadEncounter } = useEncounter();
  const api = useApi();

  const onViewEncounter = useCallback(async () => {
    loadEncounter(row.encounterId, true);
  }, [row]);
  const onCompleteReferral = useCallback(async () => {
    await api.put(`referral/${row.id}`, { status: REFERRAL_STATUSES.COMPLETED });
    refreshTable();
  }, [row]);
  const onCancelReferral = useCallback(async () => {
    console.log('TODO: Delete referral object');
  }, [row]);

  const actions = [
    {
      label: 'Admit',
      condition: () => row.status === REFERRAL_STATUSES.PENDING,
      onClick: () => setOpen(true),
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
      onClick: onCancelReferral,
    },
  ].filter(action => !action.condition || action.condition());

  return (
    <>
      <DropdownButton color="primary" actions={actions} />
      <EncounterModal
        open={open}
        onClose={() => setOpen(false)}
        patientId={row.initiatingEncounter.patientId}
        referral={row}
      />
    </>
  );
});

const ReferralBy = ({ surveyResponse: { survey, answers } }) => {
  const fieldNames = ['Referring doctor', 'Referral completed by'];
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
        const user = await api.get(`user/${encodeURIComponent(referralByAnswer.body)}`);
        setName(user.displayName);
      } catch (e) {
        if (e.message === '404') {
          setName(referralByAnswer.body);
        } else {
          setName('Unknown');
        }
      }
    })();
  }, [survey]);

  return name;
};

const getDate = ({ initiatingEncounter }) => <DateDisplay date={initiatingEncounter.startDate} />;
const getReferralType = ({ surveyResponse: { survey } }) => survey.name;
const getReferralBy = ({ surveyResponse }) => <ReferralBy surveyResponse={surveyResponse} />;
const getStatus = ({ status }) => REFERRAL_STATUS_LABELS[status] || 'Unknown';
const getActions = ({ onTableRefresh, ...row }) => (
  <ActionDropdown refreshTable={onTableRefresh} row={row} />
);

const columns = [
  { key: 'date', title: 'Referral date', accessor: getDate },
  { key: 'department', title: 'Referral type', accessor: getReferralType },
  { key: 'referredBy', title: 'Referral completed by', accessor: getReferralBy },
  { key: 'status', title: 'Status', accessor: getStatus },
  { key: 'actions', title: 'Actions', accessor: getActions, dontCallRowInput: true },
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
        noDataMessage="No referrals found"
        onRowClick={onSelectReferral}
      />
    </>
  );
});
