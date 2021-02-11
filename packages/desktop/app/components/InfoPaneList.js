import React, { memo, useState, useCallback } from 'react';
import styled from 'styled-components';
import MUIAddIcon from '@material-ui/icons/Add';
import { Collapse } from '@material-ui/core';
import { connectApi } from '../api';
import { Suggester } from '../utils/suggester';
import { reloadPatient } from '../store/patient';
import { Colors } from '../constants';
import { Modal } from './Modal';

const TitleContainer = styled.div`
  color: ${Colors.primary};
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-grow: 1;
  border-bottom: 1px solid ${Colors.outline};
  padding-bottom: 0.5rem;
`;

const TitleText = styled.span`
  font-weight: 500;
  display: flex;
`;

const AddButtonSection = styled.span`
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
`;

const AddText = styled.span`
  font-size: 13px;
  display: flex;
  margin-right: 7px;
`;

const AddIcon = styled(MUIAddIcon)`
  background: ${Colors.secondary};
  color: ${Colors.white};
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
  (api, dispatch, { patient, endpoint, onClose, suggesterEndpoints = [] }) => {
    const apiProps = {
      onSubmit: async data => {
        if (data.id) {
          // don't need to include patientId as the existing record will already have it
          await api.put(`${endpoint}/${data.id}`, data);
        } else {
          await api.post(endpoint, { ...data, patientId: patient.id });
        }
        dispatch(reloadPatient(patient.id));
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

export const InfoPaneList = memo(
  ({
    patient,
    readonly,
    title,
    Form,
    items = [],
    endpoint,
    suggesterEndpoints,
    getName = () => '???',
    behavior = 'collapse',
    itemTitle = '',
    CustomEditForm,
    getEditFormName = () => '???',
  }) => {
    const [addEditState, setAddEditState] = useState({ adding: false, editKey: null });
    const { adding, editKey } = addEditState;

    const handleAddButtonClick = useCallback(
      () => setAddEditState({ adding: !adding, editKey: null }),
      [adding],
    );
    const handleRowClick = useCallback(id => setAddEditState({ adding: false, editKey: id }), []);
    const handleCloseForm = useCallback(
      () => setAddEditState({ adding: false, editKey: null }),
      [],
    );

    let addForm;
    if (behavior === 'collapse') {
      addForm = (
        <Collapse in={adding}>
          <AddEditForm
            patient={patient}
            Form={Form}
            endpoint={endpoint}
            suggesterEndpoints={suggesterEndpoints}
            onClose={handleCloseForm}
          />
        </Collapse>
      );
    }

    if (behavior === 'modal') {
      addForm = (
        <Modal width="md" title={`Add ${itemTitle}`} open={adding} onClose={handleCloseForm}>
          <AddEditForm
            patient={patient}
            Form={Form}
            endpoint={endpoint}
            suggesterEndpoints={suggesterEndpoints}
            onClose={handleCloseForm}
          />
        </Modal>
      );
    }

    const EditForm = CustomEditForm || AddEditForm;
    return (
      <React.Fragment>
        <TitleContainer>
          <TitleText>{title}</TitleText>
          {readonly ? null : <AddButton onClick={handleAddButtonClick} />}
        </TitleContainer>
        <DataList>
          {addForm}
          {items.map(item => {
            const id = item.id;
            const name = getName(item);
            let listItem, editForm;
            if (behavior === 'collapse') {
              listItem = (
                <Collapse in={editKey !== id}>
                  <ListItem onClick={() => handleRowClick(id)}>{name}</ListItem>
                </Collapse>
              );
              editForm = (
                <Collapse in={editKey === id}>
                  <EditForm
                    patient={patient}
                    Form={Form}
                    endpoint={endpoint}
                    suggesterEndpoints={suggesterEndpoints}
                    item={item}
                    onClose={handleCloseForm}
                  />
                </Collapse>
              );
            }

            if (behavior === 'modal') {
              listItem = <ListItem onClick={() => handleRowClick(id)}>{name}</ListItem>;
              editForm = (
                <Modal
                  width="md"
                  title={getEditFormName(item)}
                  open={editKey === id}
                  onClose={handleCloseForm}
                >
                  <EditForm
                    patient={patient}
                    Form={Form}
                    endpoint={endpoint}
                    suggesterEndpoints={suggesterEndpoints}
                    item={item}
                    onClose={handleCloseForm}
                  />
                </Modal>
              );
            }
            return (
              <React.Fragment key={id}>
                {listItem}
                {editForm}
              </React.Fragment>
            );
          })}
        </DataList>
      </React.Fragment>
    );
  },
);
