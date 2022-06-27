import React, { memo, useState, useCallback } from 'react';
import styled from 'styled-components';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import { Collapse, Button, Typography } from '@material-ui/core';
import { kebabCase } from 'lodash';
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
  border-bottom: 1px solid #ebebeb;
  padding-bottom: 0.5rem;
`;

const TitleText = styled(Typography)`
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
`;

const AddButton = styled(Button)`
  text-transform: none;

  .MuiButton-label {
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    letter-spacing: 0;
    color: ${Colors.primary};
  }

  .MuiSvgIcon-root {
    color: ${Colors.secondary};
  }
`;

const DataList = styled.ul`
  margin: 0.5rem 0;
  padding: 0;
`;

const ListItem = styled.li`
  display: block;
  margin: 6px 0;
  cursor: pointer;
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
`;

const FormContainer = styled.div`
  margin: 1rem 0;
`;

const AddEditForm = connectApi(
  (api, dispatch, { patient, endpoint, onClose, suggesters = [] }) => ({
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
    ...Object.fromEntries(
      Object.entries(suggesters).map(([key, options = {}]) => [
        `${key}Suggester`,
        new Suggester(api, key, options),
      ]),
    ),
  }),
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
    suggesters,
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

    const Wrapper = props =>
      behavior === 'collapse' ? (
        <Collapse in={adding} {...props} />
      ) : (
        <Modal width="md" title={itemTitle} open={adding} onClose={handleCloseForm} {...props} />
      );

    const addForm = (
      <Wrapper>
        <AddEditForm
          patient={patient}
          Form={Form}
          endpoint={endpoint}
          suggesters={suggesters}
          onClose={handleCloseForm}
        />
      </Wrapper>
    );

    const EditForm = CustomEditForm || AddEditForm;
    return (
      <>
        <TitleContainer data-test-id={`info-pane-${kebabCase(title)}`}>
          <TitleText>{title}</TitleText>
          {!readonly && (
            <AddButton
              onClick={handleAddButtonClick}
              endIcon={<AddCircleIcon />}
              data-test-class="add-button-section"
            >
              Add
            </AddButton>
          )}
        </TitleContainer>
        <DataList>
          {items.map(item => {
            const { id } = item;
            const name = getName(item);
            if (behavior === 'collapse') {
              return (
                <React.Fragment key={id}>
                  <Collapse in={editKey !== id}>
                    <ListItem onClick={() => handleRowClick(id)}>{name}</ListItem>
                  </Collapse>
                  <Collapse in={editKey === id}>
                    <EditForm
                      patient={patient}
                      Form={Form}
                      endpoint={endpoint}
                      suggesters={suggesters}
                      item={item}
                      onClose={handleCloseForm}
                    />
                  </Collapse>
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={id}>
                <ListItem onClick={() => handleRowClick(id)}>{name}</ListItem>
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
                    suggesters={suggesters}
                    item={item}
                    onClose={handleCloseForm}
                  />
                </Modal>
              </React.Fragment>
            );
          })}
          {addForm}
        </DataList>
      </>
    );
  },
);
