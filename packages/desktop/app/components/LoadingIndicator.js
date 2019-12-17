import React from 'react';

import { ContentPane } from './ContentPane';

export const LoadingIndicator = React.memo(() => (
  <ContentPane>
    <div>Loading...</div>
  </ContentPane>
));
