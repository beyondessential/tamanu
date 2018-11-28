# Tamanu

> This is a [mono-repo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md)

## Install

* **Note: requires node version >= 8.3 and yarn version > 1.2.**

First, clone the repo via git:

```bash
$ git clone https://github.com/beyondessential/tamanu.git
```

And then install dependencies with yarn.

```bash
$ cd tamanu
# Enable yarn workspaces
$ yarn config set workspaces-experimental true
$ yarn config set workspaces-nohoist-experimental true
$ yarn
$ cd ./packages/lan && yarn add json-prune
$ cd ./packages/server && yarn add config
```

## Configure

Before development can begin, you'll need to configure the LAN server.

```
cd ./packages/lan 
cp config-example.js config.js
```

The example config is set up to just talk to a local realm server. To get 
some real data, you should point the lan client to a remote server.

- change `mainServer` in config.js to `"http://13.210.104.94:3000"` 
- ensure `offlineMode` is set to `true`

When you run the lan-server with these settings, you'll be prompted for login
credentials. These are in TeamPassword under "Tamanu main sync server". Once the
sync has completed, you can revert the config to its original values.

## Run

### LAN server

The Tamanu desktop app needs a lan server running to operate correctly. For
local development, this can just be another process on the same host.

```bash
$ cd packages/lan
$ yarn run dev
```

### Desktop app

Once there is a LAN server up and running, run this to start the Electron app.

```bash
$ cd packages/desktop
$ yarn run start
```

## Components

* [tamanu-desktop](packages/desktop): the main Electron app
* [tamanu-lan](packages/lan): the local server
* [tamanu-server](packages/server): the remote server
* [shared-components](packages/shared): shared code among Tamanu components
