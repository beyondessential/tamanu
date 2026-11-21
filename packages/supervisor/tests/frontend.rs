//! Serving a frontend, end to end over a real listener.

use std::{fs, net::SocketAddr, path::Path, time::Duration};

use axum::{
	body::Body,
	http::{HeaderMap, Method, Request, StatusCode, Version},
};
use bytes::Bytes;
use http_body_util::BodyExt;
use hyper_util::{
	client::legacy::{Client, connect::HttpConnector},
	rt::TokioExecutor,
};
use tamanu_supervisor::{files::Files, frontend, server};
use tokio::net::TcpListener;
use tokio_util::sync::CancellationToken;

const INDEX: &str = "<!doctype html><html><head><title>Tamanu</title></head><body></body></html>";
const APP_JS: &str = "console.log('the app');\n";
const MANIFEST: &str = "{\"name\":\"Tamanu\",\"short_name\":\"Tamanu\",\"display\":\"standalone\"}";

/// A frontend's files, with the index and the app stored precompressed beside them. The
/// precompressed files hold markers rather than real compressed data, so a test can tell which
/// was served.
fn frontend_root(root: &Path) {
	fs::create_dir_all(root.join("assets")).unwrap();
	fs::create_dir_all(root.join("resources/errors")).unwrap();
	fs::write(root.join("index.html"), INDEX).unwrap();
	fs::write(root.join("index.html.zst"), "index as zstd").unwrap();
	fs::write(root.join("index.html.gz"), "index as gzip").unwrap();
	fs::write(root.join("assets/app.js"), APP_JS).unwrap();
	fs::write(root.join("assets/app.js.gz"), "app as gzip").unwrap();
	fs::write(root.join("manifest.json"), MANIFEST).unwrap();
	fs::write(
		root.join("resources/errors/405.html"),
		"<p>method not allowed</p>",
	)
	.unwrap();
}

struct Running {
	addr: SocketAddr,
	stop: CancellationToken,
	server: tokio::task::JoinHandle<()>,
	_root: tempfile::TempDir,
}

async fn start() -> Running {
	let root = tempfile::tempdir().unwrap();
	frontend_root(root.path());
	let files = Files::new(root.path(), |name| match name {
		"REVISION" => Some("abc123".into()),
		_ => None,
	})
	.unwrap();
	let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
	let addr = listener.local_addr().unwrap();
	let stop = CancellationToken::new();
	let server = tokio::spawn(server::serve(listener, frontend(files), stop.clone()));
	Running {
		addr,
		stop,
		server,
		_root: root,
	}
}

struct Got {
	status: StatusCode,
	headers: HeaderMap,
	body: Bytes,
	version: Version,
}

async fn send(
	client: &Client<HttpConnector, Body>,
	addr: SocketAddr,
	method: Method,
	path: &str,
	headers: &[(&str, &str)],
) -> Got {
	let mut req = Request::builder()
		.method(method)
		.uri(format!("http://{addr}{path}"));
	for (name, value) in headers {
		req = req.header(*name, *value);
	}
	let res = client
		.request(req.body(Body::empty()).unwrap())
		.await
		.unwrap();
	let (parts, body) = res.into_parts();
	Got {
		status: parts.status,
		headers: parts.headers,
		body: body.collect().await.unwrap().to_bytes(),
		version: parts.version,
	}
}

fn http1() -> Client<HttpConnector, Body> {
	Client::builder(TokioExecutor::new()).build_http()
}

/// What a response must carry. A header given as None must be absent.
struct Want {
	status: StatusCode,
	body: &'static str,
	headers: &'static [(&'static str, Option<&'static str>)],
}

const INDEX_HEADERS: &[(&str, Option<&str>)] = &[
	("content-type", Some("text/html; charset=utf-8")),
	("cache-control", Some("no-cache")),
	("content-encoding", None),
];

/// A request, and what its response must carry.
type Case = (
	Method,
	&'static str,
	&'static [(&'static str, &'static str)],
	Want,
);

#[tokio::test]
async fn paths() {
	let running = start().await;
	let client = http1();
	let cases: &[Case] = &[
		(
			Method::GET,
			"/",
			&[],
			Want {
				status: StatusCode::OK,
				body: INDEX,
				headers: INDEX_HEADERS,
			},
		),
		(
			Method::GET,
			"/",
			&[("accept-encoding", "gzip, zstd")],
			Want {
				status: StatusCode::OK,
				body: "index as zstd",
				headers: &[
					("content-encoding", Some("zstd")),
					("vary", Some("accept-encoding")),
				],
			},
		),
		(
			Method::GET,
			"/",
			&[("accept-encoding", "gzip, zstd;q=0")],
			Want {
				status: StatusCode::OK,
				body: "index as gzip",
				headers: &[("content-encoding", Some("gzip"))],
			},
		),
		// The app's own routes, and anything else that is not a file, get the index.
		(
			Method::GET,
			"/patients/123",
			&[],
			Want {
				status: StatusCode::OK,
				body: INDEX,
				headers: INDEX_HEADERS,
			},
		),
		(
			Method::GET,
			"/assets/missing.js",
			&[],
			Want {
				status: StatusCode::OK,
				body: INDEX,
				headers: INDEX_HEADERS,
			},
		),
		(
			Method::GET,
			"/assets/",
			&[],
			Want {
				status: StatusCode::OK,
				body: INDEX,
				headers: INDEX_HEADERS,
			},
		),
		(
			Method::GET,
			"/assets/app.js",
			&[],
			Want {
				status: StatusCode::OK,
				body: APP_JS,
				headers: &[
					("content-type", Some("text/javascript; charset=utf-8")),
					("cache-control", None),
				],
			},
		),
		(
			Method::GET,
			"/assets/app.js",
			&[("accept-encoding", "zstd, gzip")],
			Want {
				status: StatusCode::OK,
				body: "app as gzip",
				headers: &[("content-encoding", Some("gzip"))],
			},
		),
		(
			Method::GET,
			"/env.js",
			&[],
			Want {
				status: StatusCode::OK,
				body: "window.env = {\"BUGSNAG_API_KEY\":null,\"NODE_ENV\":\"production\",\"REVISION\":\"abc123\"};\n",
				headers: &[
					("content-type", Some("text/javascript; charset=utf-8")),
					("cache-control", Some("no-cache")),
				],
			},
		),
		(
			Method::GET,
			"/manifest.json",
			&[],
			Want {
				status: StatusCode::OK,
				body: MANIFEST,
				headers: &[("cache-control", Some("no-cache"))],
			},
		),
		(
			Method::HEAD,
			"/",
			&[],
			Want {
				status: StatusCode::OK,
				body: "",
				headers: &[("content-length", Some("75"))],
			},
		),
		(
			Method::POST,
			"/",
			&[],
			Want {
				status: StatusCode::METHOD_NOT_ALLOWED,
				body: "<p>method not allowed</p>",
				headers: &[
					("allow", Some("GET, HEAD")),
					("content-type", Some("text/html; charset=utf-8")),
				],
			},
		),
		// Paths that try to leave the root stay in it.
		(
			Method::GET,
			"/../../../etc/passwd",
			&[],
			Want {
				status: StatusCode::OK,
				body: INDEX,
				headers: &[],
			},
		),
		(
			Method::GET,
			"/%2e%2e/%2e%2e/etc/passwd",
			&[],
			Want {
				status: StatusCode::OK,
				body: INDEX,
				headers: &[],
			},
		),
		(
			Method::GET,
			"/assets/..%2f..%2fetc/passwd",
			&[],
			Want {
				status: StatusCode::OK,
				body: INDEX,
				headers: &[],
			},
		),
	];

	for (method, path, headers, want) in cases {
		let got = send(&client, running.addr, method.clone(), path, headers).await;
		let case = format!("{method} {path} {headers:?}");
		assert_eq!(got.status, want.status, "{case}");
		assert_eq!(std::str::from_utf8(&got.body).unwrap(), want.body, "{case}");
		for (name, value) in want.headers {
			assert_eq!(
				got.headers.get(*name).map(|v| v.to_str().unwrap()),
				*value,
				"{case}: {name}"
			);
		}
		// spec: SUPV#security-headers
		assert_eq!(
			got.headers.get("x-frame-options").unwrap(),
			"SAMEORIGIN",
			"{case}"
		);
		assert_eq!(
			got.headers.get("x-content-type-options").unwrap(),
			"nosniff",
			"{case}"
		);
		assert!(
			got.headers.get("content-security-policy").is_none(),
			"{case}"
		);
		assert!(
			got.headers.get("cross-origin-embedder-policy").is_none(),
			"{case}"
		);
	}
	running.stop.cancel();
	running.server.await.unwrap();
}

#[tokio::test]
async fn compresses_what_is_not_stored_compressed() {
	let running = start().await;
	let got = send(
		&http1(),
		running.addr,
		Method::GET,
		"/manifest.json",
		&[("accept-encoding", "gzip")],
	)
	.await;
	assert_eq!(got.headers.get("content-encoding").unwrap(), "gzip");
	assert_ne!(got.body, MANIFEST.as_bytes());
}

#[tokio::test]
async fn serves_cleartext_http2() {
	let running = start().await;
	let client = Client::builder(TokioExecutor::new())
		.http2_only(true)
		.build_http();
	let got = send(&client, running.addr, Method::GET, "/", &[]).await;
	assert_eq!(got.version, Version::HTTP_2);
	assert_eq!(got.body, INDEX.as_bytes());
}

#[tokio::test]
async fn stops_when_asked() {
	let running = start().await;
	let client = http1();
	send(&client, running.addr, Method::GET, "/", &[]).await;
	running.stop.cancel();
	// The kept-alive connection is idle, so it closes at once rather than at the grace period.
	tokio::time::timeout(Duration::from_secs(5), running.server)
		.await
		.unwrap()
		.unwrap();
	assert!(tokio::net::TcpStream::connect(running.addr).await.is_err());
}

#[test]
fn a_root_without_an_index_is_refused() {
	let root = tempfile::tempdir().unwrap();
	let error = Files::new(root.path(), |_| None).err().unwrap();
	assert!(error.to_string().contains("index.html"), "{error}");
}

#[tokio::test]
async fn the_index_is_revalidated_by_its_tag() {
	let running = start().await;
	let client = http1();
	let first = send(&client, running.addr, Method::GET, "/patients/1", &[]).await;
	let etag = first
		.headers
		.get("etag")
		.unwrap()
		.to_str()
		.unwrap()
		.to_owned();
	let again = send(
		&client,
		running.addr,
		Method::GET,
		"/",
		&[("if-none-match", &etag)],
	)
	.await;
	assert_eq!(again.status, StatusCode::NOT_MODIFIED);
	assert!(again.body.is_empty());
	assert_eq!(again.headers.get("cache-control").unwrap(), "no-cache");

	// Each encoding has a tag of its own.
	let zstd = send(
		&client,
		running.addr,
		Method::GET,
		"/",
		&[("accept-encoding", "zstd"), ("if-none-match", &etag)],
	)
	.await;
	assert_eq!(zstd.status, StatusCode::OK);
	assert_ne!(zstd.headers.get("etag").unwrap(), etag.as_str());
}
