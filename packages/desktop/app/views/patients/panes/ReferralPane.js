import React from 'react';

import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';

import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';
import { ReferralTable } from '../../../components/ReferralTable';

export const ReferralPane = React.memo(({ patient }) => {
  const dispatch = useDispatch();
  const params = useParams();
  const handleNewReferral = () =>
    dispatch(push(`/patients/${params.category}/${params.patientId}/referrals/new`));
  return (
    <div>
      <ReferralTable patientId={patient.id} />
      <ContentPane>
        <Button onClick={handleNewReferral} variant="contained" color="primary">
          New referral
        </Button>
      </ContentPane>
    </div>
  );
});
