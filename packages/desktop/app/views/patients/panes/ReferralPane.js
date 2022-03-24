import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import { Button } from '../../../components/Button';
import { ContentPane } from '../../../components/ContentPane';
import { ReferralTable } from '../../../components/ReferralTable';

export const ReferralPane = connect(null, dispatch => ({
  onNavigateToReferrals: () => dispatch(push('/referrals')),
}))(
  React.memo(({ onNavigateToReferrals, patient }) => (
    <div>
      <ReferralTable patientId={patient.id} />
      <ContentPane>
        <Button onClick={onNavigateToReferrals} variant="contained" color="primary">
          New referral
        </Button>
      </ContentPane>
    </div>
  )),
);
