import React, { memo, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import { Collapse, Button, Typography } from '@material-ui/core';
import { kebabCase } from 'lodash';
import { PATIENT_ISSUE_TYPES } from '@tamanu/constants';
import { Colors } from '../../constants';
import { Modal } from '../Modal';
import { PatientAlert } from '../PatientAlert';
import { InfoPaneAddEditForm } from './InfoPaneAddEditForm';
import { PANE_SECTION_IDS, PANE_SECTION_TITLES } from './paneSections';
import { useApi } from '../../api';
import { TranslatedText } from '../Translation/TranslatedText';

const TitleContainer = styled.div`
  color: ${Colors.primary};
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
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

const shouldShowIssueInWarningModal = ({ type }) => type === PATIENT_ISSUE_TYPES.WARNING;

const getItems = (isIssuesPane, response) => {
  const items = response?.data || [];
  if (isIssuesPane === false) {
    return { items, warnings: null };
  }

  const warnings = items.filter(shouldShowIssueInWarningModal);
  const sortedIssues = [
    ...warnings,
    ...items.filter(issue => !shouldShowIssueInWarningModal(issue)),
  ];

  return { items: sortedIssues, warnings };
};

export const InfoPaneList = memo(
  ({
    patient,
    readonly,
    id,
    Form,
    endpoint,
    getEndpoint,
    getName = () => '???',
    behavior = 'collapse',
    itemTitle = '',
    CustomEditForm,
    getEditFormName = () => '???',
  }) => {
    const [addEditState, setAddEditState] = useState({ adding: false, editKey: null });
    const { adding, editKey } = addEditState;
    const api = useApi();
    const { data, error } = useQuery([`infoPaneListItem-${id}`, patient.id], () =>
      api.get(getEndpoint),
    );
    const isIssuesPane = id === PANE_SECTION_IDS.ISSUES;
    const { items, warnings } = getItems(isIssuesPane, data);
    const title = PANE_SECTION_TITLES[id];

    const handleAddButtonClick = useCallback(
      () => setAddEditState({ adding: !adding, editKey: null }),
      [adding],
    );
    const handleRowClick = useCallback(
      rowId => setAddEditState({ adding: false, editKey: rowId }),
      [],
    );
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
        <InfoPaneAddEditForm
          patient={patient}
          Form={Form}
          endpoint={endpoint}
          onClose={handleCloseForm}
          id={id}
          items={items}
        />
      </Wrapper>
    );

    const EditForm = CustomEditForm || InfoPaneAddEditForm;
    return (
      <>
        {isIssuesPane && <PatientAlert alerts={warnings} />}
        <TitleContainer data-test-id={`info-pane-${kebabCase(id)}`}>
          <TitleText>{title}</TitleText>
          {!readonly && (
            <AddButton
              onClick={handleAddButtonClick}
              endIcon={<AddCircleIcon />}
              data-test-class="add-button-section"
            >
              <TranslatedText stringId="general.actions.add" fallback="Add" />
            </AddButton>
          )}
        </TitleContainer>
        <DataList>
          {error && error.message}
          {!error &&
            items.map(item => {
              const name = getName(item);
              if (behavior === 'collapse') {
                return (
                  <React.Fragment key={item.id}>
                    <Collapse in={editKey !== item.id}>
                      <ListItem onClick={() => handleRowClick(item.id)}>{name}</ListItem>
                    </Collapse>
                    <Collapse in={editKey === item.id}>
                      <EditForm
                        patient={patient}
                        Form={Form}
                        endpoint={endpoint}
                        item={item}
                        onClose={handleCloseForm}
                        title={title}
                        items={items}
                      />
                    </Collapse>
                  </React.Fragment>
                );
              }

              return (
                <React.Fragment key={item.id}>
                  <ListItem onClick={() => handleRowClick(item.id)}>{name}</ListItem>
                  <Modal
                    width="md"
                    title={getEditFormName(item)}
                    open={editKey === item.id}
                    onClose={handleCloseForm}
                  >
                    <EditForm
                      patient={patient}
                      Form={Form}
                      endpoint={endpoint}
                      item={item}
                      onClose={handleCloseForm}
                      title={title}
                      items={items}
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
