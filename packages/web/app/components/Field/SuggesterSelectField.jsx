import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { unionBy } from 'lodash';

import { useApi } from '../../api';
import { SelectInput } from './SelectField';
import { MultiselectInput } from './MultiselectField';
import { getCurrentLanguageCode } from '../../utils/translation';
import { useAuth } from '../../contexts/Auth';

export const SuggesterSelectField = React.memo(
  ({
    field,
    endpoint,
    selectedFacilityId,
    filterByFacility,
    isMulti = false,
    initialOptions: staticInitialOptions = [],
    ...props
  }) => {
    const { facilityId } = useAuth();
    const api = useApi();
    const [options, setOptions] = useState([]);
    const [initialOptions, setInitialOptions] = useState(staticInitialOptions);

    // We need this hook to fetch the label of the current value beside the other useEffect hooks to fetch all of the options.
    // This is because the 2nd useEffect hooks will only fetch options available in the current facility,
    // and the current value may belong to a different facility.
    useEffect(() => {
      // If a value is set, fetch the record to display it's name
      if (field.value) {
        let values;
        if (isMulti) {
          values = Array.isArray(field.value) ? field.value : JSON.parse(field.value);
        } else {
          values = [field.value];
        }

        for (const value of values) {
          api
            .get(`suggestions/${encodeURIComponent(endpoint)}/${encodeURIComponent(value)}`, {
              language: getCurrentLanguageCode(),
            })
            .then(({ id, name }) => {
              setInitialOptions(
                unionBy(
                  options,
                  [
                    {
                      value: id,
                      label: name,
                    },
                  ],
                  'value',
                ),
              );
              setOptions(initialOptions);
            });
        }
      }

      // Only do the fetch when the component first mounts
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      api
        .get(`suggestions/${encodeURIComponent(endpoint)}/all`, {
          facilityId: selectedFacilityId || facilityId,
          filterByFacility,
          language: getCurrentLanguageCode(),
        })
        .then(resultData => {
          setOptions(
            unionBy(
              initialOptions,
              resultData.map(({ id, name }) => ({
                value: id,
                label: name,
              })),
              'value',
            ),
          );
        });
    }, [api, setOptions, endpoint, filterByFacility, selectedFacilityId, facilityId]);

    const baseProps = {
      name: field.name,
      onChange: field.onChange,
      value: field.value,
      options,
    };

    return isMulti ? (
      <MultiselectInput {...baseProps} {...props} />
    ) : (
      <SelectInput {...baseProps} {...props} />
    );
  },
);

SuggesterSelectField.propTypes = {
  endpoint: PropTypes.string.isRequired,
  field: PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
};
