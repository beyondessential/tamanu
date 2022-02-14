import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import { useApi } from '../../../api';

import { LoadingIndicator } from '../../../components/LoadingIndicator';

const EmptyPane = styled.div`
  text-align: center;
`;

export const InvoicingPane = React.memo(({ encounter }) => {
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState(null);
  const api = useApi();

  useEffect(() => {
    (async () => {
      try {
        const invoiceResponse = await api.get(`encounter/${encounter.id}/invoice`);
        setInvoice(invoiceResponse);
      } catch (e) {
        setError('Cannot find invoice for this encounter');
      }
    })();
  }, [api, encounter]);

  if (error) {
    return (
      <EmptyPane>
        <h3>{error}</h3>
      </EmptyPane>
    );
  }
  if (!invoice) {
    return <LoadingIndicator />;
  }
  return <div>Work In Progress</div>;
});
