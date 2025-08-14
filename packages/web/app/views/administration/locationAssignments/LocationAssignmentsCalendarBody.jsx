import { formatISO, isEqual } from 'date-fns';
import React from 'react';
import styled from 'styled-components';

import { toDateString } from '@tamanu/utils/dateTime';

import { useLocationAssignmentsContext } from '../../../contexts/LocationAssignments';
import { CarouselComponents as CarouselGrid } from '../../scheduling/locationBookings/CarouselComponents';
import { SkeletonRows } from '../../scheduling/locationBookings/Skeletons';
import { generateIdFromCell, partitionAssignmentsByDate } from './utils';
import { useAuth } from '../../../contexts/Auth';
import { TranslatedReferenceData } from '../../../components';
import { Colors } from '../../../constants';

const AssignmentTile = styled.div`
  background-color: ${Colors.softBlue};
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: ${Colors.darkText};
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover {
    background-color: ${Colors.blue};
    color: ${Colors.white};
    transform: scale(1.02);
  }
`;

const AssignmentTime = styled.div`
  font-size: 0.7rem;
  font-weight: 400;
  margin-top: 0.125rem;
`;

export const AssignmentsCell = ({
  assignments,
  date,
  location: { id: locationId },
  openAssignmentForm,
}) => {
  const { ability } = useAuth();
  const { selectedCell, updateSelectedCell } = useLocationAssignmentsContext();
  const isSelected = selectedCell.locationId === locationId && isEqual(date, selectedCell.date);
  const canCreateLocationSchedule = ability.can('create', 'LocationSchedule');

  return (
    <CarouselGrid.Cell
      id={generateIdFromCell({ locationId, date })}
      onClick={(e) => {
        if (e.target.closest('.assignment-tile') || !canCreateLocationSchedule) return;
        openAssignmentForm({ date: toDateString(date), locationId });
        updateSelectedCell({ date, locationId });
      }}
      $selected={isSelected}
      $clickable={canCreateLocationSchedule}
      data-testid="cell-dp5l"
    >
      {assignments?.map((assignment, index) => (
        <AssignmentTile
          key={assignment.id}
          className="assignment-tile"
          onClick={() => openAssignmentForm(assignment)}
          data-testid={`assignmenttile-b6vn-${index}`}
        >
          <div>{assignment.user?.displayName || 'Unknown User'}</div>
          <AssignmentTime>
            {assignment.startTime} - {assignment.endTime}
          </AssignmentTime>
        </AssignmentTile>
      ))}
    </CarouselGrid.Cell>
  );
};

export const AssignmentsRow = ({
  assignments,
  dates,
  location,
  openAssignmentForm,
}) => {
  const { locationGroup } = location;
  const assignmentsByDate = partitionAssignmentsByDate(assignments);

  return (
    <CarouselGrid.Row data-testid="row-m8yc">
      <CarouselGrid.RowHeaderCell data-testid="rowheadercell-qiko">
        <TranslatedReferenceData
          category="locationGroup"
          value={locationGroup.id}
          fallback={locationGroup.name}
          data-testid="translatedreferencedata-7cuw"
        />{' '}
        <TranslatedReferenceData
          category="location"
          value={location.id}
          fallback={location.name}
          data-testid="translatedreferencedata-1gpj"
        />
      </CarouselGrid.RowHeaderCell>
      {dates.map((d) => (
        <AssignmentsCell
          assignments={assignmentsByDate[formatISO(d, { representation: 'date' })]}
          date={d}
          key={d.valueOf()}
          location={location}
          openAssignmentForm={openAssignmentForm}
          data-testid={`assignmentscell-5t8x-${d.valueOf()}`}
        />
      ))}
    </CarouselGrid.Row>
  );
};

export const LocationAssignmentsCalendarBody = ({
  assignmentsByLocation,
  displayedDates,
  filteredLocations,
  locationsQuery,
  openAssignmentForm,
}) => {
  if (locationsQuery.isLoading)
    return <SkeletonRows colCount={displayedDates.length} data-testid="skeletonrows-munx" />;

  if (filteredLocations?.length === 0) return null;

  return filteredLocations?.map((location) => (
    <AssignmentsRow
      assignments={assignmentsByLocation[location.id] ?? []}
      dates={displayedDates}
      key={location.code}
      location={location}
      openAssignmentForm={openAssignmentForm}
      data-testid={`assignmentsrow-t3ka-${location.code}`}
    />
  ));
};