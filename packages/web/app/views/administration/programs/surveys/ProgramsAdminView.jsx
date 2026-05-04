import AddIcon from '@mui/icons-material/Add';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import TuneIcon from '@mui/icons-material/Tune';
import React, { useCallback, useMemo, useState } from 'react';
import { Outlet, useMatch, useNavigate, useOutletContext } from 'react-router';
import styled from 'styled-components';

import { Button, TAMANU_COLORS, TranslatedText } from '@tamanu/ui-components';
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
  Builder: 'aiFormBuilder',
  Manage: 'manage',
  Import: 'import',
  Export: 'export',
});

const builderTab = /** @type {const} */ ({
  label: (
    <TranslatedText
      stringId="admin.programs.aiFormBuilder.tab.label"
      fallback="AI form builder"
    />
  ),
  key: TabKey.Builder,
  icon: <AddIcon />,
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
  const [hasAiFormBuilderChat, setHasAiFormBuilderChat] = useState(false);
  const [newChatRequestId, setNewChatRequestId] = useState(0);
  const navigate = useNavigate();

  const isBuilderRoute = Boolean(useMatch('/admin/programs/forms/aiFormBuilder'));
  const isExportRoute = Boolean(useMatch('/admin/programs/forms/export'));
  const isImportRoute = Boolean(useMatch('/admin/programs/forms/import'));
  const isManageRoute = Boolean(useMatch('/admin/programs/forms/manage/*'));

  const currentTab = (() => {
    if (isBuilderRoute) return TabKey.Builder;
    if (isImportRoute) return 'import';
    if (isExportRoute) return 'export';
    if (isManageRoute) return 'manage';
    return 'manage';
  })();

  const renderTabContent = useCallback(
    () => <Outlet context={{ setIsLoading, newChatRequestId, setHasAiFormBuilderChat }} />,
    [newChatRequestId, setIsLoading, setHasAiFormBuilderChat],
  );

  const tabs = useMemo(
    () => [
      { ...builderTab, render: renderTabContent },
      { ...manageTab, render: renderTabContent },
      {
        label: <TranslatedText stringId="general.action.import" fallback="Import" />,
        key: TabKey.Import,
        icon: <LoginIcon />,
        render: renderTabContent,
      },
      {
        label: <TranslatedText stringId="general.action.export" fallback="Export" />,
        key: TabKey.Export,
        icon: <LogoutIcon />,
        render: renderTabContent,
      },
    ],
    [renderTabContent],
  );

  const onTabSelect = key => {
    if (key === currentTab) return;
    if (key === TabKey.Builder) {
      navigate('/admin/programs/forms/aiFormBuilder');
      return;
    }
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
          stringId="admin.programs.forms.title"
          fallback="Forms"
          data-testid="translatedtext-52ok"
        />
      }
      titleActions={
        currentTab === TabKey.Builder && (
          <Button
            size="small"
            disabled={!hasAiFormBuilderChat}
            onClick={() => setNewChatRequestId(value => value + 1)}
          >
            <TranslatedText
              stringId="admin.programs.aiFormBuilder.newChat.action"
              fallback="New chat"
            />
          </Button>
        )
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
