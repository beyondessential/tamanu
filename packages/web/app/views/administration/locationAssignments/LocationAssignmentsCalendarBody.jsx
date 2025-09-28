import { formatISO, isEqual, format } from 'date-fns';
import React from 'react';
import styled from 'styled-components';
import { toDateString } from '@tamanu/utils/dateTime';

import { useLocationAssignmentsContext } from '../../../contexts/LocationAssignments';
import { CarouselComponents as CarouselGrid } from '../../scheduling/locationBookings/CarouselComponents';
import { SkeletonRows } from '../../scheduling/locationBookings/Skeletons';
import { generateIdFromCell } from './utils';
import { TranslatedReferenceData } from '../../../components';
import { Colors } from '../../../constants';
import { useAuth } from '../../../contexts/Auth';

const AssignmentTile = styled.div`
  background: ${Colors.white};
  color: ${Colors.darkestText};
  padding: 0.25rem;
  margin: 0.125rem;
  border-radius: 5px;
  font-size: 11px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid ${Colors.primary};

  &:hover {
    background: ${Colors.veryLightBlue};
  }
`;

const AssignmentTimeRange = styled.div`
  margin-bottom: 0.125rem;
`;

const AssignmentUser = styled.div`
  opacity: 0.9;
`;

const formatTime = (time) => {
  return format(new Date(time), 'h:mma').toLowerCase();
};

export const LocationAssignmentTile = ({ assignment, onClick }) => {
  const { user, startTime, endTime } = assignment;
  const { ability } = useAuth();
  const hasReadPermission = ability?.can?.('read', 'LocationSchedule');
  
  return (
    <AssignmentTile
      className="assignment-tile"
      onClick={(e) => {
        e.stopPropagation();
        if (hasReadPermission) {
          onClick?.(assignment);
        }
      }}
      style={{
        cursor: hasReadPermission ? 'pointer' : 'default',
      }}
      data-testid="assignment-tile"
    >
      <AssignmentTimeRange data-testid="assignment-time">
        {formatTime(startTime)} - {formatTime(endTime)}
      </AssignmentTimeRange>
      <AssignmentUser data-testid="assignment-user">
        {user?.displayName || 'Unknown User'}
      </AssignmentUser>
    </AssignmentTile>
  );
};
const LocationHeader = styled.div`
  font-size: 11px;
`;

const LocationGroupName = styled.span`

  color: ${Colors.darkestText};
`;

const LocationName = styled.span`
  color: ${Colors.midText};
`;

export const AssignmentsCell = ({
  date,
  location: { id: locationId, locationGroup },
  assignments,
  openAssignmentDrawer,
}) => {
  const { selectedCell, updateSelectedCell } = useLocationAssignmentsContext();
  const isSelected = selectedCell.locationId === locationId && isEqual(date, selectedCell.date);

  const handleCellClick = () => {
    updateSelectedCell({ date, locationId });
    openAssignmentDrawer({
      locationId,
      locationGroupId: locationGroup.id,
      date: toDateString(date),
    });
  };

  const handleAssignmentClick = (assignment) => {
    updateSelectedCell({ date, locationId });
    openAssignmentDrawer({
      ...assignment,
      locationId,
      locationGroupId: locationGroup.id,
      date: toDateString(date),
    });
  };

  return (
    <CarouselGrid.Cell
      id={generateIdFromCell({ locationId, date })}
      onClick={handleCellClick}
      $selected={isSelected}
      $clickable
      data-testid="cell-dp5l"
    >
      {assignments?.map((assignment) => (
        <LocationAssignmentTile
          key={assignment.id}
          assignment={assignment}
          onClick={handleAssignmentClick}
          data-testid={`assignment-tile-${assignment.id}`}
        />
      ))}
    </CarouselGrid.Cell>
  );
};

const partitionAssignmentsByDate = (assignments) => {
  const assignmentsByDate = {};
  assignments?.forEach((assignment) => {
    const dateKey = assignment.date;
    if (!assignmentsByDate[dateKey]) {
      assignmentsByDate[dateKey] = [];
    }
    assignmentsByDate[dateKey].push(assignment);
  });
  return assignmentsByDate;
};

export const AssignmentsRow = ({
  dates,
  location,
  assignments,
  openAssignmentDrawer,
}) => {
  const { locationGroup } = location;
  const assignmentsByDate = partitionAssignmentsByDate(assignments);

  return (
    <CarouselGrid.Row data-testid="row-m8yc">
      <CarouselGrid.RowHeaderCell data-testid="rowheadercell-qiko">
        <LocationHeader>
          <LocationGroupName>
            <TranslatedReferenceData
              category="locationGroup"
              value={locationGroup.id}
              fallback={locationGroup.name}
              data-testid="translatedreferencedata-7cuw"
            />
          </LocationGroupName>
          <LocationName>
            <span> | </span>
            <TranslatedReferenceData
              category="location"
              value={location.id}
              fallback={location.name}
              data-testid="translatedreferencedata-1gpj"
            />
          </LocationName>
        </LocationHeader>
      </CarouselGrid.RowHeaderCell>
      {dates.map((d) => (
        <AssignmentsCell
          date={d}
          key={d.valueOf()}
          location={location}
          assignments={assignmentsByDate[formatISO(d, { representation: 'date' })]}
          openAssignmentDrawer={openAssignmentDrawer}
          data-testid={`assignmentscell-5t8x-${d.valueOf()}`}
        />
      ))}
    </CarouselGrid.Row>
  );
};

const partitionAssignmentsByLocation = (assignments) => {
  const assignmentsByLocation = {};
  assignments?.forEach((assignment) => {
    const locationId = assignment.locationId;
    if (!assignmentsByLocation[locationId]) {
      assignmentsByLocation[locationId] = [];
    }
    assignmentsByLocation[locationId].push(assignment);
  });
  return assignmentsByLocation;
};

export const LocationAssignmentsCalendarBody = ({
  displayedDates,
  locations,
  isLocationsLoading,
  assignments,
  openAssignmentDrawer,
}) => {
  if (isLocationsLoading)
    return <SkeletonRows colCount={displayedDates.length} data-testid="skeletonrows-munx" />;

  if (locations?.length === 0) return null;

  const assignmentsByLocation = partitionAssignmentsByLocation(assignments);

  return locations?.map((location) => (
    <AssignmentsRow
      dates={displayedDates}
      key={location.code}
      location={location}
      assignments={assignmentsByLocation[location.id] ?? []}
      openAssignmentDrawer={openAssignmentDrawer}
      data-testid={`assignmentsrow-t3ka-${location.code}`}
    />
  ));
};
