import styled from 'styled-components';

import { Colors } from '../constants/styles';

/**
 * Sets a form apart from the modal it is embedded in, the same way as a form embedded in the
 * procedure modal.
 */
export const EmbeddedSurveyBox = styled.div`
  background: ${Colors.white};
  padding: 20px;
  border-radius: 3px;
  border: 1px solid ${Colors.outline};
`;
