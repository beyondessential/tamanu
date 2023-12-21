import React from 'react';

import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

import { TableButtonRow, Button, ContentPane } from '../../../components';
import { ReferralTable } from '../../../components/ReferralTable';

export const ReferralPane = React.memo(({ patient }) => {
  const dispatch = useDispatch();
  const params = useParams();
  const handleNewReferral = () =>
    dispatch(push(`/patients/${params.category}/${params.patientId}/referrals/new`));
  return (
    <ContentPane>
      <TableButtonRow variant="small">
        <Button onClick={handleNewReferral}>New referral</Button>
      </TableButtonRow>
      <ReferralTable patientId={patient.id} />
    </ContentPane>
  );
});
