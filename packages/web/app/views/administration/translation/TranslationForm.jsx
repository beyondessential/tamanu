import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as yup from 'yup';
import { omit, sortBy } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Box, Tooltip } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { toast } from 'react-toastify';
import HelpIcon from '@material-ui/icons/HelpOutlined';
import {
  REFERENCE_DATA_TRANSLATION_PREFIX,
  DEFAULT_LANGUAGE_CODE,
  COUNTRY_CODE_STRING_ID,
  LANGUAGE_NAME_STRING_ID,
} from '@tamanu/constants';
import { useApi } from '../../../api';
import { TextField, Form, Button, TranslatedText, Field } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { SearchInput, TableFormFields } from '../../../components';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { ReferenceDataSwitchInput } from './ReferenceDataSwitch';
import { ThemedTooltip } from '../../../components/Tooltip';

const Container = styled.div`
  padding: 30px;
  min-height: 0;
  form {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
`;

const StyledTableFormFields = styled(TableFormFields)`
  thead tr th {
    text-align: left;
  }
  td {
    overflow: clip;
    text-overflow: ellipsis;
  }
`;

const ReservedText = styled.p`
  color: ${Colors.primary};
  margin-right: 6px;
  font-weight: 500;
  font-size: 14px;
`;

const SearchArea = styled.div`
  display: flex;
  flex: 1;
  align-items: flex-end;
`;

const StyledSearchInput = styled(SearchInput)`
  width: 340px;
`;

/**
 *
 * `values` is an object of existing, and new values
 *
 * existing value: { [stringId]: { en: Radiology } }
 * new value: { [randomString]: { stringId: [stringId], en: Radiology } }
 *
 */
const validationSchema = yup.lazy(values => {
  const existingStringIds = new Set(); // Use to check if a new id clashes with an existing id
  const numNewIdsByStringId = {}; // Use to check if any new ids clash with each other

  const existingStringValidator = yup.object(); // No real validation needed as existing keys cannot change
  const newStringValidator = yup.object({
    stringId: yup
      .string()
      .required('Required')
      .test(
        'isUnique',
        'Must be unique',
        value => !existingStringIds.has(value) && numNewIdsByStringId[value] === 1, // id does not already exist AND is unique among new ids
      ),
  });

  const validator = yup.object().shape(
    Object.fromEntries(
      Object.entries(values).map(([key, value]) => {
        // New entry
        if (value.stringId) {
          const { stringId } = value;
          numNewIdsByStringId[stringId] = (numNewIdsByStringId[stringId] || 0) + 1;
          return [key, newStringValidator];
        }

        // Existing entry
        existingStringIds.add(key);
        return [key, existingStringValidator];
      }),
    ),
  );

  return validator;
});

const useTranslationQuery = () => {
  const api = useApi();
  return useQuery(['translation'], () => api.get(`admin/translation`));
};

const useTranslationMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation(payload => api.put('admin/translation', payload), {
    onSuccess: response => {
      const newStringIds = response?.data?.length;
      toast.success(
        <span>
          <TranslatedText
            stringId="admin.translation.notification.translationsSaved"
            fallback="Translations saved"
            data-testid="translatedtext-dg1v"
          />
          {newStringIds ? (
            <>
              {', '}
              <TranslatedText
                stringId="admin.translation.notification.newStringIdCreated"
                fallback={`Created ${newStringIds} new translated string entries`}
                replacements={{ newStringIds }}
                data-testid="translatedtext-aw7k"
              />
            </>
          ) : (
            ''
          )}
        </span>,
      );
      queryClient.invalidateQueries(['translation']);
    },
    onError: err => {
      toast.error(
        <TranslatedText
          stringId="admin.translation.notification.savingFailed"
          fallback={`Error saving translations: ${err.message}`}
          replacements={{ message: err.message }}
          data-testid="translatedtext-8708"
        />,
      );
    },
  });
};

const TranslationField = ({ stringId, code }) => (
  <Field
    name={`['${stringId}']['${code}']`}
    component={TextField}
    multiline
    data-testid="accessorfield-e12n"
  />
);

// Saving doesn't track `isSubmitting` correctly because there is a custom mutation handling
// the submit, so we need to track it manually
// When the form starts saving, isSubmitting will be set to true, but it will be set to false
// before the formik form is actually reset
// Detect when the formik form is reset by checking if it is no longer dirty
const useIsSaving = (isSubmitting, dirty) => {
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (isSubmitting) setIsSaving(true);
  }, [isSubmitting]);
  useEffect(() => {
    if (isSaving && !dirty) setIsSaving(false);
  }, [isSaving, dirty]);
  return [isSaving];
};

export const FormContents = ({ data, languageNames, isSubmitting, submitForm, dirty }) => {
  const [searchValue, setSearchValue] = useState('');
  const [includeReferenceData, setIncludeReferenceData] = useState(false);
  const [isSaving] = useIsSaving(isSubmitting, dirty);

  const handleSave = event => {
    // Reset search so any validation errors are visible
    setSearchValue('');
    submitForm(event);
  };

  const columns = useMemo(
    () => [
      {
        key: 'stringId',
        title: (
          <Box display="flex" alignItems="center" data-testid="box-362c">
            <TranslatedText
              stringId="admin.translation.table.column.translationId"
              fallback="Translation ID"
              data-testid="translatedtext-cwdl"
            />
          </Box>
        ),
        accessor: ({ stringId }) => {
          if (stringId === LANGUAGE_NAME_STRING_ID || stringId === COUNTRY_CODE_STRING_ID)
            return (
              <Box display="flex" alignItems="center" data-testid="box-40cb">
                <ReservedText data-testid="reservedtext-e0pc">{stringId}</ReservedText>
                <Tooltip
                  title={
                    <>
                      {stringId === LANGUAGE_NAME_STRING_ID && (
                        <TranslatedText
                          stringId="admin.translation.table.languageName.toolTip"
                          fallback="Language name is a reserved translation ID used for displaying language in selector"
                          data-testid="translatedtext-rxfz"
                        />
                      )}
                      {stringId === COUNTRY_CODE_STRING_ID && (
                        <TranslatedText
                          stringId="admin.translation.table.countryCode.toolTip"
                          fallback="Country code is a reserved translation ID used for displaying the country flag the language selector. This should be set to a valid ISO 3166-1 alpha-2 country code."
                          data-testid="translatedtext-yt19"
                        />
                      )}
                    </>
                  }
                  data-testid="tooltip-brb2"
                >
                  <HelpIcon style={{ color: Colors.primary }} data-testid="helpicon-py2n" />
                </Tooltip>
              </Box>
            );
          return (
            <ThemedTooltip title={stringId} data-testid="tooltip-brb2">
              <span>{stringId}</span>
            </ThemedTooltip>
          );
        },
      },
      {
        key: DEFAULT_LANGUAGE_CODE,
        title: (
          <TranslatedText
            stringId="admin.translation.table.column.default"
            fallback="Default"
            data-testid="translatedtext-cwdl"
          />
        ),
        accessor: row => `${row[DEFAULT_LANGUAGE_CODE]}`,
      },
      ...Object.keys(omit(data[0], ['stringId', DEFAULT_LANGUAGE_CODE])).map(code => ({
        key: code,
        title: languageNames[code] || code,
        accessor: row => (
          <TranslationField code={code} {...row} data-testid={`translationfield-xrew-${code}`} />
        ),
      })),
    ],
    [data, languageNames],
  );

  const tableRows = useMemo(() => {
    const includedTranslations = includeReferenceData
      ? data
      : data.filter(row => !row.stringId.startsWith(REFERENCE_DATA_TRANSLATION_PREFIX));

    if (searchValue) {
      return includedTranslations.filter(row =>
        // Search from start of stringId or after a . delimiter
        row.stringId.match(new RegExp(`(?:^|\\.)${searchValue.replace('.', '\\.')}`, 'i')),
      );
    }
    return includedTranslations;
  }, [data, includeReferenceData, searchValue]);

  if (data.length === 0)
    return (
      <Alert severity="info" data-testid="alert-yx67">
        Please load in translations using the reference data importer to activate this tab
      </Alert>
    );

  return (
    <>
      <Box display="flex" alignItems="flex-end" mb={2} data-testid="box-bfr9">
        <SearchArea data-testid="searcharea-1yo4">
          <StyledSearchInput
            label={
              <TranslatedText
                stringId="general.action.search"
                fallback="Search"
                data-testid="translatedtext-iba8"
              />
            }
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onClear={() => setSearchValue('')}
            data-testid="styledsearchinput-l73m"
          />
          <ReferenceDataSwitchInput
            value={includeReferenceData}
            onChange={() => setIncludeReferenceData(!includeReferenceData)}
            label={
              <TranslatedText
                stringId="admin.translation.showReferenceData"
                fallback="Show reference data"
                data-testid="translatedtext-pqyl"
              />
            }
            data-testid="referencedataswitchinput-80o1"
          />
        </SearchArea>
        <Button disabled={isSaving || !dirty} onClick={handleSave} data-testid="button-a3nd">
          <TranslatedText
            stringId="general.action.saveChanges"
            fallback="Save changes"
            data-testid="translatedtext-umrz"
          />
        </Button>
      </Box>
      <StyledTableFormFields
        columns={columns}
        data={tableRows}
        pagination
        stickyHeader
        data-testid="styledtableformfields-y4iq"
      />
    </>
  );
};

export const TranslationForm = () => {
  const { data = {}, error, isLoading } = useTranslationQuery();
  const { translations = [], languageNames = {} } = data;
  const { mutate: saveTranslations } = useTranslationMutation();

  const initialValues = useMemo(() => {
    const values = {};
    for (const { stringId, ...rest } of translations) {
      values[stringId] = rest;
    }
    return values;
  }, [translations]);

  const handleSubmit = async payload => {
    const submitData = Object.fromEntries(
      Object.entries(payload).map(([key, { stringId, ...rest }]) => [stringId || key, rest]),
    );
    saveTranslations(submitData);
  };

  if (isLoading) return <LoadingIndicator data-testid="loadingindicator-ka7i" />;
  if (error)
    return (
      <ErrorMessage
        title={
          <TranslatedText
            stringId="admin.translation.error.loadTranslations"
            fallback="Error: Could not load translations:"
            data-testid="translatedtext-sh00"
          />
        }
        error={error}
        data-testid="errormessage-mltv"
      />
    );

  const sortedTranslations = sortBy(
    translations,
    obj => obj.stringId !== LANGUAGE_NAME_STRING_ID && obj.stringId !== COUNTRY_CODE_STRING_ID,
  ); // Ensure languageName and countryCode stays on top

  return (
    <Container data-testid="container-v9eo">
      <Form
        initialValues={initialValues}
        enableReinitialize
        showInlineErrorsOnly
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
        render={props => (
          <FormContents
            {...props}
            data={sortedTranslations}
            languageNames={languageNames}
            data-testid="formcontents-s4pk"
          />
        )}
        data-testid="form-zsv6"
      />
    </Container>
  );
};
