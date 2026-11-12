import React, { useState } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router';
import { Menu } from 'lucide-react';
import { useTranslation } from '@tamanu/ui-components';
import { useCurrentUser } from '@routes/PrivateRoute';
import { MainMenu } from './MainMenu';
import tamanuLogoBlue from '../../assets/images/tamanu_logo_blue.svg';

const HeaderBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--pf-surface);
  border-bottom: var(--pf-border) solid var(--pf-outline);
`;

const HeaderContent = styled.div`
  max-width: 640px;
  height: 56px;
  margin: 0 auto;
  padding: 0 8px 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  img {
    display: block;
    height: 32px;
  }
`;

const MenuButton = styled.button.attrs({ type: 'button' })`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 12px;
  background: none;
  color: var(--pf-primary);
  cursor: pointer;

  &:active {
    background: var(--pf-option);
  }
`;

export const PageHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { firstName, lastName } = useCurrentUser();
  const { getTranslation } = useTranslation();

  return (
    <HeaderBar>
      <HeaderContent>
        <Link to="/">
          <img src={tamanuLogoBlue} alt={getTranslation('patientPortal.home', 'Home')} />
        </Link>
        <MenuButton
          aria-label={getTranslation('patientPortal.menu.open', 'Open menu')}
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu aria-hidden />
        </MenuButton>
      </HeaderContent>
      <MainMenu
        open={isMenuOpen}
        userName={`${firstName} ${lastName}`}
        onClose={() => setIsMenuOpen(false)}
      />
    </HeaderBar>
  );
};
