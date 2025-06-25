/*
 * Tamanu
 * Copyright (c) 2017 - 2022 Beyond Essential Systems Pty Ltd
 */

import { createTheme } from '@material-ui/core/styles';
import { createGlobalStyle } from 'styled-components';
import { themeConfig, globalStyles } from '@tamanu/shared/ui/theme';

// Global styles component
export const GlobalStyles = createGlobalStyle`
  ${globalStyles}
`;

export const theme = createTheme(themeConfig);
