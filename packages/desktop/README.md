# tamanu-desktop

### A Desktop application for Tamanu.

## Install

- **Note: requires a node version >= 7 and an npm version >= 4.**
- **If you have installation or compilation issues with this project, please see [our debugging guide](https://github.com/chentsulin/electron-react-boilerplate/issues/400)**

First, clone the repo via git:

```bash
git clone https://github.com/beyondessential/tamanu.git
```

And then install dependencies with yarn.

```bash
$ cd tamanu/packages/desktop
$ yarn
```

## Run

Start the app in the `dev` environment

```bash
$ yarn dev
```

Alternatively, you can run the renderer and main processes separately. This way, you can restart one process without waiting for the other. Run these two commands **simultaneously** in different console tabs:

```bash
$ yarn start-renderer-dev
$ yarn start-main-dev
```

If you don't need autofocus when your files was changed, then run `dev` with env `START_MINIMIZED=true`:

```bash
$ START_MINIMIZED=true yarn dev
```

## Storybook

We use storybook to develop a lot of our common UI components in isolation. To run storybook, use:

```
yarn storybook
```

## Packaging

To package apps for the local platform:

```bash
$ yarn package
```

To package apps for all platforms:

First, refer to [Multi Platform Build](https://www.electron.build/multi-platform-build) for dependencies.

Then,

```bash
$ yarn package-all
```

To package apps with options:

```bash
$ yarn package -- --[option]
```

To run End-to-End Test

```bash
$ yarn build
$ yarn test-e2e

# Running e2e tests in a minimized window
$ START_MINIMIZED=true yarn build
$ yarn test-e2e
```

:bulb: You can debug your production build with devtools by simply setting the `DEBUG_PROD` env variable:

```bash
DEBUG_PROD=true yarn package
```

## References

- [electron-react-boilerplate](https://github.com/chentsulin/electron-react-boilerplate)
