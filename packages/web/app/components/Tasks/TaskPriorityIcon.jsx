import styled from 'styled-components';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';

import { Colors } from '../../constants';

// Shared between TasksTable (per-encounter) and DashboardTaskTable (global dashboard): a task
// name row is a flex container with a fixed-width slot reserved for the high-priority icon, so
// the icon never overlaps the name text and the column stays aligned whether or not any given
// row is high-priority. The same container/slot wrap the "Task" column header (with an empty
// slot) so the header stays aligned with the task names below it.
export const StyledPriorityHighIcon = styled(PriorityHighIcon)`
  color: ${Colors.alert};
  font-size: 16px;
  flex-shrink: 0;
`;

export const TaskNameContainer = styled.span`
  display: inline-flex;
  align-items: center;
`;

export const PriorityIconSlot = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  flex-shrink: 0;
`;
