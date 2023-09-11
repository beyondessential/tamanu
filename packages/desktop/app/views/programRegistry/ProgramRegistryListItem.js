import React from 'react';
import styled from 'styled-components';
import { Tooltip } from '@material-ui/core';

const Spacer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
`;
const RowContents = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: start;
  width: 60%;
  align-items: center;
`;
const StatusActiveDot = styled.div`
  background-color: green;
  height: 10px;
  width: 10px;
  border-radius: 10px;
  margin: 0px 5px;
`;
const StatusInactiveDot = styled.div`
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
      <Spacer>
        <RowContents>
          <Tooltip title={status} arrow placement="top-end">
            {status === 'Active' ? <StatusActiveDot /> : <StatusInactiveDot />}
          </Tooltip>

          <span>{name}</span>
        </RowContents>
        {clinicalStatus}
      </Spacer>
    </ListItem>
  );
};
