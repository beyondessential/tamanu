import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Typography } from '@material-ui/core';

import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { FieldCard } from './FieldCard';
import { HiddenField } from './HiddenField';
import {
  SectionCard,
  SectionHeader,
  FieldsGrid,
  HiddenFieldsSection,
  HiddenFieldsTitle,
} from './styledComponents';

export const SectionView = ({ section, onToggleVisibility }) => (
  <SectionCard>
    <SectionHeader>
      <Typography variant="h6">{section.label}</Typography>
    </SectionHeader>
    <Droppable droppableId={section.key} direction="horizontal">
      {provided => (
        <FieldsGrid ref={provided.innerRef} {...provided.droppableProps}>
          {section.visible.map((layout, index) => (
            <FieldCard
              key={layout.id}
              layout={layout}
              index={index}
              onToggleVisibility={onToggleVisibility}
            />
          ))}
          {provided.placeholder}
        </FieldsGrid>
      )}
    </Droppable>
    {section.hidden.length > 0 && (
      <HiddenFieldsSection>
        <HiddenFieldsTitle>
          <TranslatedText
            stringId="admin.patientFields.hiddenFields"
            fallback="Hidden fields"
          />
        </HiddenFieldsTitle>
        <FieldsGrid>
          {section.hidden.map(layout => (
            <HiddenField
              key={layout.id}
              layout={layout}
              onToggleVisibility={onToggleVisibility}
            />
          ))}
        </FieldsGrid>
      </HiddenFieldsSection>
    )}
  </SectionCard>
);
