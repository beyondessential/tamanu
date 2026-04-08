import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import { Colors } from '../../../constants';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px 0;
`;

export const SectionCard = styled.div`
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  padding: 24px;

  & + & {
    margin-top: -1px;
  }
`;

export const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

export const FieldsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

export const FieldCardOuter = styled.div`
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  background: ${Colors.white};
  cursor: grab;

  &:hover {
    border-color: ${Colors.primary};
  }

  ${({ $isDragging }) =>
    $isDragging &&
    `
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: ${Colors.primary};
  `}
`;

export const FieldCardInner = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 12px;
`;

export const DragHandle = styled.div`
  display: flex;
  align-items: center;
  color: ${Colors.softText};
`;

export const FieldInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const FieldLabel = styled(Typography)`
  font-weight: 500;
  font-size: 14px;
`;

export const RequiredMark = styled.span`
  color: ${Colors.alert};
  margin-left: 2px;
`;

export const FieldType = styled.span`
  font-size: 12px;
  color: ${Colors.softText};
  background: ${Colors.background};
  padding: 2px 8px;
  border-radius: 3px;
`;

export const FieldActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const HiddenFieldsSection = styled.div`
  margin-top: 24px;
`;

export const HiddenFieldsTitle = styled(Typography)`
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 12px;
`;

export const HiddenFieldCard = styled.div`
  border: 1px solid ${Colors.outline};
  border-radius: 5px;
  background: ${Colors.background};
  opacity: 0.7;
`;

export const HiddenFieldCardInner = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  gap: 12px;
`;
