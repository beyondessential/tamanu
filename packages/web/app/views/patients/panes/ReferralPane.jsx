import React from 'react';
import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Button, TranslatedText } from '@tamanu/ui-components';
import { ContentPane, NoteModalActionBlocker, TableButtonRow } from '../../../components';
import { ReferralTable } from '../../../components/ReferralTable';

export const ReferralPane = React.memo(({ patient }) => {
  const dispatch = useDispatch();
  const params = useParams();
  const handleNewReferral = () =>
    dispatch(push(`/patients/${params.category}/${params.patientId}/referrals/new`));
  return (
    <ContentPane data-testid="contentpane-ztqm">
      <TableButtonRow variant="small" data-testid="tablebuttonrow-4sww">
        <NoteModalActionBlocker>
          <Button onClick={handleNewReferral} data-testid="button-u28m">
            <TranslatedText
              stringId="patient.referral.action.create"
              fallback="New referral"
              data-testid="translatedtext-93j1"
            />
          </Button>
        </NoteModalActionBlocker>
      </TableButtonRow>
      <ReferralTable patientId={patient.id} data-testid="referraltable-6sz8" />
    </ContentPane>
  );
});
