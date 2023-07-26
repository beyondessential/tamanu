import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import {
  LOCATION_AVAILABILITY_TAG_CONFIG,
  LOCATION_AVAILABILITY_STATUS,
} from '@tamanu/constants';
import { AutocompleteInput } from './AutocompleteField';
import { useApi, useSuggester } from '../../api';
import { Suggester } from '../../utils/suggester';
import { useLocalisation } from '../../contexts/Localisation';
import { BodyText } from '../Typography';
import { useAuth } from '../../contexts/Auth';

const locationSuggester = (api, groupValue, enableLocationStatus) => {
  return new Suggester(api, 'location', {
    formatter: ({ name, id, locationGroup, availability }) => {
      return {
        value: id,
        label: name,
        locationGroup,
        availability: enableLocationStatus ? availability : null,
        tag: enableLocationStatus ? LOCATION_AVAILABILITY_TAG_CONFIG[availability] : null,
      };
    },
    baseQueryParameters: { filterByFacility: true, locationGroupId: groupValue },
  });
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
    required,
    className,
    value,
    onChange,
    enableLocationStatus = true,
  }) => {
    const api = useApi();
    const { facility } = useAuth();
    const [groupId, setGroupId] = useState('');
    const [locationId, setLocationId] = useState(value);
    const suggester = locationSuggester(api, groupId, enableLocationStatus);
    const locationGroupSuggester = useSuggester('facilityLocationGroup');
    const { data: location } = useLocationSuggestion(locationId);

    // when the location is selected, set the group value automatically if it's not set yet
    useEffect(() => {
      const isNotSameGroup =
        location?.locationGroup?.id && groupId && location.locationGroup.id !== groupId;
      if (isNotSameGroup) {
        // clear the location if the location group is changed
        setLocationId('');
        onChange({ target: { value: '', name } });
      }

      // Initialise the location group state
      // if the form is being opened in edit mode (i.e. there are existing values)
      if (value && !groupId && location?.locationGroup?.id) {
        setGroupId(location.locationGroup.id);
      }
    }, [onChange, value, name, groupId, location?.id, location?.locationGroup]);

    const handleChangeCategory = event => {
      setGroupId(event.target.value);
      setLocationId('');
      onChange({ target: { value: '', name } });
    };

    const handleChange = async event => {
      setLocationId(event.target.value);
      onChange({ target: { value: event.target.value, name } });
    };

    // Disable the location and location group fields if:
    // 1. In edit mode (form already is initialised with pre-filled values); and
    // 2. The existing location has a different facility than the current facility
    // Disable just the location field if location group has not been chosen or pre-filled
    const existingLocationHasSameFacility =
      value && location?.facilityId ? facility.id === location.facilityId : true;
    const locationSelectIsDisabled = !groupId || !existingLocationHasSameFacility;
    const locationGroupSelectIsDisabled = !existingLocationHasSameFacility;

    return (
      <>
        {/* Show required asterisk but the field is not actually required */}
        <AutocompleteInput
          label={locationGroupLabel}
          required={required}
          onChange={handleChangeCategory}
          suggester={locationGroupSuggester}
          value={groupId}
          disabled={locationGroupSelectIsDisabled || disabled}
          autofill={!value} // do not autofill if there is a pre-filled value
        />
        <AutocompleteInput
          label={label}
          disabled={locationSelectIsDisabled || disabled}
          name={name}
          suggester={suggester}
          helperText={helperText}
          required={required}
          error={error}
          value={locationId}
          onChange={handleChange}
          className={className}
          autofill={!value} // do not autofill if there is a pre-filled value
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

export const LocationField = React.memo(({ field, error, ...props }) => (
  <LocationInput name={field.name} value={field.value || ''} onChange={field.onChange} {...props} />
));

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

export const LocationAvailabilityWarningMessage = ({ locationId, ...props }) => {
  const { data, isSuccess } = useLocationSuggestion(locationId);

  if (!isSuccess) {
    return null;
  }

  const status = data?.availability;

  if (status === LOCATION_AVAILABILITY_STATUS.RESERVED) {
    return (
      <Text {...props}>
        This location is reserved by another patient. Please ensure the bed is available before
        confirming.
      </Text>
    );
  }

  if (status === LOCATION_AVAILABILITY_STATUS.OCCUPIED) {
    return (
      <Text {...props}>
        This location is occupied by another patient. Please ensure the bed is available before
        confirming.
      </Text>
    );
  }

  return null;
};
