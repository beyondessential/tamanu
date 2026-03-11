import React, { useState } from 'react';
import styled from 'styled-components';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Button, IconButton, Tab, Tabs, Typography } from '@material-ui/core';
import {
  Add as AddIcon,
  DragIndicator as DragIndicatorIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GetApp as ImportIcon,
  Publish as ExportIcon,
  Tune as TuneIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@material-ui/icons';

import { Colors } from '../../../constants';
import { AdminViewContainer } from '../components/AdminViewContainer';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

// ---------------------------------------------------------------------------
// Field types
// ---------------------------------------------------------------------------
const FIELD_TYPES = {
  FREE_TEXT: 'free_text',
  DATE: 'date',
  RADIO: 'radio',
  DROPDOWN: 'dropdown',
};

const getFieldTypeLabel = field => {
  switch (field.type) {
    case FIELD_TYPES.FREE_TEXT:
      return 'Free text field';
    case FIELD_TYPES.DATE:
      return 'Date field';
    case FIELD_TYPES.RADIO:
      return `Radio buttons${field.optionCount ? `   ${field.optionCount} options` : ''}`;
    case FIELD_TYPES.DROPDOWN:
      return `Dropdown list${field.optionCount ? `   ${field.optionCount} options` : ''}`;
    default:
      return field.type;
  }
};

// ---------------------------------------------------------------------------
// Initial data — single flat array per section, displayed in 2-column grid.
// Reading order: left-to-right, top-to-bottom (even flat indices → left col,
// odd flat indices → right col).
// ---------------------------------------------------------------------------
const INITIAL_SECTIONS = [
  {
    id: 'contactInformation',
    title: 'Contact information',
    fields: [
      { id: 'firstName', label: 'First name', type: FIELD_TYPES.FREE_TEXT, required: true, custom: false },
      { id: 'middleName', label: 'Middle name', type: FIELD_TYPES.FREE_TEXT, required: false, custom: false },
      { id: 'lastName', label: 'Last name', type: FIELD_TYPES.FREE_TEXT, required: true, custom: false },
      { id: 'culturalName', label: 'Cultural/traditional name', type: FIELD_TYPES.FREE_TEXT, required: false, custom: false },
      { id: 'dateOfBirth', label: 'Date of birth', type: FIELD_TYPES.DATE, required: true, custom: false },
      { id: 'sex', label: 'Sex', type: FIELD_TYPES.RADIO, required: true, custom: false, optionCount: 2 },
      { id: 'additionalField1', label: 'Additional field 1', type: FIELD_TYPES.FREE_TEXT, required: false, custom: true },
      { id: 'additionalField2', label: 'Additional field 2', type: FIELD_TYPES.DROPDOWN, required: false, custom: true, optionCount: 2 },
    ],
    hiddenFields: [
      { id: 'emailAddress', label: 'Email address', type: FIELD_TYPES.FREE_TEXT, required: false, custom: false },
      { id: 'additionalField3', label: 'Additional field 3', type: FIELD_TYPES.FREE_TEXT, required: false, custom: true },
      { id: 'additionalField4', label: 'Additional field 4', type: FIELD_TYPES.FREE_TEXT, required: false, custom: true },
    ],
  },
  {
    id: 'identificationInformation',
    title: 'Identification information',
    fields: [
      { id: 'nationalHealthNumber', label: 'National Health Number', type: FIELD_TYPES.FREE_TEXT, required: false, custom: false },
      { id: 'birthCertificate', label: 'Birth certificate', type: FIELD_TYPES.FREE_TEXT, required: false, custom: false },
      { id: 'insurer', label: 'Insurer', type: FIELD_TYPES.DROPDOWN, required: false, custom: false, optionCount: 5 },
      { id: 'insurancePolicyNumber', label: 'Insurance policy number', type: FIELD_TYPES.FREE_TEXT, required: false, custom: false },
      { id: 'drivingLicense', label: 'Driving license', type: FIELD_TYPES.FREE_TEXT, required: false, custom: false },
      { id: 'passportNumber', label: 'Passport number', type: FIELD_TYPES.FREE_TEXT, required: false, custom: false },
      { id: 'additionalField5', label: 'Additional field 5', type: FIELD_TYPES.FREE_TEXT, required: false, custom: true },
    ],
    hiddenFields: [],
  },
];

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------
const StyledTabs = styled(Tabs)`
  border-bottom: 2px solid ${Colors.outline};
  padding: 0 20px;
  background: ${Colors.white};
  min-height: 44px;

  .MuiTabs-indicator {
    background-color: ${Colors.primary};
    height: 2px;
  }
`;

const StyledTab = styled(Tab)`
  text-transform: none;
  font-size: 14px;
  font-weight: 400;
  min-width: 0;
  min-height: 44px;
  padding: 0 4px;
  margin-right: 24px;
  color: ${Colors.midText};

  &.Mui-selected {
    color: ${Colors.primary};
    font-weight: 500;
  }
`;

const TabLabelBox = styled(Box)`
  display: flex;
  align-items: center;
  gap: 6px;

  svg {
    font-size: 16px;
  }
`;

const ContentWrapper = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  background: ${Colors.background};
`;

const SectionCard = styled.div`
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  margin-bottom: 20px;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
`;

const SectionTitle = styled(Typography)`
  font-size: 15px;
  font-weight: 500;
  color: ${Colors.darkestText};
`;

const AddFieldButton = styled(Button)`
  background-color: ${Colors.primary};
  color: ${Colors.white};
  text-transform: none;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 4px;

  &:hover {
    background-color: ${Colors.primaryDark};
  }

  svg {
    font-size: 16px;
    margin-right: 4px;
  }
`;

// The grid container that dnd-kit will sort within
const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 8px 12px 12px;
`;

const FieldCardInner = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px 10px 6px;
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  background: ${props => (props.$hidden ? Colors.offWhite : Colors.white)};
  min-height: 60px;
  opacity: ${props => (props.$isDragging ? 0.4 : props.$hidden ? 0.75 : 1)};
  cursor: ${props => (props.$draggable ? 'grab' : 'default')};
  user-select: none;

  &:active {
    cursor: ${props => (props.$draggable ? 'grabbing' : 'default')};
  }
`;

const DragIndicator = styled.div`
  color: ${Colors.softText};
  display: flex;
  align-items: center;
  flex-shrink: 0;
  pointer-events: none;

  svg {
    font-size: 20px;
  }
`;

const FieldInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FieldLabel = styled(Typography)`
  font-size: 13px;
  font-weight: 400;
  color: ${props => (props.$hidden ? Colors.midText : Colors.darkestText)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  ${props =>
    props.$required &&
    `
    &::after {
      content: ' *';
      color: ${Colors.alert};
    }
  `}
`;

const FieldTypeLabel = styled(Typography)`
  font-size: 11px;
  color: ${Colors.softText};
  margin-top: 2px;
`;

const FieldActions = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: auto;
`;

const StyledIconButton = styled(IconButton)`
  padding: 4px;

  svg {
    font-size: 18px;
  }

  &.visibility-btn {
    color: ${Colors.primary};
  }

  &.visibility-off-btn {
    color: ${Colors.midText};
  }

  &.edit-btn {
    color: ${Colors.primary};
  }

  &.delete-btn {
    color: ${Colors.alert};
  }
`;

const HiddenFieldsSection = styled.div`
  border-top: 1px solid ${Colors.outline};
`;

const HiddenFieldsHeader = styled.div`
  padding: 10px 16px 6px;
`;

const HiddenFieldsTitle = styled(Typography)`
  font-size: 12px;
  font-weight: 500;
  color: ${Colors.midText};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// ---------------------------------------------------------------------------
// Field card content (shared between sortable + overlay + hidden)
// ---------------------------------------------------------------------------
const FieldCardContent = ({
  field,
  isHidden,
  isDraggable,
  isDragging,
  dragListeners,
  onToggleVisibility,
  onEdit,
  onDelete,
}) => (
  <FieldCardInner $hidden={isHidden} $draggable={isDraggable} $isDragging={isDragging} {...(dragListeners ?? {})}>
    {isDraggable ? (
      <DragIndicator>
        <DragIndicatorIcon />
      </DragIndicator>
    ) : (
      <Box width={24} flexShrink={0} />
    )}
    <FieldInfo>
      <FieldLabel $required={field.required} $hidden={isHidden}>
        {field.label}
      </FieldLabel>
      <FieldTypeLabel>{getFieldTypeLabel(field)}</FieldTypeLabel>
    </FieldInfo>
    <FieldActions>
      <StyledIconButton
        className={isHidden ? 'visibility-off-btn' : 'visibility-btn'}
        size="small"
        onClick={e => { e.stopPropagation(); onToggleVisibility(field.id); }}
      >
        {isHidden ? <VisibilityOffIcon /> : <VisibilityIcon />}
      </StyledIconButton>
      <StyledIconButton
        className="edit-btn"
        size="small"
        onClick={e => { e.stopPropagation(); onEdit(field.id); }}
      >
        <EditIcon />
      </StyledIconButton>
      {field.custom && (
        <StyledIconButton
          className="delete-btn"
          size="small"
          onClick={e => { e.stopPropagation(); onDelete(field.id); }}
        >
          <DeleteIcon />
        </StyledIconButton>
      )}
    </FieldActions>
  </FieldCardInner>
);

// ---------------------------------------------------------------------------
// Sortable field card — wraps FieldCardContent with dnd-kit sortable
// ---------------------------------------------------------------------------
const SortableFieldCard = ({ field, onToggleVisibility, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <FieldCardContent
        field={field}
        isHidden={false}
        isDraggable
        isDragging={isDragging}
        dragListeners={listeners}
        onToggleVisibility={onToggleVisibility}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Section component
// ---------------------------------------------------------------------------
const Section = ({ section, activeId, onAddField, onToggleVisibility, onEdit, onDelete }) => {
  const activeField = section.fields.find(f => f.id === activeId);

  return (
    <SectionCard>
      <SectionHeader>
        <SectionTitle>{section.title}</SectionTitle>
        <AddFieldButton onClick={() => onAddField(section.id)} disableElevation>
          <AddIcon />
          <TranslatedText
            stringId="patientAdditionalData.action.addField"
            fallback="Add field"
            data-testid="translatedtext-addfield"
          />
        </AddFieldButton>
      </SectionHeader>

      <SortableContext items={section.fields.map(f => f.id)} strategy={rectSortingStrategy}>
        <FieldsGrid>
          {section.fields.map(field => (
            <SortableFieldCard
              key={field.id}
              field={field}
              onToggleVisibility={onToggleVisibility}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </FieldsGrid>
      </SortableContext>

      {activeField && (
        <DragOverlay>
          <FieldCardContent
            field={activeField}
            isHidden={false}
            isDraggable
            isDragging={false}
            onToggleVisibility={onToggleVisibility}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </DragOverlay>
      )}

      {section.hiddenFields.length > 0 && (
        <HiddenFieldsSection>
          <HiddenFieldsHeader>
            <HiddenFieldsTitle>
              <TranslatedText
                stringId="patientAdditionalData.label.hiddenFields"
                fallback="Hidden fields"
                data-testid="translatedtext-hiddenfields"
              />
            </HiddenFieldsTitle>
          </HiddenFieldsHeader>
          <FieldsGrid>
            {section.hiddenFields.map(field => (
              <FieldCardContent
                key={field.id}
                field={field}
                isHidden
                isDraggable={false}
                onToggleVisibility={onToggleVisibility}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </FieldsGrid>
        </HiddenFieldsSection>
      )}
    </SectionCard>
  );
};

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------
export const PatientAdditionalDataView = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [sections, setSections] = useState(INITIAL_SECTIONS);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // require 5px movement before drag starts so clicks still work
      },
    }),
  );

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    setSections(prev =>
      prev.map(section => {
        const oldIndex = section.fields.findIndex(f => f.id === active.id);
        if (oldIndex === -1) return section; // not in this section
        const newIndex = section.fields.findIndex(f => f.id === over.id);
        if (newIndex === -1) return section;
        return { ...section, fields: arrayMove(section.fields, oldIndex, newIndex) };
      }),
    );
  };

  const handleToggleVisibility = fieldId => {
    setSections(prev =>
      prev.map(section => {
        const visibleIdx = section.fields.findIndex(f => f.id === fieldId);
        if (visibleIdx !== -1) {
          const field = section.fields[visibleIdx];
          return {
            ...section,
            fields: section.fields.filter(f => f.id !== fieldId),
            hiddenFields: [...section.hiddenFields, field],
          };
        }
        const hiddenIdx = section.hiddenFields.findIndex(f => f.id === fieldId);
        if (hiddenIdx !== -1) {
          const field = section.hiddenFields[hiddenIdx];
          return {
            ...section,
            fields: [...section.fields, field],
            hiddenFields: section.hiddenFields.filter(f => f.id !== fieldId),
          };
        }
        return section;
      }),
    );
  };

  const handleEdit = fieldId => {
    // Placeholder — edit modal to be implemented
    // eslint-disable-next-line no-console
    console.log('Edit field:', fieldId);
  };

  const handleDelete = fieldId => {
    setSections(prev =>
      prev.map(section => ({
        ...section,
        fields: section.fields.filter(f => f.id !== fieldId),
        hiddenFields: section.hiddenFields.filter(f => f.id !== fieldId),
      })),
    );
  };

  const handleAddField = sectionId => {
    // Placeholder — add field modal to be implemented
    // eslint-disable-next-line no-console
    console.log('Add field to section:', sectionId);
  };

  return (
    <AdminViewContainer
      title={
        <TranslatedText
          stringId="patientAdditionalData.title"
          fallback="Patient additional data"
          data-testid="translatedtext-patientadditionaldatatitle"
        />
      }
    >
      <StyledTabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
        <StyledTab
          label={
            <TabLabelBox>
              <TuneIcon />
              <TranslatedText
                stringId="patientAdditionalData.tab.manage"
                fallback="Manage"
                data-testid="translatedtext-tab-manage"
              />
            </TabLabelBox>
          }
        />
        <StyledTab
          label={
            <TabLabelBox>
              <ImportIcon />
              <TranslatedText
                stringId="patientAdditionalData.tab.import"
                fallback="Import"
                data-testid="translatedtext-tab-import"
              />
            </TabLabelBox>
          }
        />
        <StyledTab
          label={
            <TabLabelBox>
              <ExportIcon />
              <TranslatedText
                stringId="patientAdditionalData.tab.export"
                fallback="Export"
                data-testid="translatedtext-tab-export"
              />
            </TabLabelBox>
          }
        />
      </StyledTabs>

      {activeTab === 0 && (
        <ContentWrapper>
          {sections.map(section => (
            <DndContext
              key={section.id}
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <Section
                section={section}
                activeId={activeId}
                onAddField={handleAddField}
                onToggleVisibility={handleToggleVisibility}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </DndContext>
          ))}
        </ContentWrapper>
      )}

      {activeTab === 1 && (
        <ContentWrapper>
          <Typography color="textSecondary">Import functionality coming soon.</Typography>
        </ContentWrapper>
      )}

      {activeTab === 2 && (
        <ContentWrapper>
          <Typography color="textSecondary">Export functionality coming soon.</Typography>
        </ContentWrapper>
      )}
    </AdminViewContainer>
  );
};
