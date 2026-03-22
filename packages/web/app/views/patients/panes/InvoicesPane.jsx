import React from 'react';
import styled from 'styled-components';
import { InvoicesTable } from '../../../features/Invoice/InvoicesTable';

const ContentPane = styled.div`
  margin: 24px 25px 0px 14px;
`;

export const InvoicesPane = React.memo(({ patient }) => {
  return (
    <>
      <ContentPane data-testid="contentpane-0ruz">
        <InvoicesTable patient={patient} data-testid="invoicestable-c1ar" />
      </ContentPane>
    </>
  );
});
