import React from 'react';
import styled from 'styled-components';

import { ContentPane } from './ContentPane';
import { DeleteButton, Button } from './Button';

const BackButton = styled(Button)`
  margin-left: 8px;
`;

export const ConfirmAdministeredVaccineDelete = React.memo(({ onDelete, onClose }) => (
  <ContentPane>
    <h3>WARNING: This action is irreversible!</h3>
    <p>Are you sure you want to delete this vaccination record?</p>
    <DeleteButton onClick={() => onDelete()} variant="contained" color="primary">
      Yes
    </DeleteButton>
    <BackButton onClick={() => onClose()} variant="contained" color="primary">
      No
    </BackButton>
  </ContentPane>
));
