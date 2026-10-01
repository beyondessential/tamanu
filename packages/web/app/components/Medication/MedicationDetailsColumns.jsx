import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

import { Colors } from '../../constants/styles';

export const DetailsContainer = styled(Box)`
  padding: 12px 20px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background-color: ${Colors.white};
`;

const MidText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.midText};
`;

const DarkestText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  font-weight: 500;
  color: ${Colors.darkestText};
`;

const DetailsColumn = ({ details, flex, pl, borderLeft }) => (
  <Box flex={flex} pl={pl} borderLeft={borderLeft}>
    {details.map((detail, index) => (
      <Box key={index} mb={index === details.length - 1 ? 0 : 2}>
        <MidText>{detail.label}</MidText>
        <DarkestText mt={0.5}>{detail.value}</DarkestText>
      </Box>
    ))}
  </Box>
);

export const MedicationDetailsColumns = ({ leftDetails, rightDetails }) => (
  <DetailsContainer display="flex" justifyContent="space-between">
    <DetailsColumn details={leftDetails} flex={1.1} />
    <DetailsColumn details={rightDetails} flex={1} pl={2.5} borderLeft={`1px solid ${Colors.outline}`} />
  </DetailsContainer>
);
