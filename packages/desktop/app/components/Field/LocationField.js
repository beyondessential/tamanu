import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { LOCATION_AVAILABILITY_TAG_CONFIG, LOCATION_AVAILABILITY_STATUS } from 'shared/constants';
import { AutocompleteInput } from './AutocompleteField';
import { useApi } from '../../api';
import { Suggester } from '../../utils/suggester';
import { useLocalisation } from '../../contexts/Localisation';
import { Colors } from '../../constants';
import { BodyText } from '../Typography';

const locationCategorySuggester = api => {
  return new Suggester(api, 'locationGroup', {
    formatter: ({ name, id }) => {
      return {
        label: name,
        value: id,
      };
    },
    baseQueryParameters: { filterByFacility: true },
  });
};

const locationSuggester = (api, groupValue) => {
  return new Suggester(api, 'location', {
    filterer: ({ locationGroup }) => {
      // if no category is selected, return all child locations and display their parents with a
      // comma bellow
      if (!groupValue) {
        return locationGroup?.id !== undefined;
      }
      return locationGroup?.id === groupValue;
    },
    formatter: ({ name, id, locationGroup, availability }) => {
      let label = name;
      // if a groupValue is selected return the comma seperated list of locations
      if (!groupValue) {
        label = locationGroup ? `${locationGroup.name}, ${name}` : name;
      }

      return {
        value: id,
        label,
        locationGroup,
        availability,
        tag: LOCATION_AVAILABILITY_TAG_CONFIG[availability],
      };
    },
    baseQueryParameters: { filterByFacility: true },
  });
};

export const LocationInput = React.memo(
  ({
    locationGroupLabel,
    label,
    name,
    disabled,
    error,
    helperText,
    required,
    className,
    value,
    onChange,
  }) => {
    const api = useApi();
    const [groupValue, setGroupValue] = useState('');
    const [locationValue, setLocationValue] = useState(value);

    const suggester = locationSuggester(api, groupValue);
    const { data } = useQuery(
      ['locationSuggestion', locationValue],
      () => suggester.fetchCurrentOption(locationValue),
      {
        enabled: !!locationValue,
      },
    );

    // when the location is selected, set the group value automatically if it's not set yet
    useEffect(() => {
      const isNotSameGroup = data?.locationGroup?.id && data.locationGroup.id !== groupValue;
      if (!groupValue && isNotSameGroup) {
        setGroupValue(data.locationGroup.id);
      } else if (isNotSameGroup) {
        // clear the location if the location group is changed
        setLocationValue('');
        onChange({ target: { value: '', name } });
      }
    }, [groupValue, data?.locationGroup]);

    const handleChangeCategory = event => {
      setGroupValue(event.target.value);
    };

    const handleChange = async event => {
      setLocationValue(event.target.value);
      onChange({ target: { value: event.target.value, name } });
    };

    return (
      <>
        <AutocompleteInput
          label={locationGroupLabel}
          disabled={disabled}
          onChange={handleChangeCategory}
          value={groupValue}
          suggester={locationCategorySuggester(api)}
        />
        <AutocompleteInput
          label={label}
          disabled={disabled}
          name={name}
          suggester={suggester}
          helperText={helperText}
          required={required}
          error={error}
          value={locationValue}
          onChange={handleChange}
          className={className}
        />
      </>
    );
  },
);

LocationInput.propTypes = {
  label: PropTypes.string,
  locationGroupLabel: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  name: PropTypes.string,
  className: PropTypes.string,
};

LocationInput.defaultProps = {
  label: '',
  locationGroupLabel: '',
  required: false,
  error: false,
  disabled: false,
  name: undefined,
  helperText: '',
  className: '',
};

export const LocationField = React.memo(({ field, error, ...props }) => {
  return (
    <LocationInput
      name={field.name}
      value={field.value || ''}
      onChange={field.onChange}
      {...props}
    />
  );
});

export const LocalisedLocationField = React.memo(
  ({ defaultGroupLabel = 'Area', defaultLabel = 'Location', ...props }) => {
    const { getLocalisation } = useLocalisation();

    const locationGroupIdPath = 'fields.locationGroupId';
    const locationGroupHidden = getLocalisation(`${locationGroupIdPath}.hidden`);
    const locationGroupLabel =
      getLocalisation(`${locationGroupIdPath}.longLabel`) || defaultGroupLabel;

    const locationIdPath = 'fields.locationId';
    const locationHidden = getLocalisation(`${locationIdPath}.hidden`);
    const locationLabel = getLocalisation(`${locationIdPath}.longLabel`) || defaultLabel;

    if (locationHidden || locationGroupHidden) {
      return null;
    }
    return (
      <LocationField label={locationLabel} locationGroupLabel={locationGroupLabel} {...props} />
    );
  },
);

const Text = styled(BodyText)`
  color: ${props => props.theme.palette.text.secondary};
`;

export const LocationAvailabilityWarningMessage = ({ locationId }) => {
  const api = useApi();

  const { data, isSuccess } = useQuery(
    ['locationSuggestion', locationId],
    () => api.get(`suggestions/location/${locationId}`),
    {
      enabled: !!locationId,
    },
  );

  if (!isSuccess) {
    return null;
  }

  const status = data?.availability;

  if (status === LOCATION_AVAILABILITY_STATUS.RESERVED) {
    return (
      <Text>
        <span style={{ color: Colors.alert }}>*</span> This location is already occupied by another
        patient. Please ensure the bed is available before confirming.
      </Text>
    );
  }

  if (status === LOCATION_AVAILABILITY_STATUS.OCCUPIED) {
    return (
      <Text>
        <span style={{ color: Colors.alert }}>*</span> This location is already occupied by another
        patient. Please ensure the bed is available before confirming.
      </Text>
    );
  }

  return null;
};
