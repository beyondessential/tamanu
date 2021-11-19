import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

import { DocumentsTable } from '../../components/DocumentsTable';

export const DocumentsPane = React.memo(({ encounter }) => (
  <div>
    <DocumentsTable encounter={encounter} />
  </div>
));
