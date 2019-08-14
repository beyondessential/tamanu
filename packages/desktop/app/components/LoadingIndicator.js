import React from 'react';

export const LoadingIndicator = React.memo(({ loading, children }) =>
  loading ? <div>Loading...</div> : children,
);
