import React, { useState } from 'react';
import { ClickAwayListener, Popover } from '@material-ui/core';
import FilterListIcon from '@material-ui/icons/FilterList';
import styled from 'styled-components';

import { USER_PREFERENCES_KEYS } from '@tamanu/constants';
import { GreyOutlinedButton as BaseGreyOutlinedButton } from '@tamanu/ui-components';
import { ExpandedMultiSelectField } from './Field/ExpandedMultiSelectField';
import { useUserPreferencesMutation } from '../api/mutations/useUserPreferencesMutation';
import { useVitalChartData } from '../contexts/VitalChartData';
import { useChartData } from '../contexts/ChartData';
import { TranslatedText } from './Translation';

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
    <ClickAwayListener onClickAway={handleOnClose} data-testid="clickawaylistener-j6m2">
      <div>
        <GreyOutlinedButton onClick={handleClick} data-testid="greyoutlinedbutton-a2al">
          <FilterListIcon color="primary" data-testid="filterlisticon-ansb" />
          <TranslatedText
            stringId="general.action.filter"
            fallback="Filter"
            data-testid="translatedtext-filter"
          />
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
          data-testid="popover-5s9v"
        >
          <ExpandedMultiSelectField
            selectAllOptionLabel={<small>Select All</small>}
            options={optionsWithSmallLabel}
            field={field}
            data-testid="expandedmultiselectfield-rekh"
          />
        </Popover>
      </div>
    </ClickAwayListener>
  );
};

export const VitalMultiChartFilter = () => {
  const {
    chartKeys,
    setChartKeys,
    visualisationConfigs,
    allGraphedChartKeys,
  } = useVitalChartData();
  const userPreferencesMutation = useUserPreferencesMutation();
  const { selectedChartTypeId } = useChartData();

  const filterOptions = visualisationConfigs
    .filter(({ key }) => allGraphedChartKeys.includes(key))
    .map(({ key, name }) => ({ value: key, label: name }));

  const handleChange = newValues => {
    const newSelectedChartKeys = newValues.target.value;
    const sortedSelectedChartKeys = allGraphedChartKeys.filter(key =>
      newSelectedChartKeys.includes(key),
    );

    setChartKeys(sortedSelectedChartKeys);

    const graphPreferenceKey =
      selectedChartTypeId === null
        ? USER_PREFERENCES_KEYS.SELECTED_GRAPHED_VITALS_ON_FILTER
        : USER_PREFERENCES_KEYS.SELECTED_GRAPHED_CHARTS_ON_FILTER;

    const selectedKeys =
      sortedSelectedChartKeys.length === allGraphedChartKeys.length
        ? 'select-all'
        : sortedSelectedChartKeys.join(',');
    userPreferencesMutation.mutate({
      key: graphPreferenceKey,
      value: selectedKeys,
    });
  };

  const field = {
    name: 'selectedKeys',
    value: chartKeys,
    onChange: handleChange,
  };

  return (
    <DumbVitalMultiChartFilter
      options={filterOptions}
      field={field}
      data-testid="dumbvitalmultichartfilter-8e0t"
    />
  );
};
