import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { LOCATION_AVAILABILITY_TAG_CONFIG, LOCATION_AVAILABILITY_STATUS } from 'shared/constants';
import { AutocompleteInput, AutocompleteField } from './AutocompleteField';
import { useApi, useSuggester } from '../../api';
import { Suggester } from '../../utils/suggester';
import { useLocalisation } from '../../contexts/Localisation';
import { Colors } from '../../constants';
import { BodyText } from '../Typography';
import { SelectInput } from './SelectField';
import { Field } from './Field';

const locationSuggester = (api, groupValue, displayTags) => {
  return new Suggester(api, 'location', {
    filterer: ({ locationGroup }) => {
      // if no category is selected, return all child locations. The location field will be disabled
      // in this state anyway
      if (!groupValue) {
        return locationGroup?.id !== undefined;
      }
      return locationGroup?.id === groupValue;
    },
    formatter: ({ name, id, locationGroup, availability }) => {
      return {
        value: id,
        label: name,
        locationGroup,
        availability,
        ...(displayTags && { tag: LOCATION_AVAILABILITY_TAG_CONFIG[availability] }),
      };
    },
    baseQueryParameters: { filterByFacility: true },
  });
};

const useLocationGroups = () => {
  const api = useApi();

  // Todo: add baseQueryParameters
  const { data = [], ...query } = useQuery(['locationGroups'], () =>
    api.get('suggestions/locationGroup/all'),
  );

  const options = data.map(({ id, name }) => ({
    value: id,
    label: name,
  }));

  return { ...query, data: options };
};

const useLocationSuggestion = locationId => {
  const api = useApi();
  return useQuery(
    ['locationSuggestion', locationId],
    () => api.get(`suggestions/location/${locationId}`),
    {
      enabled: !!locationId,
    },
  );
};

export const LocationInput = React.memo(
  ({
    locationGroupLabel,
    label,
    name,
    disabled,
    error,
    helperText,
    displayTags,
    required,
    className,
    value,
    onChange,
  }) => {
    const api = useApi();
    const [groupId, setGroupId] = useState('');
    const [locationId, setLocationId] = useState(value);
    const suggester = locationSuggester(api, groupId, displayTags);
    const { data: options } = useLocationGroups();
    const { data } = useLocationSuggestion(locationId);

    // when the location is selected, set the group value automatically if it's not set yet
    useEffect(() => {
      const isNotSameGroup = data?.locationGroup?.id && data.locationGroup.id !== groupId;
      if (isNotSameGroup) {
        // clear the location if the location group is changed
        setLocationId('');
        onChange({ target: { value: '', name } });
      }
    }, [onChange, name, groupId, data?.locationGroup]);

    const handleChangeCategory = event => {
      setGroupId(event.target.value);
    };

    const handleChange = async event => {
      setLocationId(event.target.value);
      onChange({ target: { value: event.target.value, name } });
    };

    return (
      <>
        <SelectInput
          label={locationGroupLabel}
          options={options}
          onChange={handleChangeCategory}
          value={groupId}
          disabled={disabled}
        />
        <AutocompleteInput
          label={label}
          disabled={!groupId}
          name={name}
          suggester={suggester}
          helperText={helperText}
          required={required}
          error={error}
          value={locationId}
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
  displayTags: PropTypes.bool,
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
  displayTags: true,
  name: undefined,
  helperText: '',
  className: '',
};

export const LocationField = React.memo(({ field, error, ...props }) => {
  const { getLocalisation } = useLocalisation();
  const suggester = useSuggester('location', {
    baseQueryParameters: { filterByFacility: true },
  });

  // If the feature flag is set, return the 2 tier location selector
  if (getLocalisation('features.locationHierarchy') === true) {
    return (
      <LocationInput
        name={field.name}
        value={field.value || ''}
        onChange={field.onChange}
        {...props}
      />
    );
  }

  // Otherwise return the default location autocomplete
  return (
    <AutocompleteInput
      suggester={suggester}
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
    const locationGroupLabel =
      getLocalisation(`${locationGroupIdPath}.longLabel`) || defaultGroupLabel;

    const locationIdPath = 'fields.locationId';
    const locationLabel = getLocalisation(`${locationIdPath}.longLabel`) || defaultLabel;

    return (
      <LocationField label={locationLabel} locationGroupLabel={locationGroupLabel} {...props} />
    );
  },
);

const Text = styled(BodyText)`
  margin-top: -5px;
`;

export const LocationAvailabilityWarningMessage = ({ locationId }) => {
  const { data, isSuccess } = useLocationSuggestion(locationId);

  if (!isSuccess) {
    return null;
  }

  const status = data?.availability;

  if (status === LOCATION_AVAILABILITY_STATUS.RESERVED) {
    return (
      <Text>
        <span style={{ color: Colors.alert }}>*</span> This location is reserved by another patient.
        Please ensure the bed is available before confirming.
      </Text>
    );
  }

  if (status === LOCATION_AVAILABILITY_STATUS.OCCUPIED) {
    return (
      <Text>
        <span style={{ color: Colors.alert }}>*</span> This location is occupied by another patient.
        Please ensure the bed is available before confirming.
      </Text>
    );
  }

  return null;
};
