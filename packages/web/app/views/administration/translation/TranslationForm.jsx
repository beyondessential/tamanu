import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as yup from 'yup';
import { omit, sortBy } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Box, Tooltip } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { toast } from 'react-toastify';
import HelpIcon from '@material-ui/icons/HelpOutlined';
import { REFERENCE_DATA_TRANSLATION_PREFIX } from '@tamanu/constants';
import { useApi } from '../../../api';
import {
  ButtonRow,
  Form,
  Button,
  SearchInput,
  TableFormFields,
  TextField,
} from '../../../components';
import { AccessorField } from '../../patients/components/AccessorField';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { Colors } from '../../../constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { ReferenceDataSwitchInput } from './ReferenceDataSwitch';

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
          />
          {newStringIds ? (
            <>
              {', '}
              <TranslatedText
                stringId="admin.translation.notification.newStringIdCreated"
                fallback={`Created ${newStringIds} new translated string entries`}
                replacements={{ newStringIds }}
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
      <TranslatedText
        stringId="admin.translation.notification.savingFailed"
        fallback={`Error saving translations: ${err.message}`}
        replacements={{ message: err.message }}
      />;
    },
  });
};

const TranslationField = ({ stringId, code }) => (
  // This id format is necessary to avoid formik nesting at . delimiters
  <AccessorField id={`['${stringId}']`} name={code} component={TextField} multiline />
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
          <Box display="flex" alignItems="center">
            <TranslatedText
              stringId="admin.translation.table.column.translationId"
              fallback="Translation ID"
            />
          </Box>
        ),
        accessor: ({ stringId }) => {
          if (stringId === 'languageName')
            return (
              <Box display="flex" alignItems="center">
                <ReservedText>{stringId}</ReservedText>
                <Tooltip
                  title={
                    <TranslatedText
                      stringId="admin.translation.table.languageName.toolTip"
                      fallback="Language name is a reserved translation ID used for displaying language in selector"
                    />
                  }
                >
                  <HelpIcon style={{ color: Colors.primary }} />
                </Tooltip>
              </Box>
            );
          return stringId;
        },
      },
      ...Object.keys(omit(data[0], ['stringId'])).map(code => ({
        key: code,
        title: languageNames[code],
        accessor: row => <TranslationField code={code} {...row} />,
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
      <Alert severity="info">
        Please load in translations using the reference data importer to activate this tab
      </Alert>
    );

  return (
    <>
      <Box display="flex" alignItems="flex-end" mb={2}>
        <SearchArea>
          <StyledSearchInput
            label={<TranslatedText stringId="general.action.search" fallback="Search" />}
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onClear={() => setSearchValue('')}
          />
          <ReferenceDataSwitchInput
            value={includeReferenceData}
            onChange={() => setIncludeReferenceData(!includeReferenceData)}
            label={
              <TranslatedText
                stringId="admin.translation.showReferenceData"
                fallback="Show reference data"
              />
            }
          />
        </SearchArea>
        <ButtonRow>
          <Button disabled={isSaving || !dirty} onClick={handleSave}>
            <TranslatedText stringId="general.action.saveChanges" fallback="Save changes" />
          </Button>
        </ButtonRow>
      </Box>
      <StyledTableFormFields columns={columns} data={tableRows} pagination stickyHeader />
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
    await saveTranslations(submitData);
  };

  if (isLoading) return <LoadingIndicator />;
  if (error)
    return (
      <ErrorMessage
        title={
          <TranslatedText
            stringId="admin.translation.error.loadTranslations"
            fallback="Error: Could not load translations:"
          />
        }
        error={error}
      />
    );

  const sortedTranslations = sortBy(translations, obj => obj.stringId !== 'languageName'); // Ensure languageName key stays on top

  return (
    <Container>
      <Form
        initialValues={initialValues}
        enableReinitialize
        showInlineErrorsOnly
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
        render={props => (
          <FormContents {...props} data={sortedTranslations} languageNames={languageNames} />
        )}
      />
    </Container>
  );
};
