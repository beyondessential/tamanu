import React from 'react';
import { Text, StyleSheet } from 'react-native';

const App = () => {
  return (
    <>
      <Text style={styles.center}>Tamanu app</Text>
    </>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
