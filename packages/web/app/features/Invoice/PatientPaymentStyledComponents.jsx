import styled from 'styled-components';

import { TAMANU_COLORS } from '@tamanu/ui-components';

import { Modal } from '../../components/Modal';

export const StyledModal = styled(Modal)`
  .MuiPaper-root {
    max-width: 680px;
  }
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  margin-bottom: 16px;
  gap: 20px;
`;

export const Text = styled.div`
  color: ${props => props.theme.palette.text.primary};
  font-size: 14px;
  font-weight: 400;
`;

export const LabelRow = styled.div`
  border-bottom: 1px solid ${TAMANU_COLORS.outline};
  padding: 0 10px;
  margin: 0 -10px 10px;
`;

export const Label = styled.div`
  padding-bottom: 8px;
  font-weight: 400;
  color: ${props => props.theme.palette.text.tertiary};
  font-size: 14px;
`;

export const Value = styled.div`
  padding-bottom: 8px;
  font-weight: 400;
  color: ${props => props.theme.palette.text.primary};
  font-size: 14px;
`;

const BaseFormCard = styled.div`
  margin-bottom: 36px;
  background-color: ${TAMANU_COLORS.white};
  border: 1px solid ${TAMANU_COLORS.outline};
  border-radius: 5px;
  padding: 16px 20px;
`;

export const PaymentFormCard = styled(BaseFormCard)`
  > div {
    display: grid;
    align-items: start;
    grid-template-columns: ${props =>
      props.$isEditMode ? '150px 1fr 150px' : '140px 1fr 120px 80px'};
    gap: 20px;
  }
`;

export const RefundFormCard = styled(BaseFormCard)`
  padding-bottom: 10px;
  > ${LabelRow} {
    display: grid;
    align-items: start;
    grid-template-columns: 140px 1fr 120px 80px;
    gap: 20px;
  }
`;
