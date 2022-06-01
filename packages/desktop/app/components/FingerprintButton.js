import React, { memo } from 'react';
import styled from 'styled-components';
import FingerprintIcon from '@material-ui/icons/Fingerprint';
import { Colors } from '../constants';

const RightSection = styled.div`
  padding: 24px;
  border-left: 1px solid ${Colors.outline};
`;

const ScanFingerprintIcon = styled(FingerprintIcon)`
  color: ${Colors.secondary};
`;

const ScanFingerprintButtonContainer = styled.div`
  text-align: center;
  margin: auto;

  svg {
    font-size: 46px;
  }
`;

const ScanFingerprintLabel = styled.div`
  font-size: 12px;
  text-align: center;
  color: ${Colors.primary};
`;
export const FingerprintButton = memo(() => (
  <RightSection>
    <ScanFingerprintButtonContainer>
      <ScanFingerprintIcon fontSize="large" />
    </ScanFingerprintButtonContainer>
    <ScanFingerprintLabel>Scan fingerprint</ScanFingerprintLabel>
  </RightSection>
));
