import React, { memo, useCallback, useState } from 'react';
import * as yup from 'yup';
import { ASSET_NAME_LABELS } from '@tamanu/constants/importable';
import { useApi } from '../../api';
import { Field, Form, TranslatedSelectField } from '../../components/Field';
import { FileChooserField, FILTER_IMAGES } from '../../components/Field/FileChooserField';
import { ContentPane } from '../../components/ContentPane';
import { FormGrid } from '../../components/FormGrid';
import { ButtonRow } from '../../components/ButtonRow';
import { LargeSubmitButton } from '../../components/Button';
import { AdminViewContainer } from './components/AdminViewContainer';
import { FORM_TYPES } from '../../constants';
import { TranslatedText } from '../../components/Translation/TranslatedText';

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

  const convertToBase64 = file =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Extract the base64 data from the data url for saving
        // See note for more details https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
        const base64Data = reader.result.split('base64,').pop();
        return resolve(base64Data);
      };
      reader.onerror = conversionError => reject(conversionError);
    });

  const onSubmitUpload = useCallback(
    async ({ file, name }) => {
      setResult(null);

      try {
        const filename = file.name;
        const data = await convertToBase64(file);
        const response = await api.put(`admin/asset/${name}`, {
          filename,
          data,
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
              data-test-id='translatedtext-nwfy' />,
          ),
        file: yup
          .string()
          .required(<TranslatedText
          stringId="general.file.label"
          fallback="File"
          data-test-id='translatedtext-rfue' />),
      })}
      render={({ isSubmitting }) => (
        <AdminViewContainer title="Asset upload" showLoadingIndicator={isSubmitting}>
          <ContentPane>
            <FormGrid columns={1}>
              <Field
                component={TranslatedSelectField}
                enumValues={ASSET_NAME_LABELS}
                label={<TranslatedText
                  stringId="asset.name.label"
                  fallback="Select asset"
                  data-test-id='translatedtext-1rmi' />}
                name="name"
                required
                data-test-id='field-w2lh' />
              <Field
                component={FileChooserField}
                filters={[FILTER_IMAGES]}
                label={<TranslatedText
                  stringId="asset.file.label"
                  fallback="Select file"
                  data-test-id='translatedtext-n2s0' />}
                name="file"
                required
                data-test-id='field-wiha' />
              <ButtonRow data-test-id='buttonrow-4jml'>
                <LargeSubmitButton
                  text={<TranslatedText
                    stringId="general.action.import"
                    fallback="Import"
                    data-test-id='translatedtext-jal5' />}
                />
              </ButtonRow>
              <ResultDisplay result={result} />
            </FormGrid>
          </ContentPane>
        </AdminViewContainer>
      )}
    />
  );
});
