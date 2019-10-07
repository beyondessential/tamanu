import React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { LoadingIndicator } from '../../components/LoadingIndicator';
import { PrintPageButton } from '../../components/Button';

const SummaryPage = styled.div`
  @media print {
    * {
      color: red;
    }
  }
`;

const DumbDischargeSummaryView = React.memo(({ visit, patient, loading }) => {
  return (
    <SummaryPage>
      <h3>Discharge Summary</h3>
      <PrintPageButton fileName="Discharge" />
    </SummaryPage>
  );
});

export const DischargeSummaryView = connect(state => ({
  loading: state.visit.loading,
  visit: state.visit,
  patient: state.patient,
}))(DumbDischargeSummaryView);
