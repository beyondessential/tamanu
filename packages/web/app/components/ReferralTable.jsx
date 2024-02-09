import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { REFERRAL_STATUSES } from '@tamanu/constants';
import { REFERRAL_STATUS_LABELS } from '../constants';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { DropdownButton } from './DropdownButton';

import { EncounterModal } from './EncounterModal';
import { useEncounter } from '../contexts/Encounter';
import { isErrorUnknownAllow404s, useApi } from '../api';
import { SurveyResponseDetailsModal } from './SurveyResponseDetailsModal';
import { DeleteButton } from './Button';
import { ConfirmModal } from './ConfirmModal';
import { TranslatedText } from './Translation/TranslatedText';
import { TranslatedEnum } from './Translation/TranslatedEnum.jsx';

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
      label: <TranslatedText stringId="patient.referral.action.admit" fallback="Admit" />,
      condition: () => row.status === REFERRAL_STATUSES.PENDING,
      onClick: () => setModalStatus(ACTION_MODAL_STATES.ENCOUNTER_OPEN),
    },
    // Worth keeping around to address in proper linear card
    {
      label: <TranslatedText stringId="general.action.view" fallback="View" />,
      condition: () => !!row.encounterId, // always false, field no longer exists.
      onClick: onViewEncounter,
    },
    {
      label: <TranslatedText stringId="patient.referral.action.complete" fallback="Complete" />,
      condition: () => row.status === REFERRAL_STATUSES.PENDING,
      onClick: onCompleteReferral,
    },
    {
      label: <TranslatedText stringId="general.action.cancel" fallback="Cancel" />,
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
        title={<TranslatedText stringId="referral.modal.cancel.title" fallback="Cancel referral" />}
        text={
          <TranslatedText
            stringId="referral.modal.cancel.warningText1"
            fallback="WARNING: This action is irreversible!"
          />
        }
        subText={
          <TranslatedText
            stringId="referral.modal.cancel.warningText2"
            fallback="Are you sure you want to cancel this referral?"
          />
        }
        cancelButtonText={<TranslatedText stringId="general.action.no" fallback="No" />}
        confirmButtonText={<TranslatedText stringId="general.action.yes" fallback="Yes" />}
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
  const [name, setName] = useState(
    <TranslatedText stringId="general.fallback.notApplicable" fallback="N/A" />,
  );

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
const getStatus = ({ status }) =>
  (
    <TranslatedEnum
      prefix="referral.property.status.label"
      value={status}
      enumValues={REFERRAL_STATUS_LABELS}
    />
  ) || <TranslatedText stringId="general.fallback.unknown" fallback="Unknown" />;
const getActions = ({ refreshTable, ...row }) => (
  <ActionDropdown refreshTable={refreshTable} row={row} />
);

const columns = [
  {
    key: 'date',
    title: (
      <TranslatedText stringId="referral.table.column.referralDate" fallback="Referral date" />
    ),
    accessor: getDate,
  },
  {
    key: 'referralType',
    title: (
      <TranslatedText stringId="referral.table.column.referralType" fallback="Referral type" />
    ),
    accessor: getReferralType,
  },
  {
    key: 'referredBy',
    title: (
      <TranslatedText
        stringId="referral.table.column.referralCompletedBy"
        fallback="Referral completed by"
      />
    ),
    accessor: getReferralBy,
  },
  {
    key: 'status',
    title: <TranslatedText stringId="referral.table.column.status" fallback="Status" />,
    accessor: getStatus,
  },
  {
    key: 'actions',
    title: <TranslatedText stringId="referral.table.column.actions" fallback="Actions" />,
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
        noDataMessage={
          <TranslatedText stringId="referral.table.noData" fallback="No referrals found" />
        }
        onRowClick={onSelectReferral}
        allowExport={false}
      />
    </>
  );
});
