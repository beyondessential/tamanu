import React from 'react';

import { DataFetchingTable } from './Table';

const columns = [
  // Test category
  // Test type
  // Normal Range
  // [Date]
];

export const PatientLabTestsTable = React.memo(({ patientId }) => {
  return (
    <DataFetchingTable
      columns={columns}
      endpoint={`patient/${patientId}/labTests`}
      noDataMessage="This patient has no lab results to display. Once lab results are available they will be displayed here."
      // TODO Open modal on click WAITM-666
      // onRowClick={onSelectLabTest}
      allowExport={false}
    />
  );
});
