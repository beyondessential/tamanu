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
  max-width: 100%;
  // Without this, the browser's default vertical-align: baseline leaves this inline-flex
  // span sitting slightly above the table cell's vertical centre.
  vertical-align: middle;
`;

export const PriorityIconSlot = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  flex-shrink: 0;
`;

// Truncates just the name text with an ellipsis once it hits its max-width, rather than the
// whole icon+name row being hard-clipped with no "…" (an ancestor's overflow:hidden doesn't
// produce an ellipsis for nested flex content, only for its own direct text).
export const TaskNameText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;
