import React from 'react';
import { InvoicesTable } from '../../../components/Invoice/InvoicesTable';
import { ContentPane } from '../../../components';

export const InvoicesPane = React.memo(({ patient }) => {
  return (
    <>
      <ContentPane>
        <InvoicesTable patient={patient} />
      </ContentPane>
    </>
  );
});
