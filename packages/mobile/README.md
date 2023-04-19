# Tamanu Mobile App

This is the Tamanu App Repository.

| Package | Runbook | Description |
| ------- | ------- | ----------- |
| [mobile](https://github.com/beyondessential/tamanu-mobile/) | [mobile runbook](https://beyond-essential.slab.com/posts/todo-tamanu-mobile-runbook-8vj8qceu) | The mobile app |

The rest of the Tamanu system is in [a separate monorepo](https://github.com/beyondessential/tamanu).

- [install](#Install)
  - [Installing dependencies](#Installing-dependencies)
  - [Making Project runnable](#making-Project-runnable)
    - [Android Studio](#Android-Studio)
- [Running](#Running)
  - [Run metro bundler](#Run-metro-bundler)
  - [Run storybook](#Run-storybook)
- [Emulator Command Hints](#Emulator-Command-Hints)
  - [Android](#Android)
- [Generate apk](#Generate-apk-and-ipa)
  - [Generate Android build](#Android)
- [Run MockServer](#Run-Mockserver)
- [Base App Structure](#Base-app-structure)
  - [Configuration files](#File-configurations)
  - [Migration files](#Migrations)

## Install

### Installing dependencies

After downloading or cloning into your local machine, open a console window in the project structure and run yarn to install the dependencies:

```
yarn
```

### Making Project runnable

#### Android Studio

Open Android Studio and select to "Open an existing Android Studio project" and then choose the android file inside the tamanu App folder.
Wait for it to link and build.

## Running

Open your console/terminal in the project folder

Be sure to have [Android Studio](https://www.google.com/search?q=android+studio&oq=android+studio&aqs=chrome..69i57j69i60l2j69i65l2j69i60.1366j0j4&sourceid=chrome&ie=UTF-8) installed in your computer.

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

### Android

- super + M = open debugger settings
- super + R = reloads app

## Generate apk or ipa

Generate .apk files

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

#### Versioning

We use a modified version of semver. The major and minor act as usual, but the patch increments forever, rather than getting reset to 0 every minor bump. This gives us a monotonic "build number" we can use as the Google Play Store version.

To bump the version, edit it in `package.json`, and remember to increment the patch monotonically no matter what other changes are made. Any minor bump should have an accompanying release of the sync server, with a matching bump to `SUPPORTED_CLIENT_VERSIONS`

#### Internal distribution

1. upload file in diawi.com
2. share app with the team!

#### Releasing

App Center will build an apk and app bundle on every commit to dev and master. It is also connected directly to Google Play, making distribution easy _if_ you are releasing to all countries at once.

To release a version to the Google Play store using App Center:
- Open https://appcenter.ms/orgs/Beyond-Essential/apps/Tamanu-Mobile/build/branches/master
- Click the latest build (top of the list)
- Drop down "Distribute" and select "Store"
- Choose "Production", edit the release notes as required, then submit

It will take around 5 - 10 minutes to process, and then will enter Google Play's review and release process automatically.

In future, we may need to roll out to a country at a time - this needs to be done directly through Google Play.

### App Center builds
App Center is all set up to build and sign both .aab app bundles (for the store, see above), and .apk files (for internal testing/non-store distribution).

To make a release build of a branch:
- Go to the [branches page in App Center](https://appcenter.ms/orgs/Beyond-Essential/apps/Tamanu-Mobile/build/branches)
- Navigate to your branch
- Hit the arrow beside configure then "clone from existing configuration" and choose dev
- Hit "Save and build"
- When finished, download the .apk file by choosing "Download" -> "Download build"
- Optionally, remove the config from that branch so that it doesn't build on every push

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
| _mocks_ | fixed mocks for jest test runner  |

#### Migrations
The sqlite instance on mobile is kept up to date using TypeORM migration files, these are stored in `App/migrations`

Run the following command to generate a new template migration and automatically add it to the `App/migrations/index.ts` file:

```
yarn migrate-create <migration_name>
```

The migration file will include the current unix timestamp, all migrations will be run in chronological order
