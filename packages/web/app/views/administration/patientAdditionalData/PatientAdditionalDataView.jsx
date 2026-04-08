import React, { useMemo, useCallback } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';

import { AdminViewContainer } from '../components/AdminViewContainer';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { usePatientFieldLayoutsQuery } from './usePatientFieldLayoutsQuery';
import { useReorderPatientFieldLayoutsMutation } from './useReorderPatientFieldLayoutsMutation';
import { useToggleFieldVisibilityMutation } from './useToggleFieldVisibilityMutation';
import { groupLayoutsBySection } from './helpers';
import { SectionView } from './SectionView';
import { Container } from './styledComponents';

export const PatientAdditionalDataView = () => {
  const { data: layouts = [], isLoading } = usePatientFieldLayoutsQuery();
  const reorderMutation = useReorderPatientFieldLayoutsMutation();
  const visibilityMutation = useToggleFieldVisibilityMutation();

  const sections = useMemo(() => groupLayoutsBySection(layouts), [layouts]);

  const handleToggleVisibility = useCallback(
    (id, visibilityStatus) => {
      visibilityMutation.mutate({ id, visibilityStatus });
    },
    [visibilityMutation],
  );

  const handleDragEnd = useCallback(
    result => {
      const { source, destination } = result;
      if (!destination) return;
      if (source.droppableId === destination.droppableId && source.index === destination.index) {
        return;
      }

      // Find the section
      const section = sections.find(s => s.key === source.droppableId);
      if (!section) return;

      // Only allow reordering within the same section
      if (source.droppableId !== destination.droppableId) return;

      // Reorder the visible fields
      const reordered = [...section.visible];
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);

      // Build the update payload with new sort orders
      const layoutUpdates = reordered.map((layout, index) => ({
        id: layout.id,
        sortOrder: index,
      }));

      reorderMutation.mutate({ layouts: layoutUpdates });
    },
    [sections, reorderMutation],
  );

  if (isLoading) {
    return (
      <AdminViewContainer title="Patient additional data">
        <TranslatedText stringId="general.loading" fallback="Loading..." />
      </AdminViewContainer>
    );
  }

  return (
    <AdminViewContainer
      title={
        <TranslatedText
          stringId="admin.patientFields.title"
          fallback="Patient additional data"
        />
      }
    >
      <DragDropContext onDragEnd={handleDragEnd}>
        <Container>
          {sections.map(section => (
            <SectionView
              key={section.key}
              section={section}
              onToggleVisibility={handleToggleVisibility}
            />
          ))}
        </Container>
      </DragDropContext>
    </AdminViewContainer>
  );
};
