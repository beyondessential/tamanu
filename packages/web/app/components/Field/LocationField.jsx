import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { LOCATION_AVAILABILITY_STATUS, LOCATION_AVAILABILITY_TAG_CONFIG } from '@tamanu/constants';

import { AutocompleteInput } from './AutocompleteField';
import { useApi, useSuggester } from '../../api';
import { BodyText } from '../Typography';
import { useAuth } from '../../contexts/Auth';
import { TranslatedText } from '../Translation/TranslatedText';
import { MultiAutocompleteInput } from './MultiAutocompleteField';
import { NoteModalActionBlocker } from '../NoteModalActionBlocker';

const useLocationSuggestion = locationId => {
  const api = useApi();
  // Get the last selected location id to determine its location group
  const id = Array.isArray(locationId) ? locationId[locationId.length - 1] : locationId;
  return useQuery(['locationSuggestion', id], () => api.get(`suggestions/location/${id}`), {
    enabled: !!id,
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
    groupValue,
    onChange,
    onGroupChange = () => {},
    size = 'medium',
    form = {},
    enableLocationStatus = true,
    hideLocationGroupError = false,
    locationGroupSuggesterType = 'facilityLocationGroup',
    autofill = true,
    isMulti = false,
    'data-testid': dataTestId,
    showAllLocations = false,
    locationGroupBaseQueryParameters = {},
    facilityId: facilityIdOverride,
    wrapInNoteModalActionBlocker = false,
  }) => {
    const { facilityId: currentFacilityId } = useAuth();
    const facilityId = (facilityIdOverride ?? currentFacilityId) || '';

    const [groupId, setGroupId] = useState(groupValue);
    const [locationId, setLocationId] = useState(value);
    const suggester = useSuggester('location', {
      formatter: ({ name, id, locationGroup, availability }) => {
        return {
          value: id,
          label: name,
          locationGroup,
          availability: enableLocationStatus ? availability : null,
          tag: enableLocationStatus ? LOCATION_AVAILABILITY_TAG_CONFIG[availability] : null,
        };
      },
      baseQueryParameters: { facilityId, filterByFacility: true, locationGroupId: groupId },
    });
    const locationGroupSuggester = useSuggester(locationGroupSuggesterType, {
      baseQueryParameters: {
        facilityId: facilityId,
        ...locationGroupBaseQueryParameters,
      },
    });
    const { data: location } = useLocationSuggestion(locationId);
    const { initialValues } = form;

    useEffect(() => {
      if (!initialValues) return;
      // Form is reinitialised, reset the state handled group and location values
      setGroupId('');
      setLocationId(initialValues[name] ?? '');
    }, [initialValues, name]);

    useEffect(() => {
      if (value) {
        setLocationId(value);
      }
    }, [value]);

    useEffect(() => {
      if (groupValue) {
        setGroupId(groupValue);
      }
    }, [groupValue]);

    // when the location is selected, set the group value automatically if it's not set yet
    useEffect(() => {
      const isNotSameGroup =
        location?.locationGroup?.id && groupId && location.locationGroup.id !== groupId;
      if (isNotSameGroup) {
        // clear the location if the location group is changed
        setLocationId('');
        onChange({ target: { value: '', name, groupValue: location.locationGroup.id } });
      }

      // Initialise the location group state
      // if the form is being opened in edit mode (i.e. there are existing values)
      if (value && !groupId && location?.locationGroup?.id) {
        onGroupChange(location.locationGroup.id);
        setGroupId(location.locationGroup.id);
      }
    }, [onChange, value, name, groupId, location?.id, location?.locationGroup, onGroupChange]);

    const handleChangeCategory = event => {
      setGroupId(event.target.value);
      onGroupChange(event.target.value);
      if (locationId) {
        setLocationId('');
        onChange({ target: { value: '', name, groupValue: event.target.value } });
      }
    };

    const handleChange = async event => {
      setLocationId(event.target.value);
      onChange({ target: { value: event.target.value, name, groupValue: groupId } });
    };

    // Disable the location and location group fields if:
    // 1. In edit mode (form already is initialised with pre-filled values); and
    // 2. The existing location has a different facility than the current facility
    // Disable just the location field if location group has not been chosen or pre-filled
    const existingLocationHasSameFacility =
      (value && location?.facilityId ? facilityId === location.facilityId : true) ||
      showAllLocations;
    const locationSelectIsDisabled = !groupId || !existingLocationHasSameFacility;
    const locationGroupSelectIsDisabled = !existingLocationHasSameFacility;

    const LocationAutocompleteInput = isMulti ? MultiAutocompleteInput : AutocompleteInput;
    const Wrapper = wrapInNoteModalActionBlocker ? NoteModalActionBlocker : React.Fragment;

    return (
      <Wrapper>
        {/* Show required asterisk but the field is not actually required */}
        <AutocompleteInput
          label={locationGroupLabel}
          required={required}
          name="locationGroup"
          onChange={handleChangeCategory}
          suggester={locationGroupSuggester}
          value={groupId}
          disabled={locationGroupSelectIsDisabled || disabled}
          // do not autofill if there is a pre-filled value
          autofill={!value && autofill}
          error={hideLocationGroupError ? false : error}
          helperText={hideLocationGroupError ? undefined : helperText}
          size={size}
          data-testid={`${dataTestId}-group`}
        />
        <LocationAutocompleteInput
          label={label}
          disabled={locationSelectIsDisabled || disabled}
          name={name}
          suggester={suggester}
          helperText={helperText}
          required={!!groupId || required}
          error={error}
          value={locationId}
          onChange={handleChange}
          className={className}
          // do not autofill if there is a pre-filled value
          autofill={!value && autofill}
          size={size}
          data-testid={`${dataTestId}-location`}
        />
      </Wrapper>
    );
  },
);

LocationInput.propTypes = {
  label: PropTypes.node,
  locationGroupLabel: PropTypes.node,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  hideLocationGroupError: PropTypes.bool,
  helperText: PropTypes.string,
  name: PropTypes.string,
  className: PropTypes.string,
  'data-testid': PropTypes.string,
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
  'data-testid': undefined,
};

export const LocationField = React.memo(({ field, ...props }) => {
  return (
    <LocationInput
      name={field.name}
      value={field.value || ''}
      onChange={field.onChange}
      {...props}
    />
  );
});

export const LocalisedLocationField = React.memo(props => {
  return (
    <LocationField
      label={
        <TranslatedText
          stringId="general.localisedField.locationId.label"
          fallback="Location"
          data-testid="translatedtext-2nxr"
        />
      }
      locationGroupLabel={
        <TranslatedText
          stringId="general.localisedField.locationGroupId.label"
          fallback="Area"
          data-testid="translatedtext-lqc7"
        />
      }
      {...props}
    />
  );
});

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
      <Text {...props} data-testid="text-voq8">
        <TranslatedText
          stringId="location.availability.reserved.message"
          fallback="This location is reserved by another patient. Please ensure the bed is available before confirming."
          data-testid="translatedtext-location-reserved"
        />
      </Text>
    );
  }

  if (status === LOCATION_AVAILABILITY_STATUS.OCCUPIED) {
    return (
      <Text {...props} data-testid="text-heyi">
        <TranslatedText
          stringId="location.availability.occupied.message"
          fallback="This location is occupied by another patient. Please ensure the bed is available before confirming."
          data-testid="translatedtext-location-occupied"
        />
      </Text>
    );
  }

  return null;
};
