import React, { useState } from 'react';
import { ContentPane, InvoicesSearchBar } from '../../../components';
import { InvoicesTable } from '../../../components/InvoicesTable';

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
