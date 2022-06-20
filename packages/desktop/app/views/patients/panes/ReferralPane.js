import React from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { TableButtonRow, Button, ContentPane } from '../../../components';
import { ReferralTable } from '../../../components/ReferralTable';

export const ReferralPane = connect(null, dispatch => ({
  onNavigateToReferrals: () => dispatch(push('/referrals')),
}))(
  React.memo(({ onNavigateToReferrals, patient }) => (
    <ContentPane>
      <TableButtonRow variant="small">
        <Button onClick={onNavigateToReferrals} variant="contained" color="primary">
          New Referral
        </Button>
      </TableButtonRow>
      <ReferralTable patientId={patient.id} />
    </ContentPane>
  )),
);
