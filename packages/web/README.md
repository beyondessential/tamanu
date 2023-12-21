# Tamanu web

### A web application for Tamanu.

## Install

- **Note: requires a node version >= 7 and an npm version >= 4.**
- **If you have installation or compilation issues with this project, please see [our debugging guide](https://github.com/chentsulin/electron-react-boilerplate/issues/400)**

First, clone the repo via git:

```bash
git clone https://github.com/beyondessential/tamanu.git
```

And then install dependencies with yarn.

```bash
$ cd tamanu/packages/web
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


:bulb: You can debug your production build with devtools by simply setting the `DEBUG_PROD` env variable:

```bash
DEBUG_PROD=true yarn package
```

## Codebase Overview
If you are new to the web package, this summary is intended to give an overview of how the app is organised and the main libraries that are used.

### General

- Use or extend material-ui whenever possible for quicker development, better quality and consistency than creating components from scratch or importing other libraries
- Use styled-components for styling rather than passing in style props or style objects

### Code Organisation

- Use components directory for re-usable components and views directory for one off custom UI
- Components in the components directory at the very least should be in storybook for testing, maintenance and examples
- Avoid hasty abstractions. It's ok to repeat some code if it's not conceptually the same (source: https://kentcdodds.com/blog/aha-programming)
- Keep components focused and compose small components together for complex functionality rather than having 100+ lines of nested JSX

### State Management

- Use local state wherever possible
- Remove redux in favour of local state, react-query or context

### Data Fetching

- Use react-query for more declarative data fetching, better error and loading state handling and caching
- Use base DataFetchingTables component when you want a table full of data
- For complex data manipulation, remember we can just add a new endpoint to the facility server rather than having to fire off many api requests

### Forms

- We use Formik for our forms. Use base Form component whenever possible (see form readme for more details [here](app/components/Field/README.md))
- Move all form fields (autocomplete, select etc) to use material-ui fields for consistency of apis and quality
- Use full forms whenever possible rather than standalone form fields and buttons

## References

- [electron-react-boilerplate](https://github.com/chentsulin/electron-react-boilerplate)
- [react-query docs](https://tanstack.com/query/v3/)
- [material-ui docs](https://v4.mui.com/)
- [formik docs](https://formik.org/docs/overview)
