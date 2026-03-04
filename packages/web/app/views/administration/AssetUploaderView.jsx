import React, { memo, useCallback, useState } from 'react';
import * as yup from 'yup';
import { ASSET_NAME_LABELS } from '@tamanu/constants/importable';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { convertToBase64 } from '@tamanu/utils/encodings';
import { useApi, useSuggester } from '../../api';
import { Field } from '../../components/Field';
import {
  FileChooserField,
  FILTER_IMAGES,
  TranslatedSelectField,
  Form,
  LargeSubmitButton,
  ButtonRow,
  FormGrid,
} from '@tamanu/ui-components';
import { ContentPane } from '../../components/ContentPane';
import { AdminViewContainer } from './components/AdminViewContainer';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { AutocompleteField } from '../../components';

const ResultDisplay = ({ result }) => {
  if (!result) return null;

  if (result.error) {
    return <div>Error: {result.error.message}.</div>;
  }

  return (
    <div>
      Asset {result.name} successfully {result.action}.
    </div>
  );
};

export const AssetUploaderView = memo(() => {
  const [resetKey, setResetKey] = useState(Math.random());
  const [result, setResult] = useState(null);

  const api = useApi();
  const facilitySuggester = useSuggester('facility');

  const onSubmitUpload = useCallback(
    async ({ file, name, facilityId }) => {
      setResult(null);

      try {
        const filename = file.name;
        const data = await convertToBase64(file);
        const response = await api.put(`admin/asset/${name}`, {
          filename,
          data,
          facilityId,
        });

        setResult(response);
        setResetKey(Math.random());
      } catch (e) {
        setResult({
          action: 'error',
          error: e,
        });
      }
    },
    [api, setResult, setResetKey],
  );

  return (
    <Form
      key={resetKey}
      formType={FORM_TYPES.CREATE_FORM}
      onSubmit={onSubmitUpload}
      validationSchema={yup.object().shape({
        name: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="asset.validation.name.path"
              fallback="Asset name"
              data-testid="translatedtext-2hxu"
            />,
          ),
        file: yup
          .string()
          .required(
            <TranslatedText
              stringId="general.file.label"
              fallback="File"
              data-testid="translatedtext-ycx1"
            />,
          ),
      })}
      render={({ isSubmitting }) => (
        <AdminViewContainer
          title="Asset upload"
          showLoadingIndicator={isSubmitting}
          data-testid="adminviewcontainer-hr7o"
        >
          <ContentPane data-testid="contentpane-411j">
            <FormGrid columns={1} data-testid="formgrid-zaox">
              <Field
                component={TranslatedSelectField}
                enumValues={ASSET_NAME_LABELS}
                label={
                  <TranslatedText
                    stringId="asset.name.label"
                    fallback="Select asset"
                    data-testid="translatedtext-ybv1"
                  />
                }
                name="name"
                required
                data-testid="field-jmah"
              />
              <Field
                component={FileChooserField}
                filters={[FILTER_IMAGES]}
                label={
                  <TranslatedText
                    stringId="asset.file.label"
                    fallback="Select file"
                    data-testid="translatedtext-h8lv"
                  />
                }
                name="file"
                required
                data-testid="field-g8gn"
              />
              <Field
                name="facilityId"
                label={
                  <TranslatedText
                    stringId="general.facility.label"
                    fallback="Facility"
                    data-testid="translatedtext-yaxi"
                  />
                }
                component={AutocompleteField}
                suggester={facilitySuggester}
                data-testid="field-fnmm"
              />
              <ButtonRow data-testid="buttonrow-07rz">
                <LargeSubmitButton
                  text={
                    <TranslatedText
                      stringId="general.action.import"
                      fallback="Import"
                      data-testid="translatedtext-08ti"
                    />
                  }
                  data-testid="largesubmitbutton-oizs"
                />
              </ButtonRow>
              <ResultDisplay result={result} data-testid="resultdisplay-a96v" />
            </FormGrid>
          </ContentPane>
        </AdminViewContainer>
      )}
      data-testid="form-f4c8"
    />
  );
});
