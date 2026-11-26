import React from 'react';
import styled from 'styled-components';
import { useFormikContext } from 'formik';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { FormSubmitButton, TranslatedText, UnstyledHtmlButton } from '@tamanu/ui-components';
import { Colors } from '../../constants';

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
`;

const RightGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
`;

const LinkButton = styled(UnstyledHtmlButton)`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  line-height: 18px;
  cursor: pointer;

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

const DeleteLink = styled(LinkButton)`
  color: ${Colors.darkestText};
  text-decoration: underline;

  .MuiSvgIcon-root {
    font-size: 12px;
  }
`;

const CancelLink = styled(LinkButton)`
  color: ${Colors.primary};
  font-weight: 500;
`;

const SaveButton = styled(FormSubmitButton)`
  height: 36px;
  min-width: 0;
  padding: 8px 16px;
  border-radius: 3px;
  font-size: 14px;
  line-height: 18px;
`;

export const InfoPaneFormActions = ({ onCancel, onSubmit, onDelete, 'data-testid': testId }) => {
  const { isSubmitting } = useFormikContext();
  return (
    <Row data-testid={testId}>
      {onDelete && (
        <DeleteLink
          type="button"
          onClick={onDelete}
          disabled={isSubmitting}
          data-testid={`${testId}-deleteButton`}
        >
          <DeleteOutlineIcon />
          <TranslatedText stringId="general.action.delete" fallback="Delete" />
        </DeleteLink>
      )}
      <RightGroup>
        <CancelLink
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          data-testid={`${testId}-cancelButton`}
        >
          <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
        </CancelLink>
        <SaveButton onSubmit={onSubmit} data-testid={`${testId}-confirmButton`}>
          <TranslatedText stringId="general.action.save" fallback="Save" />
        </SaveButton>
      </RightGroup>
    </Row>
  );
};
