import React from 'react';
import styled from 'styled-components';
import { Tooltip } from '@material-ui/core';

const FlexRowSpaceBetween = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
`;
const FlexRowStart = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: start;
  width: 60%;
  align-items: center;
`;
const StatusActiveDiv = styled.div`
  background-color: green;
  height: 10px;
  width: 10px;
  border-radius: 10px;
  margin: 0px 5px;
`;
const StatusRemovedDiv = styled.div`
  background-color: lightGray;
  height: 10px;
  width: 10px;
  border-radius: 10px;
  margin: 0px 5px;
`;

export const ProgramRegistryListItem = ({ item, handleRowClick, ListItem }) => {
  const { id, name, status, clinicalStatus } = item;
  return (
    <ListItem onClick={() => handleRowClick(id)}>
      <FlexRowSpaceBetween>
        <FlexRowStart>
          <Tooltip title={status} arrow placement="top-end">
            {status === 'Active' ? <StatusActiveDiv /> : <StatusRemovedDiv />}
          </Tooltip>

          <span>{name}</span>
        </FlexRowStart>
        {clinicalStatus}
      </FlexRowSpaceBetween>
    </ListItem>
  );
};
