import Remove from '@mui/icons-material/Remove';
import React from 'react';
import styled from 'styled-components';

import { TextButton, TranslatedText } from '@tamanu/ui-components';

const RemoveAdditionalDoseButton = styled(TextButton).attrs({
  children: (
    <TranslatedText
      stringId="medication.mar.action.removeAdditionalDose"
      fallback="Remove additional dose"
    />
  ),
  startIcon: <Remove style={{ fontSize: 12 }} />,
})`
  color: ${p => p.theme.palette.text.primary};
  font-size: 14px;
  font-weight: 400;
  line-height: 1.3;
  text-decoration: underline;
`;

export default RemoveAdditionalDoseButton;
