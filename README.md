# Tamanu LAN server

This is the main server that the [Tamanu desktop app](https://github.com/beyondessential/tamanu-desktop)
communicates with.  It stores data in a local filesystem which syncs to
a [remote server](https://github.com/beyondessential/tamanu-server).

## Initial setup

Clone the repo and run `yarn` in it.

There's also a repo, `tamanu-common`, which needs to be cloned into the
repo via submodules:

```
cd tamanu-server
git submodule init
git submodule update
```

You'll also need a valid config file. Run:

```
cp tamanu-lan-server/config-example.js tamanu-lan-server/config.js
```

To get some real data, change `sync.server` in config.js to
`"http://13.210.104.94:3000/realm-sync"`.

When you run the lan-server with this setting, you'll be prompted for login
credentials. These are in TeamPassword under "Tamanu main sync server".

## Running

Start the server with `yarn run start`.
