import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import { Button, Collapse, Typography } from '@material-ui/core';
import { kebabCase } from 'lodash';
import { PATIENT_ISSUE_TYPES } from '@tamanu/constants';
import { Colors } from '../../constants';
import { FormModal } from '../FormModal';
import { PatientAlert } from '../PatientAlert';
import { InfoPaneAddEditForm } from './InfoPaneAddEditForm';
import { PANE_SECTION_IDS } from './paneSections';
import { NoteModalActionBlocker } from '../NoteModalActionBlocker';
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

export const InfoPaneList = ({
  id: paneId,
  patient,
  readonly,
  title,
  Form,
  endpoint,
  getEndpoint,
  getName = () => '???',
  behavior = 'collapse',
  itemTitle = '',
  CustomEditForm,
  getEditFormName = () => '???',
  ListItemComponent,
  overrideContentPadding,
}) => {
  const [addEditState, setAddEditState] = useState({ adding: false, editKey: null });
  const { adding, editKey } = addEditState;
  const api = useApi();
  const { data, error } = useQuery([`infoPaneListItem-${paneId}`, patient.id], () =>
    api.get(getEndpoint),
  );

  const isIssuesPane = paneId === PANE_SECTION_IDS.ISSUES;
  const { items, warnings } = getItems(isIssuesPane, data);

  const handleAddButtonClick = useCallback(
    () => setAddEditState({ adding: !adding, editKey: null }),
    [adding],
  );
  const handleRowClick = useCallback(id => setAddEditState({ adding: false, editKey: id }), []);
  const handleCloseForm = useCallback(() => setAddEditState({ adding: false, editKey: null }), []);

  const Wrapper = props =>
    behavior === 'collapse' ? (
      <Collapse in={adding} {...props} data-testid="collapse-qeou" />
    ) : (
      <FormModal
        width="md"
        title={itemTitle}
        open={adding}
        onClose={handleCloseForm}
        {...props}
        overrideContentPadding={overrideContentPadding}
        data-testid="formmodal-afjc"
      />
    );

  const addForm = (
    <Wrapper data-testid="wrapper-f4zl">
      <InfoPaneAddEditForm
        Form={Form}
        endpoint={endpoint}
        onClose={handleCloseForm}
        id={paneId}
        items={items}
        data-testid="infopaneaddeditform-2igo"
      />
    </Wrapper>
  );

  const EditForm = CustomEditForm || InfoPaneAddEditForm;
  return (
    <>
      {isIssuesPane && <PatientAlert alerts={warnings} data-testid="patientalert-hboj" />}
      <TitleContainer
        data-test-id={`info-pane-${kebabCase(title)}`}
        data-testid="titlecontainer-mr2j"
      >
        <TitleText data-testid="titletext-rvdl">{title}</TitleText>
        {!readonly && (
          <NoteModalActionBlocker>
            <AddButton
              onClick={handleAddButtonClick}
              endIcon={<AddCircleIcon data-testid="addcircleicon-m4ab" />}
              data-test-class="add-button-section"
              data-testid="addbutton-b0ln"
            >
              <TranslatedText
                stringId="general.action.add"
                fallback="Add"
                data-testid="translatedtext-add"
              />
            </AddButton>
          </NoteModalActionBlocker>
        )}
      </TitleContainer>
      <DataList data-testid="datalist-073t">
        {error && error.message}
        {!error &&
          items.map((item, index) => {
            const { id } = item;
            const name = getName(item);
            if (behavior === 'collapse') {
              return (
                <React.Fragment key={id}>
                  <Collapse in={editKey !== id} data-testid="collapse-dhai">
                    {ListItemComponent ? (
                      <ListItemComponent
                        item={item}
                        handleRowClick={handleRowClick}
                        ListItem={ListItem}
                        data-testid={`listitemcomponent-5xs4-${index}`}
                      />
                    ) : (
                      <ListItem
                        onClick={() => handleRowClick(id)}
                        data-testid={`listitem-adip-${index}`}
                      >
                        {name}
                      </ListItem>
                    )}
                  </Collapse>
                  <Collapse in={editKey === id} data-testid="collapse-0a33">
                    <EditForm
                      Form={Form}
                      endpoint={endpoint}
                      item={item}
                      onClose={handleCloseForm}
                      id={paneId}
                      items={items}
                      data-testid="editform-r0ss"
                    />
                  </Collapse>
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={id} data-testid="fragment-kg9n">
                {ListItemComponent ? (
                  <ListItemComponent
                    item={item}
                    handleRowClick={handleRowClick}
                    ListItem={ListItem}
                    data-testid={`listitemcomponent-p5xe-${index}`}
                  />
                ) : (
                  <ListItem
                    onClick={() => handleRowClick(id)}
                    data-testid={`listitem-fx30${index}`}
                  >
                    {name}
                  </ListItem>
                )}
                <FormModal
                  width="md"
                  title={getEditFormName(item)}
                  open={editKey === id}
                  onClose={handleCloseForm}
                  overrideContentPadding={overrideContentPadding}
                  data-testid="formmodal-p7ky"
                >
                  <EditForm
                    Form={Form}
                    endpoint={endpoint}
                    item={item}
                    handleRowClick={handleRowClick}
                    ListItem={ListItem}
                    data-testid="editform-b1y6"
                  />
                </FormModal>
              </React.Fragment>
            );
          })}
        {addForm}
      </DataList>
    </>
  );
};
