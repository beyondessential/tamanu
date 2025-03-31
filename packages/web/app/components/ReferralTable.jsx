import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { REFERRAL_STATUSES, REFERRAL_STATUS_LABELS } from '@tamanu/constants';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

import { EncounterModal } from './EncounterModal';
import { useEncounter } from '../contexts/Encounter';
import { isErrorUnknownAllow404s, useApi } from '../api';
import { SurveyResponseDetailsModal } from './SurveyResponseDetailsModal';
import { DeleteButton } from './Button';
import { ConfirmModal } from './ConfirmModal';
import { TranslatedText, TranslatedEnum } from './Translation';

import { useAuth } from '../contexts/Auth';
import { MenuButton } from './MenuButton';
import { DeleteReferralModal } from '../views/patients/components/DeleteReferralModal';
import { useRefreshCount } from '../hooks/useRefreshCount';
import { SurveyResponsesPrintModal } from './PatientPrinting/modals/SurveyResponsesPrintModal';

const fieldNames = ['Referring doctor', 'Referral completed by'];
const ReferralBy = ({ surveyResponse: { survey, answers } }) => {
  const api = useApi();
  const [name, setName] = useState(
    <TranslatedText
      stringId="general.fallback.notApplicable"
      fallback="N/A"
      data-test-id='translatedtext-ez9t' />,
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
  return <DateDisplay date={submissionDate} data-test-id='datedisplay-gz3c' />;
};
const getReferralType = ({ surveyResponse: { survey } }) => survey.name;
const getReferralBy = ({ surveyResponse }) => <ReferralBy surveyResponse={surveyResponse} />;
const getStatus = ({ status }) => (
  <TranslatedEnum
    value={status}
    enumValues={REFERRAL_STATUS_LABELS}
    data-test-id='translatedenum-ixxi' />
);

const MODAL_IDS = {
  PRINT: 'print',
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
  const [refreshCount, updateRefreshCount] = useRefreshCount();
  const [selectedReferral, setSelectedReferral] = useState({});
  const [selectedReferralId, setSelectedReferralId] = useState(null);
  const onSelectReferral = useCallback(referral => {
    setSelectedReferralId(referral.surveyResponseId);
    setSelectedReferral(referral);
  }, []);

  const endpoint = `patient/${patientId}/referrals`;

  const onCancelReferral = useCallback(async () => {
    await api.put(`referral/${selectedReferral.id}`, { status: REFERRAL_STATUSES.CANCELLED });
    setModalOpen(false);
    updateRefreshCount();
  }, [api, selectedReferral.id, updateRefreshCount]);
  const onCompleteReferral = async () => {
    await api.put(`referral/${selectedReferral.id}`, { status: REFERRAL_STATUSES.COMPLETED });
    updateRefreshCount();
  };
  const onViewEncounter = useCallback(async () => {
    loadEncounter(selectedReferral.encounterId, true);
  }, [selectedReferral, loadEncounter]);

  const onCloseReferral = useCallback(() => setSelectedReferralId(null), []);

  const handleChangeModalId = id => {
    setModalId(id);
    setModalOpen(true);
  };

  const actions = [
    {
      label: <TranslatedText
        stringId="general.action.print"
        fallback="Print"
        data-test-id='translatedtext-a88k' />,
      action: () => handleChangeModalId(MODAL_IDS.PRINT),
    },
    {
      label: <TranslatedText
        stringId="patient.referral.action.admit"
        fallback="Admit"
        data-test-id='translatedtext-aigr' />,
      action: () => handleChangeModalId(MODAL_IDS.ADMIT),
      condition: data => data.status === REFERRAL_STATUSES.PENDING,
    },
    {
      label: <TranslatedText
        stringId="patient.referral.action.complete"
        fallback="Complete"
        data-test-id='translatedtext-yt1a' />,
      action: onCompleteReferral,
      condition: data => data.status === REFERRAL_STATUSES.PENDING,
    },
    {
      label: <TranslatedText
        stringId="general.action.cancel"
        fallback="Cancel"
        data-test-id='translatedtext-tlzp' />,
      action: () => handleChangeModalId(MODAL_IDS.CANCEL),
      condition: data => data.status === REFERRAL_STATUSES.PENDING,
    },
    {
      label: <TranslatedText
        stringId="general.action.delete"
        fallback="Delete"
        data-test-id='translatedtext-7wxu' />,
      action: () => handleChangeModalId(MODAL_IDS.DELETE),
      permissionCheck: () => {
        return ability?.can('delete', 'Referral');
      },
    },
    // Worth keeping around to address in proper linear card
    {
      label: <TranslatedText
        stringId="general.action.view"
        fallback="View"
        data-test-id='translatedtext-ph9s' />,
      permissionCheck: () => false, // always false, field no longer exists.
      action: onViewEncounter,
    },
  ].filter(({ permissionCheck }) => {
    return permissionCheck ? permissionCheck() : true;
  });

  const columns = [
    {
      key: 'date',
      title: (
        <TranslatedText
          stringId="referral.table.column.referralDate"
          fallback="Referral date"
          data-test-id='translatedtext-6db6' />
      ),
      accessor: getDate,
    },
    {
      key: 'referralType',
      title: (
        <TranslatedText
          stringId="referral.table.column.referralType"
          fallback="Referral type"
          data-test-id='translatedtext-bm1j' />
      ),
      accessor: getReferralType,
    },
    {
      key: 'referredBy',
      title: (
        <TranslatedText
          stringId="referral.table.column.referralCompletedBy"
          fallback="Referral completed by"
          data-test-id='translatedtext-6wes' />
      ),
      accessor: getReferralBy,
    },
    {
      key: 'status',
      title: <TranslatedText
        stringId="referral.table.column.status"
        fallback="Status"
        data-test-id='translatedtext-lyo4' />,
      accessor: getStatus,
    },
    {
      key: '', // For actions column, but we don't want a header for this
      title: '',
      dontCallRowInput: true,
      sortable: false,
      CellComponent: ({ data }) => {
        const filteredActions = actions.filter(
          action => !action.condition || action.condition(data),
        );
        return (
          <div onMouseEnter={() => setSelectedReferral(data)}>
            <MenuButton actions={filteredActions} data-test-id='menubutton-u6ei' />
          </div>
        );
      },
    },
  ];

  const ActiveModal = useMemo(() => {
    const MODALS = {
      [MODAL_IDS.PRINT]: ({ selectedReferral, ...props }) => (
        <SurveyResponsesPrintModal
          {...props}
          patient={patient}
          surveyResponseId={selectedReferral?.surveyResponseId}
          title={selectedReferral?.surveyResponse?.survey?.name}
          isReferral
        />
      ),
      [MODAL_IDS.ADMIT]: ({ selectedReferral, ...props }) => (
        <EncounterModal {...props} patient={patient} referral={selectedReferral} />
      ),
      [MODAL_IDS.CANCEL]: props => (
        <ConfirmModal
          {...props}
          title={
            <TranslatedText
              stringId="referral.modal.cancel.title"
              fallback="Cancel referral"
              data-test-id='translatedtext-pb1o' />
          }
          text={
            <TranslatedText
              stringId="referral.modal.cancel.warningText1"
              fallback="WARNING: This action is irreversible!"
              data-test-id='translatedtext-ipuy' />
          }
          subText={
            <TranslatedText
              stringId="referral.modal.cancel.warningText2"
              fallback="Are you sure you want to cancel this referral?"
              data-test-id='translatedtext-7we9' />
          }
          cancelButtonText={<TranslatedText
            stringId="general.action.no"
            fallback="No"
            data-test-id='translatedtext-jx9b' />}
          confirmButtonText={<TranslatedText
            stringId="general.action.yes"
            fallback="Yes"
            data-test-id='translatedtext-8ff5' />}
          ConfirmButton={DeleteButton}
          onConfirm={onCancelReferral}
          onCancel={() => setModalOpen(false)}
        />
      ),
      [MODAL_IDS.DELETE]: ({ selectedReferral, ...props }) => (
        <DeleteReferralModal {...props} referralToDelete={selectedReferral} />
      ),
    };

    return MODALS[modalId] || null;
  }, [modalId, patient, onCancelReferral]);

  return (
    <>
      <SurveyResponseDetailsModal
        surveyResponseId={selectedReferralId}
        onClose={onCloseReferral}
        onPrint={() => handleChangeModalId(MODAL_IDS.PRINT)}
      />
      <DataFetchingTable
        columns={columns}
        endpoint={endpoint}
        initialSort={{
          orderBy: 'date',
          order: 'asc',
        }}
        noDataMessage={
          <TranslatedText
            stringId="referral.table.noData"
            fallback="No referrals found"
            data-test-id='translatedtext-l0f2' />
        }
        onRowClick={onSelectReferral}
        allowExport={false}
        refreshCount={refreshCount}
        data-test-id='datafetchingtable-6frb' />
      {ActiveModal && (
        <ActiveModal
          open={modalOpen}
          selectedReferral={selectedReferral}
          endpoint={endpoint}
          onClose={() => {
            setModalOpen(false);
            updateRefreshCount();
          }}
        />
      )}
    </>
  );
});
