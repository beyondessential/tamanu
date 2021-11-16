import React, { useState, useCallback, useEffect } from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { DropdownButton } from './DropdownButton';

import { EncounterModal } from './EncounterModal';
import { useEncounter } from '../contexts/Encounter';
import { useApi } from '../api';
import { SurveyResponseDetailsModal } from './SurveyResponseDetailsModal';

const ActionDropdown = React.memo(({ row }) => {
  const [open, setOpen] = useState(false);
  const { loadEncounter } = useEncounter();
  const onViewEncounter = useCallback(async () => {
    loadEncounter(row.encounterId, true);
  }, [row]);
  const onCancelReferral = useCallback(async () => {
    console.log('TODO: Delete referral object');
  }, [row]);

  const actions = [
    {
      label: 'Admit',
      condition: () => !row.encounterId && !row.cancelled,
      onClick: () => setOpen(true),
    },
    {
      label: 'View',
      condition: () => !!row.encounterId,
      onClick: onViewEncounter,
    },
    {
      label: 'Cancel referral',
      condition: () => !row.encounterId && !row.cancelled,
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

const ReferringDoctorDisplay = ({ surveyResponse: { survey, answers } }) => {
  const fieldNames = ['Referring doctor', 'Referral completed by'];
  const api = useApi();
  const [name, setName] = useState('');

  console.log(survey.components.map(({ dataElement }) => dataElement.name))
  useEffect(() => {
    (async () => {
      const referringDoctorComponent = survey.components.find(({ dataElement }) =>
        fieldNames.includes(dataElement.name),
      );
      if (!referringDoctorComponent) {
        return;
      }
      const referringDoctorAnswer = answers.find(
        ({ dataElementId }) => dataElementId === referringDoctorComponent.dataElementId,
      );
      if (!referringDoctorAnswer) {
        setName('Not provided');
        return;
      }
      const doctor = await api.get(`user/${encodeURIComponent(referringDoctorAnswer.body)}`);
      if (doctor) {
        setName(doctor.displayName);
      } else {
        setName('Unknown');
      }
    })();
  }, [survey]);

  return name;
};

const getDate = ({ initiatingEncounter }) => <DateDisplay date={initiatingEncounter.startDate} />;

const getReferralType = ({ surveyResponse: { survey } }) => survey.name;
const getReferringDoctor = ({ surveyResponse }) => (
  <ReferringDoctorDisplay surveyResponse={surveyResponse} />
);
const getStatus = ({ completingEncounter }) => (completingEncounter ? 'Complete' : 'Pending');

const getActions = row => <ActionDropdown row={row} />;

const columns = [
  { key: 'date', title: 'Referral date', accessor: getDate },
  { key: 'department', title: 'Referral type', accessor: getReferralType },
  { key: 'referredBy', title: 'Referring doctor', accessor: getReferringDoctor },
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
