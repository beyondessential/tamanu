# Tamanu Mobile App

This is the Tamanu App Repository.

- [install](#Install)
  - [Installing dependencies](#Installing-dependencies)
  - [Making Project runnable](#making-Project-runnable)
    - [Xcode](#Xcode)
    - [Android Studio](#Android-Studio)
- [Running](#Running)
  - [Run metro bundler](#Run-metro-bundler)
  - [Run storybook](#Run-storybook)
- [Emulator Command Hints](#Emulator-Command-Hints)
  - [IOS](#IOS)
  - [Android](#Android)
- [Generate apk or ipa](#Generate-apk-and-ipa)
  - [Generate Android build](#Android)
  - [Generate IOS build](#IOS)
- [Run MockServer](#Run-Mockserver)
- [Base App Structure](#Base-app-structure)
  - [Configuration files](#File-configurations)

## Install

### Installing dependencies

After downloading or cloning into your local machine, open a console window in the project structure and run yarn to install the dependencies:

```
yarn
```

If you are about to use IOS simulators you will also need to go into the `ios` folder and install the dependencies:

```
cd ios && pod install
```

### Configure environment

```
cp .sampleenv .env
```

### Making Project runnable

#### Xcode

Open the project .workspace file inside the ios folder with your xcode and after it succesfully opens wait to check if there are any errors.

#### Android Studio

Open Android Studio and select to "Open an existing Android Studio project" and then choose the android file inside the tamanu App folder.
Why for it to link and build.

## Running

Open your console/terminal in the project folder

Be sure to have [Xcode](https://apps.apple.com/br/app/xcode/id497799835?marginTop=12) and/or [Android Studio](https://www.google.com/search?q=android+studio&oq=android+studio&aqs=chrome..69i57j69i60l2j69i65l2j69i60.1366j0j4&sourceid=chrome&ie=UTF-8) installed in your computer.

### Run emulator

```
yarn android
```

### Run metro bundler

The metro-bundler works with watchman to reload stuff into the device or emulator and show up updates during development.
First start the metro bundler with the command:

```
yarn start
```

### Run storybook

Storybook is our default component library which helps us checking the behavior and styles of components in an isolated environment.

To run storybook:
1. Have your emulator running
1. Have your app running (metro bundler)
1. Open the dev menu and press `Toggle Storybook`

You can also run `yarn storybook-web-ui` for a little nicer experience.

## Emulator Command Hints

### IOS

- super + R = reloads app
- super + D = open debugger settings

### Android

- super + M = open debugger settings
- super + R = reloads app

## Generate apk or ipa

Generate .apk or .ipa files

### Generate Android build

To generate android apk file run:

```
yarn build:android
```

The builded app will be in:

```
tamanu-mobile/android/app/build/outputs/apk/release/app-release.apk
```

## Debugging 

The tamanu app has 2 integrations for debugging: 

- [Flipper](https://fbflipper.com/)
- [Reactotron](https://infinite.red/reactotron)

Flipper allow us to track database changes in sqlite files, and Reactotron has a better UI for checking state changes and internet api calls.

All you have to do is download the tools and open them while running while development and it will automatically syncs to the program and show you the updates.

#### Distribute

1. upload file in diawi.com
2. share app with the team!

### Generate IOS build

To generate ios .ipa file:

Run react-native to a device:

```
react-native run-ios --device "Max's iPhone"
```

This will generate an IOS build in

```
tamanu-mobile/ios/build/tamanuapp/Build/Products/Release-iphoneos
```

### Run MockServer

To run the mock server correctly check the current local ip you have on your machine and replace it on the mockserver command in package.json

#### Distribute

In the previous path you will be the "tamanuapp.app" we can:

1. Create a Payload folder
2. copy tamanuapp.app into Payload folder.
3. compress the Payload folder
4. Change the compressed file extension from .zip to .ipa
5. upload file in diawi.com
6. share app with the team!

### Base-app-structure

#### File configurations
App configuration files

| React Native  |   |
|---|---|
| .metro.config.js | RN file bundler |
| app.json | App name and display name |

| Jest  |   |
|---|---|
| jest-unit-config.js | Configuration for unit tests. Unit tests has a .spec extension |
| jest-integration-config.js | Configuration for integration tests. Integration tests has a .test extension |


Environment:

This project uses [react-native-config](https://github.com/luggit/react-native-config) for embedding env variables to android and ios. 
Whenever we change the value of a env file variable we have to run the build process again so changes can take effect.

To change which env file bundled into release make changes into:
```
android/app/build.gradle
```

```
project.ext.envConfigFiles = [
    debug: ".env",
    release: ".env.production",
]
apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"
```

|   |   |
|---|---|
| .env | environment variables that will be inserted into the app. If any change required build the app again. |
| .sampleenv | environment variables example file |

Typescript:

|   |   |
|---|---|
| tsconfig.json | typescript configuration and path aliases for smaller module imports. |

Git related configurations:

|   |   |
|---|---|
| .huskyrc | pre commit and push configuration scripts |
| .lintstagedrc |  scripts to run in stagged files when commit |

#### Folders
App folder structure:

|   |   |
|---|---|
| App  | user interface components, navigation and ddd folders |
| storybook  | Storybook folder with configuration files. |
| e2e  |  End to end testing with detox  |
| mockserver | firebase functions to mock remote server   |
| android | Gradle configuration, debug signing key  |
| ios | Pods (cocoa-pods) installed. Some RN libraries require a native syncing that is done by running "pod install" in this folder. |
| scripts | scripts for workarounds and  |
| _mocks_ | fixed mocks for jest test runner  |

### App center builds
To make a release build of a branch (useful for debugging issues or demoing a feature), go to the 
[branches page in App Center](https://appcenter.ms/orgs/Beyond-Essential/apps/Tamanu-Mobile/build/branches), navigate to your branch, 
hit the arrow beside configure then "clone from existing configuration", choose dev, and hit build. Make sure you remove the config when 
you're done, or your branch will be built on every push.
