import React, { memo } from 'react';
import styled from 'styled-components';
import MUIAddIcon from '@material-ui/icons/Add';

const TitleContainer = styled.div`
  color: #326699;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-grow: 1;
  border-bottom: 2px solid #ffcc24;
  padding-bottom: 0.5rem;
`;

const TitleText = styled.span`
  font-weight: bold;
  display: flex;
`;

const AddButtonSection = styled.span`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const AddText = styled.span`
  font-size: 13px;
  display: flex;
  margin-right: 7px;
`;

const AddIcon = styled(MUIAddIcon)`
  background: #ffcc24;
  color: #fff;
  border-radius: 100px;
  padding: 2px;
`;

const AddButton = memo(({ onClick }) => (
  <AddButtonSection onClick={onClick}>
    <AddText>Add</AddText>
    <AddIcon fontSize="small" />
  </AddButtonSection>
));

const DataList = styled.ul`
  margin: 0.5rem 0rem;
  padding: 0;
`;

const ListItem = styled.li`
  display: block;
  margin: 0.5rem 0rem;
`;

export const InfoPaneList = memo(({ title, items = [], onAdd, onEdit }) => (
  <React.Fragment>
    <TitleContainer>
      <TitleText>{title}</TitleText>
      <AddButton onClick={onAdd} />
    </TitleContainer>
    <DataList>
      {items.map(x => (
        <ListItem key={x}>{x}</ListItem>
      ))}
    </DataList>
  </React.Fragment>
));
