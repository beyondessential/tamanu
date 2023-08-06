import React, { useEffect, useState } from 'react';
import { Box, ClickAwayListener, Popover } from '@material-ui/core';
import FilterListIcon from '@material-ui/icons/FilterList';

import { GreyOutlinedButton } from './Button';
import { ExpandedMultiSelectField } from './Field/ExpandedMultiSelectField';
import { useUserPreferencesQuery } from '../api/queries/useUserPreferencesQuery';
import { useUserPreferencesMutation } from '../api/mutations/useUserPreferencesMutation';
import { useVitalsVisualisationConfigsQuery } from '../api/queries/useVitalsVisualisationConfigsQuery';
import { useVitalChartData } from '../contexts/VitalChartData';

export const VitalMultiChartFilterComponent = ({ options, field }) => {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null); // When the button is clicked, the anchorEl state is updated to the clicked button element, which will serve as the anchor for the Popover component.

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
    setOpen(() => !open);
  };

  const handleOnClose = () => {
    setOpen(false);
  };

  const optionsWithSmallLabel = options.map(option => ({
    ...option,
    label: <small>{option.label}</small>,
  }));

  return (
    // Notice that ClickAwayListener only accepts one child element.
    <ClickAwayListener onClickAway={handleOnClose}>
      <div>
        <Box paddingLeft="100px">
          <GreyOutlinedButton onClick={handleClick}>
            <FilterListIcon color="primary" />
            Filter
          </GreyOutlinedButton>
        </Box>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleOnClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <ExpandedMultiSelectField
            selectAllOptionLabel={<small>Select All</small>}
            options={optionsWithSmallLabel}
            field={field}
          />
        </Popover>
      </div>
    </ClickAwayListener>
  );
};

export const VitalMultiChartFilter = () => {
  const { setChartKeys } = useVitalChartData();
  const vitalsVisualisationConfigsQuery = useVitalsVisualisationConfigsQuery();
  const userPreferencesQuery = useUserPreferencesQuery();
  const userPreferencesMutation = useUserPreferencesMutation();

  const { data } = vitalsVisualisationConfigsQuery;
  const { visualisationConfigs = [], allGraphedChartKeys = [] } = data;
  const filterOptions = visualisationConfigs
    .filter(({ key }) => allGraphedChartKeys.includes(key))
    .map(({ key, name }) => ({ value: key, label: name }));

  const { selectedGraphedVitalsOnFilter = '' } = userPreferencesQuery?.data || {};
  const [selectedGraphedVitals, setSelectedGraphedVitals] = React.useState(allGraphedChartKeys);

  useEffect(() => {
    if (selectedGraphedVitalsOnFilter !== '') {
      setSelectedGraphedVitals(selectedGraphedVitalsOnFilter.split(','));
    }
  }, [selectedGraphedVitalsOnFilter]);

  const handleChange = newValues => {
    const newSelectedChartKeys = newValues.target.value;
    const sortedSelectedChartKeys = allGraphedChartKeys.filter(key =>
      newSelectedChartKeys.includes(key),
    );

    setSelectedGraphedVitals(sortedSelectedChartKeys);
    setChartKeys(sortedSelectedChartKeys);
    userPreferencesMutation.mutate({
      selectedGraphedVitalsOnFilter: sortedSelectedChartKeys.join(','),
    });
  };

  const field = {
    name: 'selectedGraphedVitalsOnFilter',
    value: selectedGraphedVitals,
    onChange: handleChange,
  };

  return <VitalMultiChartFilterComponent options={filterOptions} field={field} />;
};
