import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { Collapse } from '@material-ui/core';
import { kebabCase } from 'es-toolkit/compat';
import { PATIENT_ISSUE_TYPES } from '@tamanu/constants';
import { UnstyledHtmlButton } from '@tamanu/ui-components';
import { Colors } from '../../constants';
import { FormModal } from '../FormModal';
import { PatientAlert } from '../PatientAlert';
import { InfoPaneAddEditForm } from './InfoPaneAddEditForm';
import {
  InfoPaneFormContainer,
  InfoPaneListItem,
  InfoPaneRow,
  InfoPaneRowName,
} from './InfoPaneListItem';
import { PANE_SECTION_IDS } from './paneSections';
import { NoteModalActionBlocker } from '../NoteModalActionBlocker';
import { useApi } from '../../api';
import { TranslatedText } from '../Translation/TranslatedText';
import { PlusIcon } from '../../assets/icons/PlusIcon';

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid ${Colors.outline};
`;

const TitleText = styled.h3`
  margin: 0;
  color: ${Colors.primary};
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
`;

const AddButton = styled(UnstyledHtmlButton)`
  display: flex;
  align-items: center;
  gap: 4px;
  color: ${Colors.primary};
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
  cursor: pointer;
`;

const DataList = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const FormBox = styled(InfoPaneFormContainer)`
  box-sizing: border-box;
  padding: 8px;
  border: 1px solid ${Colors.outline};
  background: ${Colors.background2};
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
  getTag = () => null,
  ItemDetails,
  behavior = 'collapse',
  itemTitle = '',
  CustomEditForm,
  getEditFormName = () => '???',
  ListItemComponent,
  overrideContentPadding,
}) => {
  const [paneState, setPaneState] = useState({
    adding: false,
    editKey: null,
    expandedKey: null,
    resolvingKey: null,
  });
  const { adding, editKey, expandedKey, resolvingKey } = paneState;
  const api = useApi();
  const { data, error } = useQuery(
    [`infoPaneListItem-${paneId}`, patient.id],
    () => api.get(getEndpoint),
    // getEndpoint interpolates patient.id, which is null until the patient is loaded into the store
    { enabled: Boolean(patient.id) },
  );

  const isIssuesPane = paneId === PANE_SECTION_IDS.ISSUES;
  const { items, warnings } = getItems(isIssuesPane, data);

  const handleAddButtonClick = useCallback(
    () => setPaneState(state => ({ ...state, adding: !state.adding, editKey: null })),
    [],
  );
  const handleEdit = useCallback(
    id => setPaneState(state => ({ ...state, adding: false, editKey: id })),
    [],
  );
  const handleToggleExpanded = useCallback(
    id =>
      setPaneState(state => ({
        ...state,
        expandedKey: state.expandedKey === id ? null : id,
      })),
    [],
  );
  const handleCloseForm = useCallback(
    () => setPaneState(state => ({ ...state, adding: false, editKey: null })),
    [],
  );
  const handleResolve = useCallback(
    id => setPaneState(state => ({ ...state, resolvingKey: id })),
    [],
  );
  const handleCloseResolve = useCallback(
    () => setPaneState(state => ({ ...state, resolvingKey: null })),
    [],
  );

  const EditForm = CustomEditForm || InfoPaneAddEditForm;

  const renderCollapseItems = () => (
    <>
      <li>
        <Collapse in={adding} unmountOnExit data-testid="collapse-qeou">
          <FormBox>
            <InfoPaneAddEditForm
              Form={Form}
              endpoint={endpoint}
              onClose={handleCloseForm}
              id={paneId}
              items={items}
              data-testid="infopaneaddeditform-2igo"
            />
          </FormBox>
        </Collapse>
      </li>
      {items.map((item, index) => {
        const { id } = item;
        return (
          <li key={id}>
            <Collapse in={editKey !== id} data-testid="collapse-dhai">
              <InfoPaneListItem
                name={getName(item)}
                tag={getTag(item)}
                expanded={expandedKey === id || resolvingKey === id}
                onToggle={() => handleToggleExpanded(id)}
                data-testid={`listitem-adip-${index}`}
              >
                <ItemDetails
                  item={item}
                  readonly={readonly}
                  onEdit={readonly ? null : () => handleEdit(id)}
                  isResolving={resolvingKey === id}
                  onResolve={() => handleResolve(id)}
                  onCloseResolve={handleCloseResolve}
                />
              </InfoPaneListItem>
            </Collapse>
            <Collapse in={editKey === id} unmountOnExit data-testid="collapse-0a33">
              <FormBox>
                <EditForm
                  Form={Form}
                  endpoint={endpoint}
                  item={item}
                  onClose={handleCloseForm}
                  id={paneId}
                  items={items}
                  data-testid="editform-r0ss"
                />
              </FormBox>
            </Collapse>
          </li>
        );
      })}
    </>
  );

  const renderModalItems = () => (
    <>
      {items.map((item, index) => (
        <li key={item.id}>
          {ListItemComponent ? (
            <ListItemComponent item={item} data-testid={`listitemcomponent-p5xe-${index}`} />
          ) : (
            <InfoPaneRow
              type="button"
              onClick={() => handleEdit(item.id)}
              data-testid={`listitem-fx30${index}`}
            >
              <InfoPaneRowName>{getName(item)}</InfoPaneRowName>
            </InfoPaneRow>
          )}
          <FormModal
            width="md"
            title={getEditFormName(item)}
            open={editKey === item.id}
            onClose={handleCloseForm}
            overrideContentPadding={overrideContentPadding}
            data-testid="formmodal-p7ky"
          >
            <EditForm Form={Form} endpoint={endpoint} item={item} data-testid="editform-b1y6" />
          </FormModal>
        </li>
      ))}
      <FormModal
        width="md"
        title={itemTitle}
        open={adding}
        onClose={handleCloseForm}
        overrideContentPadding={overrideContentPadding}
        data-testid="formmodal-afjc"
      >
        <InfoPaneAddEditForm
          Form={Form}
          endpoint={endpoint}
          onClose={handleCloseForm}
          id={paneId}
          items={items}
          data-testid="infopaneaddeditform-2igo"
        />
      </FormModal>
    </>
  );

  return (
    <Section data-testid={`infopanelist-${paneId}`}>
      {isIssuesPane && <PatientAlert alerts={warnings} data-testid="patientalert-hboj" />}
      <TitleContainer
        data-test-id={`info-pane-${kebabCase(title)}`}
        data-testid="titlecontainer-mr2j"
      >
        <TitleText data-testid="titletext-rvdl">{title}</TitleText>
        {!readonly && (
          <NoteModalActionBlocker>
            <AddButton
              type="button"
              onClick={handleAddButtonClick}
              data-test-class="add-button-section"
              data-testid="addbutton-b0ln"
            >
              <PlusIcon width={12} height={12} data-testid="addcircleicon-m4ab" />
              <TranslatedText
                stringId="general.action.add"
                fallback="Add"
                data-testid="translatedtext-add"
              />
            </AddButton>
          </NoteModalActionBlocker>
        )}
      </TitleContainer>
      {error && error.message}
      {!error && (items.length > 0 || adding) && (
        <DataList data-testid="datalist-073t">
          {behavior === 'collapse' ? renderCollapseItems() : renderModalItems()}
        </DataList>
      )}
    </Section>
  );
};
