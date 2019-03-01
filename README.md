# Tamanu
> This is a [mono-repo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md)

[ ![Codeship Status for beyondessential/tamanu](https://app.codeship.com/projects/9355b080-d34d-0136-45ef-2e8db6e7ba42/status?branch=codeship)](https://app.codeship.com/projects/316346)

## Install

> **Note: requires a node version >= 10.14.0 and a yarn version > 1.2.0**

First, clone the repo via git:

```bash
$ git clone https://github.com/beyondessential/tamanu.git
```

And then install dependencies with yarn.

```bash
$ cd tamanu
$ # Enable yarn workspaces
$ yarn config set workspaces-experimental true
$ yarn config set workspaces-nohoist-experimental true
$ yarn
```

## Configure

Before development can begin, you'll need to configure the LAN server, and sync
data from the main server.

The example config is set up to just talk to a local realm server. To get
some real data, you should point the lan client to a remote server.

Create a file `/packages/lan/config/local.json` (will not be tracked by git)
and paste this data into it:

```json
{
  "mainServer": "http://13.210.104.94:3000",
  "offlineMode": false,
}
```

Any settings in `config/local.json` will take priority over those in `config/default.json`.
The [`config` docs](https://github.com/lorenwest/node-config/wiki/Configuration-Files) have more info on how that works.

Now run `cd /packages/lan/config && node index` to start the LAN server.
When you run the lan-server with these settings, you'll be prompted for login
credentials. These are in LastPass under "Tamanu main sync server".

Once the sync has completed, change the config to run in offline mode
- change `offlineMode` to `true`

You can now follow the instructions below to run the LAN server, and shouldn't
need to sync with the main server while developing.

## Run

### LAN server

The Tamanu desktop app needs a lan server running to operate correctly. For
local development, this can just be another process on the same host.

```bash
$ cd packages/lan
$ yarn start-dev
```

### Desktop app

Once there is a LAN server up and running, run this to start the Electron app for development.

```bash
$ cd packages/desktop
$ mv example.env .env
$ yarn start-dev # To run in production, use yarn start
```

## CI / CD
> **Note: [codeship pro](https://codeship.com/features/pro) is required**

### Setup
- install [Jet CLI](https://documentation.codeship.com/pro/jet-cli/installation/)
- download your codeship project's AES key from *Project Settings*
- use  [SSH helper](https://github.com/codeship-library/docker-utilities/tree/master/ssh-helper) to generate SSH keys
- populate `codeship.env` with environment variables defined below
- use [jet encrypt](https://documentation.codeship.com/pro/jet-cli/encrypt/) to encrypt ENV variables e.g `jet encrypt codeship.env codeship.env.encrypted`
- make sure that `codeship.env` is kept safe or remove it
- use `jet` cli to test build pipelines e.g `jet steps --tag "dev"`

### Pipeline
- `dev` and `master` branches trigger build automatically
- `master` branch requires a manual action to trigger deployment
- `desktop` and `lan` builds are pushed to S3
- `server` build gets deployed to an AWS EC2 instance

### Environment variables
- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`: AWS auth keys with S3 write access
- `CONFIG_DESKTOP`: desktop config `single lined env variables` e.g `FOO1=bar1\nFOO2=bar2`
- `CONFIG_LAN_$ENV_$BRANCH` and `CONFIG_DESKTOP_$ENV_$BRANCH`: `lan` and `server` configs as json string. e.g `CONFIG_LAN_DEMO_DEV`
- `PRIVATE_SSH_KEY`: SSH private key used for server deployment
- `SERVER_URL_$BRANCH`: SSH server url e.g `user@host`
- `$ENV`: represents different set of configs e.g `DEMO`, `SERVER1`, `SERVER2`
- `$BRANCH`: the branch this build process is triggered for e.g `DEV`, `MASTER`

### Dependencies
- `codeship-services.yml` codeship services definition
- `codeship-steps.yml` CI / CD steps are defined here
- `Dockerfile` and `Dockerfile.deploy` describe build environments
- `codeship.env.encrypted` encrypted ENV variables passed to docker during build process

## Components

* [tamanu-desktop](packages/desktop): the main Electron app
* [tamanu-lan](packages/lan): the local server
* [tamanu-server](packages/server): the remote server
* [shared-components](packages/shared): shared code among Tamanu components
