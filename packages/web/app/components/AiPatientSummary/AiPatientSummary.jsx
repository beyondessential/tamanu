import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Collapse } from '@material-ui/core';

import { Colors } from '../../constants';
import { useAiPatientSummaryQuery } from '../../api/queries/useAiPatientSummaryQuery';
import {
  useGenerateAiPatientSummary,
  useSaveAiPatientSummary,
  useDiscardAiPatientSummary,
} from '../../api/mutations/useAiPatientSummaryMutation';
import { AiPatientSummaryContent } from './AiPatientSummaryContent';
import { AiPatientSummaryHeader } from './AiPatientSummaryHeader';
import { DiscardAiSummaryConfirmModal } from '../DiscardAiSummaryConfirmModal';
import { TranslatedText } from '../Translation/TranslatedText';

const Container = styled.div`
  background: ${Colors.white};
  border-bottom: 1px solid ${Colors.outline};
`;

export const AiPatientSummary = ({ patient }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const attemptedRegenerationDocumentId = useRef(null);

  const {
    data: existingData,
    isLoading: isLoadingExisting,
    isFetched: hasCheckedForExisting,
  } = useAiPatientSummaryQuery(patient.id);

  const {
    mutate: generateSummary,
    isLoading: isGenerating,
    error,
  } = useGenerateAiPatientSummary(patient.id);

  const { mutate: saveSummary, isLoading: isSaving } = useSaveAiPatientSummary(patient.id);

  const { mutate: discardSummary, isLoading: isDiscarding } = useDiscardAiPatientSummary(
    patient.id,
  );

  // Auto-generate only after confirming the server has no summary, or that it is stale.
  // Mutations write their result back into the GET cache, so existingData is always the
  // source of truth for the current document.
  useEffect(() => {
    if (!hasCheckedForExisting || isGenerating || error) {
      return;
    }

    if (!existingData?.aiDocument) {
      generateSummary();
      return;
    }

    if (
      existingData.requiresRegeneration &&
      attemptedRegenerationDocumentId.current !== existingData.aiDocument.id
    ) {
      attemptedRegenerationDocumentId.current = existingData.aiDocument.id;
      generateSummary();
    }
  }, [
    error,
    generateSummary,
    hasCheckedForExisting,
    existingData?.aiDocument,
    existingData?.requiresRegeneration,
    isGenerating,
  ]);

  const aiDocument = existingData?.aiDocument;
  const isDiscarded = aiDocument?.status === 'discarded';
  const noExistingSummary = hasCheckedForExisting && !aiDocument;
  const pendingGeneration = noExistingSummary && !error;
  const isLoading = isLoadingExisting || isGenerating || pendingGeneration;
  const documentId = aiDocument?.id;
  const summary = !isDiscarded ? aiDocument?.content : null;
  const isHumanEdited = aiDocument?.source === 'human' && aiDocument?.status === 'edited';

  const handleEdit = () => {
    setEditContent(summary);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    if (documentId) {
      saveSummary(
        { id: documentId, content: editContent },
        { onSuccess: () => setIsEditing(false) },
      );
    }
  };

  const handleDiscard = () => {
    setIsDiscardConfirmOpen(true);
  };

  const handleCancelDiscard = () => {
    setIsDiscardConfirmOpen(false);
  };

  const handleConfirmDiscard = () => {
    if (documentId) {
      discardSummary(documentId, {
        onSuccess: () => {
          setIsDiscardConfirmOpen(false);
          setIsEditing(false);
        },
      });
    }
  };

  const handleRegenerate = () => {
    generateSummary();
  };

  const isBusy = isSaving || isDiscarding;

  // Don't render anything until we have content or are actively loading or discarded
  if (!isLoading && !summary && !error && !isDiscarded) return null;

  return (
    <>
      <Container data-testid="ai-patient-summary">
        <AiPatientSummaryHeader isOpen={isOpen} onToggle={() => setIsOpen(prev => !prev)} />
        <Collapse in={isOpen}>
          <AiPatientSummaryContent
            editContent={editContent}
            error={error}
            isBusy={isBusy}
            isDiscarded={isDiscarded}
            isEditing={isEditing}
            isHumanEdited={isHumanEdited}
            isLoading={isLoading}
            onCancel={handleCancel}
            onDiscard={handleDiscard}
            onEdit={handleEdit}
            onRegenerate={handleRegenerate}
            onSave={handleSave}
            setEditContent={setEditContent}
            summary={summary}
          />
        </Collapse>
      </Container>
      <DiscardAiSummaryConfirmModal
        title={<TranslatedText stringId="ai.patientSummary.discardModal.title" fallback="Discard AI patient summary" />}
        subText={<TranslatedText stringId="ai.patientSummary.discardModal.text" fallback="Are you sure you would like to discard the AI patient summary? You can regenerate a new AI summary at any time." />}
        open={isDiscardConfirmOpen}
        onCancel={handleCancelDiscard}
        onConfirm={handleConfirmDiscard}
        isDiscarding={isDiscarding}
      />
    </>
  );
};
