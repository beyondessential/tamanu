import { useEffect, useState } from 'react';
import { useApi } from '../api';
import { useAuth } from '../contexts/Auth';
import { getCurrentLanguageCode } from '../utils/translation';
import { unionBy } from 'lodash';

export const useSuggesterOptions = ({
  field,
  endpoint,
  baseQueryParameters,
  filterByFacility,
  baseOptions,
  isMulti,
}) => {
  const { facilityId } = useAuth();
  const api = useApi();
  const [options, setOptions] = useState([]);
  const [initialOptions, setInitialOptions] = useState(baseOptions);

  useEffect(() => {
    if (field.value) {
      const values = isMulti
        ? Array.isArray(field.value)
          ? field.value
          : JSON.parse(field.value)
        : [field.value];

      values.forEach((value) => {
        api
          .get(`suggestions/${encodeURIComponent(endpoint)}/${encodeURIComponent(value)}`, {
            language: getCurrentLanguageCode(),
          })
          .then(({ id, name }) => {
            setInitialOptions((prev) => [...prev, { value: id, label: name }]);
          });
      });
    }
    // Only do the fetch when the component first mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api
      .get(`suggestions/${encodeURIComponent(endpoint)}/all`, {
        facilityId,
        filterByFacility,
        language: getCurrentLanguageCode(),
        ...baseQueryParameters,
      })
      .then((resultData) => {
        setOptions(
          unionBy(
            initialOptions,
            resultData.map(({ id, name }) => ({ value: id, label: name })),
            'value',
          ),
        );
      });
  }, [api, endpoint, facilityId, filterByFacility, baseQueryParameters, initialOptions]);

  return options;
};
