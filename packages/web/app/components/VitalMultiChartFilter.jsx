import React, { useState } from 'react';
import { ClickAwayListener, Popover } from '@material-ui/core';
import FilterListIcon from '@material-ui/icons/FilterList';
import styled from 'styled-components';

import { GreyOutlinedButton as BaseGreyOutlinedButton } from './Button';
import { ExpandedMultiSelectField } from './Field/ExpandedMultiSelectField';
import { useUserPreferencesMutation } from '../api/mutations/useUserPreferencesMutation';
import { useVitalsVisualisationConfigsQuery } from '../api/queries/useVitalsVisualisationConfigsQuery';
import { useVitalChartData } from '../contexts/VitalChartData';

const GreyOutlinedButton = styled(BaseGreyOutlinedButton)`
  width: 105px;
  height: 40px;
`;

export const DumbVitalMultiChartFilter = ({ options, field }) => {
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
        <GreyOutlinedButton onClick={handleClick}>
          <FilterListIcon color="primary" />
          Filter
        </GreyOutlinedButton>

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
  const { chartKeys, setChartKeys } = useVitalChartData();
  const vitalsVisualisationConfigsQuery = useVitalsVisualisationConfigsQuery();
  const userPreferencesMutation = useUserPreferencesMutation();

  const { data } = vitalsVisualisationConfigsQuery;
  const { visualisationConfigs = [], allGraphedChartKeys = [] } = data;
  const filterOptions = visualisationConfigs
    .filter(({ key }) => allGraphedChartKeys.includes(key))
    .map(({ key, name }) => ({ value: key, label: name }));

  const handleChange = newValues => {
    const newSelectedChartKeys = newValues.target.value;
    const sortedSelectedChartKeys = allGraphedChartKeys.filter(key =>
      newSelectedChartKeys.includes(key),
    );

    setChartKeys(sortedSelectedChartKeys);

    const selectedGraphedVitalsOnFilter =
      sortedSelectedChartKeys.length === allGraphedChartKeys.length
        ? 'select-all'
        : sortedSelectedChartKeys.join(',');
    userPreferencesMutation.mutate({
      selectedGraphedVitalsOnFilter,
    });
  };

  const field = {
    name: 'selectedGraphedVitalsOnFilter',
    value: chartKeys,
    onChange: handleChange,
  };

  return <DumbVitalMultiChartFilter options={filterOptions} field={field} />;
};
