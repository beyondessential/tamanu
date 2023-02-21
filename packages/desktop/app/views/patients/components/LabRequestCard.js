import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { labsIcon } from '../../../constants/images';
import { CardItem, DateDisplay } from '../../../components';
import { Colors } from '../../../constants';

const LabIcon = styled.img`
  width: 22px;
  height: 22px;
  border: none;
`;

const CardContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 5px;
  padding: 18px;
  margin-bottom: 15px;
`;

const BorderSection = styled.div`
  padding: 0 10px;
  border-left: 1px solid ${Colors.outline};
`;

export const LabRequestCard = ({ labRequest, Actions }) => (
  <CardContainer>
    <LabIcon src={labsIcon} />
    <Box pr={3} pl={3}>
      <CardItem label="Lab test ID" value={labRequest.displayId} />
      <CardItem label="Request date" value={<DateDisplay date={labRequest.requestedDate} />} />
    </Box>
    <BorderSection>
      <CardItem label="Requesting clinician" value="Jane Smith" />
      <CardItem label="Department" value="Cardiology" />
    </BorderSection>
    {Actions || null}
  </CardContainer>
);
