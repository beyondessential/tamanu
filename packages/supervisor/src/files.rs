//! A built frontend's files: the web app or patient portal, its `/env.js`, and Tamanu's error
//! pages.
//!
//! spec: SUPV#serving-a-frontend

use std::{
	hash::{DefaultHasher, Hash, Hasher},
	io,
	path::{Path, PathBuf},
	time::Instant,
};

use axum::{
	body::Body,
	http::{HeaderMap, HeaderValue, Method, Request, Response, StatusCode, header},
};
use bytes::Bytes;
use tower::ServiceExt;
use tower_http::services::ServeDir;

use crate::{headers, server::Peer};

/// The encodings a file may be stored precompressed in, beside it with the encoding's extension,
/// in the order they are preferred.
const ENCODINGS: &[(&str, &str)] = &[("zstd", "zst"), ("br", "br"), ("gzip", "gz")];

/// Where a frontend's error pages are, under its root.
const ERRORS: &str = "resources/errors";

#[derive(Clone)]
pub struct Files {
	root: PathBuf,
	dir: ServeDir,
	index: Index,
	env_js: Bytes,
}

/// The index page, held in memory: it answers every one of the app's own routes.
#[derive(Clone)]
struct Index {
	identity: Variant,
	encoded: Vec<(&'static str, Variant)>,
}

/// One encoding of the index, with the tag a browser revalidates it by.
#[derive(Clone)]
struct Variant {
	bytes: Bytes,
	etag: HeaderValue,
}

impl Variant {
	fn new(bytes: Vec<u8>) -> Self {
		let mut hasher = DefaultHasher::new();
		bytes.hash(&mut hasher);
		let etag = HeaderValue::try_from(format!("\"{:016x}\"", hasher.finish()))
			.expect("hex is a valid header");
		Self {
			bytes: bytes.into(),
			etag,
		}
	}
}

impl Files {
	/// Reads the frontend at `root`, which must have an `index.html`. `env` gives the values
	/// `/env.js` hands the app.
	pub fn new(root: &Path, env: impl Fn(&str) -> Option<String>) -> io::Result<Self> {
		let dir = ServeDir::new(root)
			.precompressed_zstd()
			.precompressed_br()
			.precompressed_gzip()
			.append_index_html_on_directories(false);
		Ok(Self {
			root: root.to_owned(),
			dir,
			index: Index::read(root)?,
			env_js: env_js(env),
		})
	}

	pub async fn serve(&self, req: Request<Body>) -> Response<Body> {
		let started = Instant::now();
		let method = req.method().clone();
		let path = req.uri().path().to_owned();
		let probe = req
			.headers()
			.get(header::USER_AGENT)
			.is_some_and(|agent| agent.as_bytes().starts_with(b"kube-probe/"));
		let peer = req
			.extensions()
			.get::<Peer>()
			.map_or_else(|| "-".to_owned(), |p| p.0.ip().to_canonical().to_string());

		let mut res = self.respond(req).await;
		headers::app(res.headers_mut());

		let bytes = res
			.headers()
			.get(header::CONTENT_LENGTH)
			.and_then(|v| v.to_str().ok()?.parse::<u64>().ok());
		let status = res.status().as_u16();
		let ms = started.elapsed().as_secs_f64() * 1000.0;
		// spec: SUPV#logging
		if probe {
			tracing::debug!(%method, path, status, bytes, ms, peer, "file");
		} else {
			tracing::info!(%method, path, status, bytes, ms, peer, "file");
		}
		res
	}

	async fn respond(&self, req: Request<Body>) -> Response<Body> {
		if req.method() != Method::GET && req.method() != Method::HEAD {
			let mut res = self.error(StatusCode::METHOD_NOT_ALLOWED).await;
			res.headers_mut()
				.insert(header::ALLOW, HeaderValue::from_static("GET, HEAD"));
			return res;
		}
		let head = req.method() == Method::HEAD;
		match req.uri().path() {
			"/env.js" => {
				let mut res = body(head, self.env_js.clone());
				let headers = res.headers_mut();
				headers.insert(
					header::CONTENT_TYPE,
					HeaderValue::from_static("text/javascript; charset=utf-8"),
				);
				headers.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-cache"));
				res
			}
			"/" | "/index.html" => self.index.respond(head, req.headers()),
			path => {
				let manifest = path == "/manifest.json";
				let headers = req.headers().clone();
				let mut res = self
					.dir
					.clone()
					.oneshot(req)
					.await
					.unwrap_or_else(|never| match never {});
				if res.status() == StatusCode::NOT_FOUND {
					// The app's own routes are not files: its index answers them.
					return self.index.respond(head, &headers);
				}
				if manifest {
					res.headers_mut()
						.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-cache"));
				}
				if res.status().is_client_error() || res.status().is_server_error() {
					return self.error(res.status()).await;
				}
				with_charset(res.headers_mut());
				res.map(Body::new)
			}
		}
	}

	/// Tamanu's page for the status, or an empty response with it where there is none.
	async fn error(&self, status: StatusCode) -> Response<Body> {
		let page = self
			.root
			.join(ERRORS)
			.join(format!("{}.html", status.as_u16()));
		let (content_type, body) = match tokio::fs::read(page).await {
			Ok(html) => ("text/html; charset=utf-8", Body::from(html)),
			Err(_) => ("text/plain; charset=utf-8", Body::empty()),
		};
		let mut res = Response::new(body);
		*res.status_mut() = status;
		res.headers_mut()
			.insert(header::CONTENT_TYPE, HeaderValue::from_static(content_type));
		res
	}
}

impl Index {
	fn read(root: &Path) -> io::Result<Self> {
		let path = root.join("index.html");
		let identity = std::fs::read(&path)
			.map_err(|e| io::Error::new(e.kind(), format!("reading {}: {e}", path.display())))?;
		let encoded = ENCODINGS
			.iter()
			.filter_map(|(name, ext)| {
				let file = root.join(format!("index.html.{ext}"));
				std::fs::read(file).ok().map(|b| (*name, Variant::new(b)))
			})
			.collect();
		Ok(Self {
			identity: Variant::new(identity),
			encoded,
		})
	}

	/// The index in the best encoding the client accepts. It is never cached without checking
	/// again, since it names the release's other files; a browser that has it already gets
	/// `304 Not Modified`.
	fn respond(&self, head: bool, headers: &HeaderMap) -> Response<Body> {
		let accepted = accepted_encodings(headers);
		let (encoding, variant) = self
			.encoded
			.iter()
			.filter_map(|(name, variant)| {
				let (_, q) = accepted.iter().find(|(n, _)| n == name)?;
				(*q > 0.0).then_some((*q, *name, variant))
			})
			// The first of the highest quality, which keeps the order of preference among equals.
			.fold(
				None,
				|best: Option<(f32, &str, &Variant)>, candidate| match best {
					Some(b) if b.0 >= candidate.0 => Some(b),
					_ => Some(candidate),
				},
			)
			.map_or((None, &self.identity), |(_, name, variant)| {
				(Some(name), variant)
			});

		let unchanged = headers
			.get_all(header::IF_NONE_MATCH)
			.iter()
			.filter_map(|v| v.to_str().ok())
			.flat_map(|v| v.split(','))
			.any(|tag| {
				let tag = tag.trim();
				tag == "*" || tag.trim_start_matches("W/") == variant.etag
			});
		let mut res = if unchanged {
			let mut res = Response::new(Body::empty());
			*res.status_mut() = StatusCode::NOT_MODIFIED;
			res
		} else {
			body(head, variant.bytes.clone())
		};
		let headers = res.headers_mut();
		if let Some(name) = encoding {
			headers.insert(header::CONTENT_ENCODING, HeaderValue::from_static(name));
		}
		headers.insert(header::ETAG, variant.etag.clone());
		headers.insert(
			header::CONTENT_TYPE,
			HeaderValue::from_static("text/html; charset=utf-8"),
		);
		headers.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-cache"));
		headers.insert(header::VARY, HeaderValue::from_static("accept-encoding"));
		res
	}
}

/// Names UTF-8 as the charset of a text file, which the frontend's build writes.
fn with_charset(headers: &mut HeaderMap) {
	let Some(content_type) = headers
		.get(header::CONTENT_TYPE)
		.and_then(|v| v.to_str().ok())
	else {
		return;
	};
	let textual = content_type.starts_with("text/")
		|| matches!(
			content_type,
			"application/javascript" | "application/json" | "image/svg+xml"
		);
	if textual && !content_type.contains("charset") {
		let value = format!("{content_type}; charset=utf-8");
		headers.insert(
			header::CONTENT_TYPE,
			HeaderValue::try_from(value).expect("a valid content type stays valid"),
		);
	}
}

/// The response carrying `bytes`, or only their length for a `HEAD` request.
fn body(head: bool, bytes: Bytes) -> Response<Body> {
	let length = bytes.len();
	let mut res = Response::new(if head {
		Body::empty()
	} else {
		Body::from(bytes)
	});
	res.headers_mut()
		.insert(header::CONTENT_LENGTH, HeaderValue::from(length));
	res
}

/// The encodings named in `Accept-Encoding`, with their quality.
fn accepted_encodings(headers: &HeaderMap) -> Vec<(String, f32)> {
	headers
		.get_all(header::ACCEPT_ENCODING)
		.iter()
		.filter_map(|v| v.to_str().ok())
		.flat_map(|v| v.split(','))
		.filter_map(|item| {
			let mut parts = item.split(';');
			let name = parts.next()?.trim().to_ascii_lowercase();
			let q = parts
				.find_map(|p| p.trim().strip_prefix("q="))
				.map_or(Some(1.0), |q| q.trim().parse().ok())?;
			(!name.is_empty()).then_some((name, q))
		})
		.collect()
}

/// The app's `/env.js`, serialised as JSON so no value can break out of it. Keep in step with
/// `packages/web/app/utils/env.js` and `packages/ui-components/src/utils/env.js`.
///
/// spec: SUPV#serving-a-frontend
fn env_js(env: impl Fn(&str) -> Option<String>) -> Bytes {
	let var = |name| env(name).filter(|v| !v.is_empty());
	let values = serde_json::json!({
		"NODE_ENV": var("NODE_ENV").unwrap_or_else(|| "production".into()),
		"BUGSNAG_API_KEY": var("BUGSNAG_API_KEY"),
		"REVISION": var("REVISION"),
	});
	format!("window.env = {values};\n").into()
}

#[cfg(test)]
mod tests {
	use super::*;

	#[test]
	fn accept_encoding() {
		let mut headers = HeaderMap::new();
		headers.insert(
			header::ACCEPT_ENCODING,
			HeaderValue::from_static("gzip;q=0.5, br , zstd;q=0, identity"),
		);
		assert_eq!(
			accepted_encodings(&headers),
			vec![
				("gzip".into(), 0.5),
				("br".into(), 1.0),
				("zstd".into(), 0.0),
				("identity".into(), 1.0)
			]
		);
	}

	#[test]
	fn env_js_escapes_its_values() {
		let js = env_js(|name| (name == "REVISION").then(|| "`${alert(1)}`\"</script>".into()));
		assert_eq!(
			std::str::from_utf8(&js).unwrap(),
			"window.env = {\"BUGSNAG_API_KEY\":null,\"NODE_ENV\":\"production\",\"REVISION\":\"`${alert(1)}`\\\"</script>\"};\n"
		);
	}
}
