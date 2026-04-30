import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import TuneIcon from '@mui/icons-material/Tune';
import React, { useCallback, useMemo, useState } from 'react';
import { Outlet, useMatch, useNavigate, useOutletContext } from 'react-router';
import styled from 'styled-components';

import { TAMANU_COLORS, TranslatedText } from '@tamanu/ui-components';
import { TabDisplay } from '../../../../components/TabDisplay';
import { Colors } from '../../../../constants/styles';
import { AdminViewContainer, ContentContainer } from '../../components/AdminViewContainer';
import { ImporterView } from '../../components/ImporterView';
import { ProgramExporterView } from '../../components/ProgramExporterView';
import { Article } from '../components';

/**
 * Eventually, all {@link ContentContainer}s should use {@link TAMANU_COLORS.background2}. This
 * component exists merely to preserve existing behaviour.
 */
const StyledArticle = styled(Article)`
  ${ContentContainer}:has(&) {
    background-color: ${TAMANU_COLORS.white};
  }
`;

const StyledTabDisplay = styled(TabDisplay)`
  border-block-end: 1px solid ${Colors.outline};
  padding-inline: 20px;
`;

const TabKey = /** @type {const} */ ({
  Manage: 'manage',
  Import: 'import',
  Export: 'export',
});

const manageTab = /** @type {const} */ ({
  label: <TranslatedText stringId="admin.programs.tab.manage" fallback="Manage" />,
  key: TabKey.Manage,
  icon: <TuneIcon />,
});

export function ProgramsImportTab() {
  const { setIsLoading } = useOutletContext();

  return (
    <StyledArticle data-testid="tabcontainer-g2le">
      <ImporterView
        endpoint="program"
        setIsLoading={setIsLoading}
        data-testid="importerview-0cyu"
      />
    </StyledArticle>
  );
}

export function ProgramsExportTab() {
  const { setIsLoading } = useOutletContext();

  return (
    <StyledArticle data-testid="tabcontainer-za63">
      <ProgramExporterView setIsLoading={setIsLoading} data-testid="programexporterview-mazu" />
    </StyledArticle>
  );
}

export const ProgramsAdminView = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const isExportRoute = Boolean(useMatch('/admin/programs/forms/export'));
  const isImportRoute = Boolean(useMatch('/admin/programs/forms/import'));

  const currentTab = (() => {
    if (isImportRoute) return 'import';
    if (isExportRoute) return 'export';
    return 'manage';
  })();

  const renderTabContent = useCallback(() => <Outlet context={{ setIsLoading }} />, [setIsLoading]);

  const tabs = useMemo(
    () => [
      { ...manageTab, render: renderTabContent },
      {
        label: 'Import',
        key: TabKey.Import,
        icon: <LoginIcon />,
        render: renderTabContent,
      },
      {
        label: 'Export',
        key: TabKey.Export,
        icon: <LogoutIcon />,
        render: renderTabContent,
      },
    ],
    [renderTabContent],
  );

  const onTabSelect = key => {
    if (key === currentTab) return;
    if (key === 'manage') {
      navigate('/admin/programs/forms/manage');
      return;
    }
    if (key === 'import') {
      navigate('/admin/programs/forms/import');
      return;
    }
    if (key === 'export') {
      navigate('/admin/programs/forms/export');
    }
  };

  return (
    <AdminViewContainer
      aria-busy={isLoading}
      title={
        <TranslatedText
          stringId="admin.program.title"
          fallback="Programs (aka forms)"
          data-testid="translatedtext-52ok"
        />
      }
      showLoadingIndicator={isLoading}
      data-testid="adminviewcontainer-w2w4"
    >
      <StyledTabDisplay
        tabs={tabs}
        currentTab={currentTab}
        onTabSelect={onTabSelect}
        scrollable={false}
        data-testid="styledtabdisplay-gnxw"
      />
    </AdminViewContainer>
  );
};
