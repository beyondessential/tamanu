import React, { useState } from 'react';
import styled from 'styled-components';
import { IconButton, Menu } from '@material-ui/core';
import { Launch, MoreVert } from '@material-ui/icons';
import { TranslatedText } from '../Translation/TranslatedText';
import { ChangeLanguageModal } from '../ChangeLanguageModal';
import { useTranslationLanguagesQuery } from '../../api/queries';
import { useLocalisation } from '../../contexts/Localisation';
import { Colors } from '../../constants';

const SupportDesktopLink = styled.a`
  margin-top: 4px;
  font-weight: 400;
  font-size: 11px;
  line-height: 15px;
  text-decoration: underline;
  color: ${Colors.white};
`;

const KebabMenuItem = styled.div`
  font-weight: 400;
  font-size: 11px;
  line-height: 15px;
  color: ${Colors.white};
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  :hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const StyledIconButton = styled(IconButton)`
  color: white;
  align-self: start;
  position: relative;
  right: -22px;
`;

const StyledMenu = styled(Menu)`
  & .MuiPaper-root {
    border: 1px solid ${Colors.outline};
    background: ${Colors.primaryDark};
    width: 124px;
  }
  & .MuiList-padding {
    padding: 4px;
  }
`;

export const KebabMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isChangingLanguage, setChangingLanguage] = useState(false);
  const open = Boolean(anchorEl);
  const { data = {} } = useTranslationLanguagesQuery();
  const { getLocalisation } = useLocalisation();
  const { languageDisplayNames, languagesInDb = [] } = data;

  const languageOptions = languagesInDb.map(language => {
    return {
      label: languageDisplayNames[language],
      value: language,
    };
  });

  const onOpenKebabMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseKebabMenu = () => {
    setAnchorEl(null);
  };

  const handleChangingLanguage = () => {
    setChangingLanguage(true);
    handleCloseKebabMenu();
  };

  const supportUrl = getLocalisation('supportDeskUrl');

  return (
    <>
      <StyledIconButton onClick={onOpenKebabMenu} data-testid="stylediconbutton-5r5o">
        <MoreVert data-testid="morevert-d4hb" />
      </StyledIconButton>
      <StyledMenu
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseKebabMenu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        data-testid="styledmenu-6dkz"
      >
        {/* If multiple languages not implemented, no need for the modal to show */}
        {languageOptions.length > 1 && (
          <KebabMenuItem onClick={handleChangingLanguage} data-testid="kebabmenuitem-vwvy">
            <TranslatedText
              stringId="general.language.change"
              fallback="Change language"
              data-testid="translatedtext-jn0h"
            />
          </KebabMenuItem>
        )}
        <KebabMenuItem onClick={handleCloseKebabMenu} data-testid="kebabmenuitem-ukga">
          <SupportDesktopLink
            href={supportUrl}
            target="_blank"
            rel="noreferrer"
            data-testid="supportdesktoplink-znl3"
          >
            <TranslatedText
              stringId="externalLink.supportCentre"
              fallback="Support centre"
              data-testid="translatedtext-l474"
            />
            <Launch style={{ marginLeft: '5px', fontSize: '12px' }} data-testid="launch-k5vs" />
          </SupportDesktopLink>
        </KebabMenuItem>
      </StyledMenu>
      <ChangeLanguageModal
        width="xs"
        open={isChangingLanguage}
        onClose={() => setChangingLanguage(false)}
        data-testid="changelanguagemodal-mgtk"
      />
    </>
  );
};
