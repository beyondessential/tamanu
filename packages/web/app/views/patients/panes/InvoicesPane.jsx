import React, { useState } from 'react';
import { InvoicesTable } from '../../../components/InvoicesTable';
import { ContentPane, InvoicesSearchBar } from '../../../components';

export const InvoicesPane = React.memo(({ patient }) => {
  const [searchParameters, setSearchParameters] = useState({});
  return (
    <>
      <InvoicesSearchBar onSearch={setSearchParameters} />
      <ContentPane>
        <InvoicesTable patient={patient} searchParameters={searchParameters} />
      </ContentPane>
    </>
  );
});
