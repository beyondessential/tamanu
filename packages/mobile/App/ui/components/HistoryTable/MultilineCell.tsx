// Adapted from https://github.com/callstack/react-native-paper/blob/6116bfe4b4cbfbc16fa0c5ff188d2bc38ce57884/src/components/DataTable/DataTableCell.tsx (MIT licensed)
//
// Multiline cells aren't Material Design compliant, see:
// - https://callstack.github.io/react-native-paper/data-table-cell.html
// - https://github.com/callstack/react-native-paper/issues/2381

import * as React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { $RemoveChildren } from 'react-native-paper/src/types';

type Props = $RemoveChildren<typeof TouchableRipple> & {
  /**
   * Content of the `MultilineCell`.
   */
  children: React.ReactNode;
  /**
   * Align the text to the right. Generally monetary or number fields are aligned to right.
   */
  numeric?: boolean;
  /**
   * Function to execute on press.
   */
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const MultilineCell = ({ children, style, numeric, ...rest }: Props) => (
  <TouchableRipple
    {...rest}
    style={[styles.container, numeric && styles.right, style]}
  >
    <Text accessibilityComponentType={undefined} accessibilityTraits={undefined}>{children}</Text>
  </TouchableRipple>
);

MultilineCell.displayName = 'MultilineCell';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  right: {
    justifyContent: 'flex-end',
  },
});

export default MultilineCell;
