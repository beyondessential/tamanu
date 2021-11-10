import React, { useState } from 'react';
import { InvoicesTable } from '../../../components/InvoicesTable';
import { InvoicesSearchBar } from '../../../components/InvoicesSearchBar';

export const InvoicesPane = React.memo(({ patient }) => {
  const [searchParameters, setSearchParameters] = useState({});
  return (
    <>
      <InvoicesSearchBar
        searchParameters={searchParameters}
        setSearchParameters={setSearchParameters}
      />
      <InvoicesTable patient={patient} searchParameters={searchParameters} />
    </>
  );
});
