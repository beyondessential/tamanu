import React from 'react';

import { ContentPane } from './ContentPane';

export const LoadingIndicator = React.memo(({ loadingText = 'Loading...' }) => (
  <ContentPane>
    <div>{loadingText}</div>
  </ContentPane>
));
