import React, { memo, useState, useCallback } from 'react';
import styled from 'styled-components';
import MUIAddIcon from '@material-ui/icons/Add';
import { Collapse } from '@material-ui/core';
import { connectApi } from '../api';
import { Suggester } from '../utils/suggester';

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

const FormContainer = styled.div`
  margin: 1rem 0rem;
`;

const AddEditForm = connectApi(
  (api, dispatch, { patient, endpoint, onClose, suggesterEndpoints }) => {
    const apiProps = {
      onSubmit: async data => {
        await api.post(`/patient/${patient._id}/${endpoint}`, data);
        onClose();
      },
    };
    suggesterEndpoints.forEach(e => {
      apiProps[`${e}Suggester`] = new Suggester(api, e);
    });
    return apiProps;
  },
)(
  memo(({ Form, item, onClose, ...restOfProps }) => (
    <FormContainer>
      <Form onCancel={onClose} editedObject={item} {...restOfProps} />
    </FormContainer>
  )),
);

export const InfoPaneList = memo(({ title, Form, items = [], endpoint, suggesterEndpoints }) => {
  const [addEditState, setAddEditState] = useState({ adding: false, editKey: null });
  const { adding, editKey } = addEditState;

  const handleAddButtonClick = useCallback(
    () => setAddEditState({ adding: !adding, editKey: null }),
    [adding],
  );
  const handleRowClick = useCallback(
    ({ name }) => setAddEditState({ adding: false, editKey: name }),
    [],
  );
  const handleCloseForm = useCallback(() => setAddEditState({ adding: false, editKey: null }), []);

  return (
    <React.Fragment>
      <TitleContainer>
        <TitleText>{title}</TitleText>
        <AddButton onClick={handleAddButtonClick} />
      </TitleContainer>
      <DataList>
        <Collapse in={adding}>
          <AddEditForm
            Form={Form}
            endpoint={endpoint}
            suggesterEndpoints={suggesterEndpoints}
            onClose={handleCloseForm}
          />
        </Collapse>
        {items.map(item => {
          const { name } = item;
          return (
            <React.Fragment>
              <Collapse in={editKey !== name}>
                <ListItem key={name} onClick={handleRowClick}>
                  {name}
                </ListItem>
              </Collapse>
              <Collapse in={editKey === name}>
                <AddEditForm
                  Form={Form}
                  endpoint={endpoint}
                  suggesterEndpoints={suggesterEndpoints}
                  item={item}
                  onClose={handleCloseForm}
                />
              </Collapse>
            </React.Fragment>
          );
        })}
      </DataList>
    </React.Fragment>
  );
});
