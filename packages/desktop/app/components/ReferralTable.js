import React, { useState, useCallback, useEffect } from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { DropdownButton } from './DropdownButton';

import { EncounterModal } from './EncounterModal';
import { useEncounter } from '../contexts/Encounter';
import { useReferral } from '../contexts/Referral';
import { ReferralDetailsModal } from './ReferralDetailsModal';
import { connectApi } from '../api';
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
        patientId={row.patientId}
        referral={row}
      />
    </>
  );
});

const DepartmentDisplay = React.memo(({ id, fetchData }) => {
  const [name, setName] = useState('Unknown');

  useEffect(() => {
    (async () => {
      const result = await fetchData(encodeURIComponent(id));
      if (result) setName(result.name);
    })();
  }, [id]);

  return name;
});
const ConnectedDepartmentDisplay = connectApi(api => ({
  fetchData: id => api.get(`department/${id}`),
}))(DepartmentDisplay);

const ExaminerDisplay = React.memo(({ id, fetchData }) => {
  const [name, setName] = useState('Unknown');

  useEffect(() => {
    (async () => {
      const result = await fetchData(encodeURIComponent(id));
      if (result) setName(result.displayName);
    })();
  }, [id]);

  return name;
});
const ConnectedExaminerDisplay = connectApi(api => ({
  fetchReferenceData: id => api.get(`user/${id}`),
}))(ExaminerDisplay);

const ReferringDoctorDisplay = React.memo(
  ({ surveyResponse: { surveyId, answers }, fetchUser, fetchSurvey }) => {
    const [name, setName] = useState('Unknown');

    useEffect(() => {
      (async () => {
        const survey = await fetchSurvey(encodeURIComponent(surveyId));
        const referringDoctorComponent = survey.components.find(
          ({ dataElement }) => dataElement.name === 'Referring doctor',
        );
        const referringDoctorAnswer = answers.find(
          ({ dataElementId }) => dataElementId === referringDoctorComponent.dataElementId,
        );
        const result = await fetchUser(encodeURIComponent(referringDoctorAnswer.body));
        if (result) setName(result.displayName);
      })();
    }, [surveyId]);

    return name;
  },
);
const ConnectedReferringDoctorDisplay = connectApi(api => ({
  fetchUser: id => api.get(`user/${id}`),
  fetchSurvey: id => api.get(`survey/${id}`),
}))(ReferringDoctorDisplay);

const getDate = ({ initiatingEncounter }) => <DateDisplay date={initiatingEncounter.startDate} />;
const getDepartment = ({ initiatingEncounter }) => (
  <ConnectedDepartmentDisplay id={initiatingEncounter.departmentId} />
);
const getDisplayName = ({ surveyResponse }) => (
  <ConnectedReferringDoctorDisplay surveyResponse={surveyResponse} />
);
const getStatus = ({ completingEncounter }) => (completingEncounter ? 'Complete' : 'Pending');

const getActions = row => <ActionDropdown row={row} />;

const columns = [
  { key: 'date', title: 'Referral date', accessor: getDate },
  { key: 'department', title: 'Department', accessor: getDepartment },
  { key: 'referredBy', title: 'Referring doctor', accessor: getDisplayName },
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
