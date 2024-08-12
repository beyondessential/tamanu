import React from 'react';
import styled from 'styled-components';
import { InvoicesTable } from '../../../components/Invoice/InvoicesTable';

const ContentPane = styled.div`
  margin: 24px 25px 0px 14px;
`;

export const InvoicesPane = React.memo(({ patient }) => {
  return (
    <>
      <ContentPane>
        <InvoicesTable patient={patient} />
      </ContentPane>
    </>
  );
});
