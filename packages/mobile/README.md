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

### Making Project runnable

#### Xcode

Open the project .workspace file inside the ios folder with your xcode and after it succesfully opens wait to check if there are any errors.

#### Android Studio

Open Android Studio and select to "Open an existing Android Studio project" and then choose the android file inside the tamanu App folder.
Why for it to link and build.

## Running

Open your console/terminal in the project folder

Be sure to have [Xcode](https://apps.apple.com/br/app/xcode/id497799835?marginTop=12) and/or [Android Studio](https://www.google.com/search?q=android+studio&oq=android+studio&aqs=chrome..69i57j69i60l2j69i65l2j69i60.1366j0j4&sourceid=chrome&ie=UTF-8) installed in your computer.

### Run metro bundler

The metro-bundler works with watchman to reload stuff into the device or emulator and show up updates during development.
First start the metro bundler with the command:

```
yarn start
```

### Run storybook

Storybook is our default component library which helps us checking the behavior and styles of components in an isolated environment.
Be sure to have and Emulator/Simulator open and then Run it by using the following commands:

```
yarn run storybook
```

Now run the metro-bundler

```
yarn start
```

And at last run the app:

```
react-native run-ios
```

or for android:

```
react-native run-android
```

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

#### Distribute

In the previous path you will be the "tamanuapp.app" we can:

1. Create a Payload folder
2. copy tamanuapp.app into Payload folder.
3. compress the Payload folder
4. Change the compressed file extension from .zip to .ipa
5. upload file in diawi.com
6. share app with the team!
