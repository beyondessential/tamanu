import { isEqual } from 'date-fns';
import React from 'react';
import styled from 'styled-components';

import { useLocationAssignmentsContext } from '../../../contexts/LocationAssignments';
import { CarouselComponents as CarouselGrid } from '../../scheduling/locationBookings/CarouselComponents';
import { SkeletonRows } from '../../scheduling/locationBookings/Skeletons';
import { generateIdFromCell } from './utils';
import { TranslatedReferenceData } from '../../../components';
import { Colors } from '../../../constants';

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
  location: { id: locationId },
}) => {
  const { selectedCell, updateSelectedCell } = useLocationAssignmentsContext();
  const isSelected = selectedCell.locationId === locationId && isEqual(date, selectedCell.date);

  return (
    <CarouselGrid.Cell
      id={generateIdFromCell({ locationId, date })}
      onClick={() => {
        updateSelectedCell({ date, locationId });
      }}
      $selected={isSelected}
      $clickable
      data-testid="cell-dp5l"
    >
    </CarouselGrid.Cell>
  );
};

export const AssignmentsRow = ({
  dates,
  location,
}) => {
  const { locationGroup } = location;

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
          data-testid={`assignmentscell-5t8x-${d.valueOf()}`}
        />
      ))}
    </CarouselGrid.Row>
  );
};

export const LocationAssignmentsCalendarBody = ({
  displayedDates,
  locations,
  isLocationsLoading,
}) => {
  if (isLocationsLoading)
    return <SkeletonRows colCount={displayedDates.length} data-testid="skeletonrows-munx" />;

  if (locations?.length === 0) return null;

  return locations?.map((location) => (
    <AssignmentsRow
      dates={displayedDates}
      key={location.code}
      location={location}
      data-testid={`assignmentsrow-t3ka-${location.code}`}
    />
  ));
};
