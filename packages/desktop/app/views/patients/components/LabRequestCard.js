import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { labsIcon } from '../../../constants/images';
import { DateDisplay } from '../../../components';
import { Colors } from '../../../constants';

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 5px;
  padding: 18px;
  margin-bottom: 15px;
`;

const LabIcon = styled.img`
  width: 24px;
  height: 24px;
  border: none;
  margin-right: 14px;
`;

const CardItem = styled.div`
  display: grid;
  grid-template-columns: max-content max-content;
  grid-column-gap: 2px;
  grid-row-gap: 2px;
  font-size: 14px;
  line-height: 18px;
  color: ${props => props.theme.palette.text.tertiary};
`;

const BorderSection = styled(CardItem)`
  margin-left: 45px;
  padding: 0 10px;
  border-left: 1px solid ${Colors.outline};
`;

const CardLabel = styled.span`
  margin-right: 5px;
`;

const CardValue = styled(CardLabel)`
  font-weight: 500;
  color: ${props => props.theme.palette.text.secondary};
`;

export const LabRequestCard = ({ labRequest, actions }) => (
  <Container>
    <Box display="flex" alignItems="center">
      <LabIcon src={labsIcon} />
      <CardItem>
        <CardLabel>Lab test ID:</CardLabel>
        <CardValue>{labRequest.displayId}</CardValue>
        <CardLabel>Request date:</CardLabel>
        <CardValue>
          <DateDisplay date={labRequest.requestedDate} />
        </CardValue>
      </CardItem>
      <BorderSection>
        <CardLabel>Requesting clinician:</CardLabel>
        <CardValue>{labRequest.requestedBy?.displayName}</CardValue>
        <CardLabel>Department:</CardLabel>
        <CardValue>{labRequest.department?.name}</CardValue>
      </BorderSection>
    </Box>
    {actions || null}
  </Container>
);
