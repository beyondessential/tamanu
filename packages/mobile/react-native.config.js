const path = require('path');

const datetimepickerRoot = path.join(
  __dirname,
  'node_modules/@react-native-community/datetimepicker',
);
const datetimepickerAndroid = path.join(datetimepickerRoot, 'android');

const configRoot = path.join(__dirname, 'node_modules/react-native-config');
const configAndroid = path.join(configRoot, 'android');

/**
 * Packages that extend BaseReactPackage are not detected by the RN CLI autolinker.
 * Declare them manually so Gradle runs codegen and registers their TurboModules.
 */
module.exports = {
  dependencies: {
    'react-native-config': {
      root: configRoot,
      platforms: {
        android: {
          sourceDir: configAndroid,
          packageImportPath: 'import com.lugg.RNCConfig.RNCConfigPackage;',
          packageInstance: 'new RNCConfigPackage()',
          libraryName: 'RNCConfigSpec',
          componentDescriptors: [],
          cmakeListsPath: path.join(
            configAndroid,
            'build/generated/source/codegen/jni/CMakeLists.txt',
          ),
        },
      },
    },
    '@react-native-community/datetimepicker': {
      root: datetimepickerRoot,
      platforms: {
        android: {
          sourceDir: datetimepickerAndroid,
          packageImportPath:
            'import com.reactcommunity.rndatetimepicker.RNDateTimePickerPackage;',
          packageInstance: 'new RNDateTimePickerPackage()',
          libraryName: 'RNDateTimePickerCGen',
          componentDescriptors: [],
          cmakeListsPath: path.join(
            datetimepickerAndroid,
            'build/generated/source/codegen/jni/CMakeLists.txt',
          ),
        },
      },
    },
  },
};
