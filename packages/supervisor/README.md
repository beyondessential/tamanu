# Tamanu supervisor

The supervisor is Tamanu's own server at the front of a Tamanu server. In this release it serves
the frontend images: the web app, and the patient portal. Its behaviour is specified in
[Supervisor](../../specs/platform/supervisor/overview.md).

This is a Rust crate, not an npm workspace, built with stable Rust.

## Building and testing

```sh
cargo build --release
cargo test
cargo clippy --all-targets -- -D warnings
cargo fmt --check
```

The binary is `target/release/tamanu-supervisor`. The images build it on the CD runners and copy
it in. For the Linux images it is a static musl build, passed to the root Dockerfile as a build
context of its own. From the repository root:

```sh
cargo build --release --target x86_64-unknown-linux-musl --manifest-path packages/supervisor/Cargo.toml
docker build --target frontend --build-arg PACKAGE_PATH=web \
  --build-context supervisor=packages/supervisor/target/x86_64-unknown-linux-musl/release .
```

## Running

```sh
FRONTEND_ROOT=../web/dist BIND_ADDRESS=127.0.0.1:3000 cargo run
```

It serves the built frontend at `FRONTEND_ROOT` on the addresses in `BIND_ADDRESS`. The
variables it reads are listed in the spec's
[Configuration](../../specs/platform/supervisor/overview.md#configuration). `--check` prints the
configuration it read and exits.

Logs are lines of JSON on standard error. `TAMANU_SUPERVISOR_LOG=debug` adds the requests from
Kubernetes probes and the end of each connection.

## Layout

| Path | Holds |
| --- | --- |
| `src/main.rs` | The binary: reads the configuration, listens, and stops on a signal |
| `src/config.rs` | The configuration, from the environment |
| `src/listen.rs` | Listening sockets, and the stall timeout on each connection |
| `src/server.rs` | Serving a router on a listener: HTTP/1.1 and cleartext HTTP/2, header timeout, graceful stop |
| `src/files.rs` | The frontend's files, its index, `/env.js` and error pages |
| `src/headers.rs` | The security headers |
| `tests/frontend.rs` | Serving a frontend end to end, over a real listener |
