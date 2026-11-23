---
id: SUPV
---

# Supervisor

Applies to the supervisor, Tamanu's own server at the front of a Tamanu server, which ships with each release and serves the release's frontends.

## Serving a frontend

- The release's frontend image serves the web app, and its patient portal image the patient portal, each through the supervisor.
- A path that names a file of the built frontend gets that file. Any other path gets the frontend's index page, so the app's own routes open directly.
- A file stored beside precompressed copies of itself is sent in the best encoding the browser accepts, preferring zstd, then Brotli, then gzip. Text that has no precompressed copy is compressed as it is sent.
- The index page, `/env.js` and the app's manifest, `/tamanu-manifest.json` or the web app's `/shared/tamanu-manifest.json`, are never cached without the browser checking again. The index page carries a tag for that check, so a browser that holds the release's index has it confirmed rather than sent again.
- `/env.js` gives the app the deployment's environment name, Bugsnag key and revision, written as data, so no value can change what the script does.
- Requests other than `GET` and `HEAD` are refused.
- A response with an error status carries Tamanu's error page for that status, where the frontend has one.

> [!NOTE]
> The index page names the release's other files, so a stale copy would load the files of an older release. Every other file's name changes with its content, so it can be cached as the browser sees fit.

## Connections

- The supervisor serves plain HTTP. TLS, certificates and hostnames belong to the platform in front of it.
- Each address takes HTTP/1.1 and cleartext HTTP/2, told apart by the first bytes a client sends.
- A client that does not finish sending a request's headers in time is disconnected, as is one whose connection makes no progress for a while. A transfer at any steady pace is unaffected.
- Asked to stop, the supervisor stops accepting connections and gives those open a short time to finish.

## Security headers

- Every response carries these headers:

| Header | Value |
| --- | --- |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |
| `Permissions-Policy` | `camera=(self), display-capture=(), geolocation=(), microphone=(), payment=(), usb=()` |
| `Referrer-Policy` | `no-referrer` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |

> [!NOTE]
> The camera is allowed because the web app scans codes and takes photos with it. `Strict-Transport-Security` is left out because deployments served over plain HTTP, locally or on a private network, would be sent to HTTPS. `Cross-Origin-Embedder-Policy` is left out because it only serves cross-origin isolation, which neither app uses, and would block any image or font from another origin.

- Every response also carries a content security policy written for the web app and the patient portal, as `Content-Security-Policy-Report-Only`: the browser reports in its console whatever the policy would block, and blocks nothing.
- The policy allows the app's own files, inline styles, images and fonts from `data:` addresses, workers, frames and images from `blob:` addresses, connections to the server itself and to Bugsnag, and nothing from any other origin. It allows no inline scripts, no plugins, and no framing by another site.

> [!NOTE]
> The policy is reported before it is enforced because a source it misses would break the app for every deployment at once. Its reports are read while the release is tested.

## Logging

- Each request is logged as a line of JSON on standard error, with its method, path, status, size, duration and client address.
- Query strings, request and response bodies, and header values are never logged.
- Requests from Kubernetes probes are logged at the debug level only, so a probe every few seconds does not fill the log.

## Configuration

- The supervisor is configured by environment variables, none of them required:

| Variable | Default | Meaning |
| --- | --- | --- |
| `BIND_ADDRESS` | `:3000` | Comma-separated addresses to listen on, each `host:port`, or `:port` for every address |
| `FRONTEND_ROOT` | `/app`, or `C:\app` on Windows | Directory of the built frontend |
| `TAMANU_SUPERVISOR_LOG` | `info` | Which log lines are written, in [tracing's filter syntax](https://docs.rs/tracing-subscriber/latest/tracing_subscriber/filter/struct.EnvFilter.html#directives) |
| `NODE_ENV` | `production` | The environment name `/env.js` gives the app |
| `BUGSNAG_API_KEY` | none | The Bugsnag key `/env.js` gives the app |
| `REVISION` | none | The revision `/env.js` gives the app |

- `:port` listens on IPv6 and IPv4 alike, or on IPv4 alone where IPv6 is switched off.
- An address that is not of that form stops the supervisor as it starts, with an error naming the variable, as does a frontend directory without an index page.

## Platforms

- The same supervisor, from the same release, serves the frontend images for Linux and for Windows.
- In the Linux images it runs as an unprivileged user.
- It stops on `SIGTERM` or `SIGINT`, and on Windows on the console's Ctrl-C or Ctrl-Break.
