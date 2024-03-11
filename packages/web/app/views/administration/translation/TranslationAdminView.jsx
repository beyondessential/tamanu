import React from 'react';
import { ContentPane, PageContainer, TopBar } from '../../../components';
import { TranslationForm } from './TranslationForm';
import { Tooltip } from '@material-ui/core';
import HelpIcon from '@material-ui/icons/HelpOutlined';
import { Colors } from '../../../constants';

const TranslationHeadingWithTooltip = () => {
  return (
    <>
      Translation editor{' '}
      <Tooltip
        title={`This tab handles what was previously called 'localisation'. Because all strings are now translatable in tamanu, 
        this means you can customise any piece of static text in the app in this list to be whatever you want. To add a new language
        or import translations in bulk, please use the reference data importer`}
      >
        <HelpIcon style={{ color: Colors.primary, fontSize: 18, marginBottom: 0 }} />
      </Tooltip>
    </>
  );
};

export const TranslationAdminView = () => {
  return (
    <PageContainer>
      <TopBar title={<TranslationHeadingWithTooltip />} />
      <ContentPane>
        <TranslationForm />
      </ContentPane>
    </PageContainer>
  );
};
