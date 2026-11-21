//! The frontend's own files: the built web app or patient portal, its `/env.js`, and Tamanu's
//! error pages. Served alike in frontend mode and by the supervisor.

use std::{
	path::{Path, PathBuf},
	time::Instant,
};

use axum::{
	body::Body,
	http::{HeaderValue, Request, Response, StatusCode, header},
};
use bytes::Bytes;
use tower::ServiceExt;
use tower_http::services::{ServeDir, ServeFile};

use crate::{headers, server::ClientAddr};

#[derive(Clone)]
pub struct Files {
	root: PathBuf,
	dir: ServeDir<ServeFile>,
	env_js: Bytes,
}

impl Files {
	pub fn new(root: &Path) -> Self {
		let dir = ServeDir::new(root)
			.precompressed_zstd()
			.precompressed_br()
			.precompressed_gzip()
			// The web app's own routes are answered by its index.
			.fallback(
				ServeFile::new(root.join("index.html"))
					.precompressed_zstd()
					.precompressed_gzip(),
			);
		Self {
			root: root.to_owned(),
			dir,
			env_js: env_js(),
		}
	}

	/// Whether the path names a file under the root.
	pub async fn is_file(&self, path: &str) -> bool {
		// The path is normalised by the caller, so it cannot leave the root.
		let path = self.root.join(path.trim_start_matches('/'));
		tokio::fs::metadata(path).await.is_ok_and(|m| m.is_file())
	}

	pub async fn serve(&self, req: Request<Body>) -> Response<Body> {
		let started = Instant::now();
		let method = req.method().clone();
		let path = req.uri().path().to_owned();
		let probe = req
			.headers()
			.get(header::USER_AGENT)
			.is_some_and(|ua| ua.as_bytes().starts_with(b"kube-probe/"));
		let client = req.extensions().get::<ClientAddr>().map(|c| c.0);

		let mut res = if path == "/env.js" {
			Response::builder()
				.header(header::CONTENT_TYPE, "text/javascript; charset=utf-8")
				.body(Body::from(self.env_js.clone()))
				.unwrap()
		} else {
			let res = self
				.dir
				.clone()
				.oneshot(req)
				.await
				.unwrap_or_else(|e| match e {});
			res.map(Body::new)
		};
		if res.status().is_client_error() || res.status().is_server_error() {
			res = self.error_page(res.status()).await.unwrap_or(res);
		}
		if matches!(path.as_str(), "/" | "/manifest.json" | "/env.js") {
			res.headers_mut()
				.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-cache"));
		}
		headers::app(res.headers_mut());

		let length = res
			.headers()
			.get(header::CONTENT_LENGTH)
			.and_then(|v| v.to_str().ok())
			.unwrap_or("-");
		let status = res.status().as_u16();
		let duration = started.elapsed().as_secs_f64();
		if probe {
			tracing::debug!(%method, path, status, length, duration, ?client, "file");
		} else {
			tracing::info!(%method, path, status, length, duration, ?client, "file");
		}
		res
	}

	async fn error_page(&self, status: StatusCode) -> Option<Response<Body>> {
		let page = self
			.root
			.join(format!("resources/errors/{}.html", status.as_u16()));
		let html = tokio::fs::read(page).await.ok()?;
		Some(
			Response::builder()
				.status(status)
				.header(header::CONTENT_TYPE, "text/html; charset=utf-8")
				.body(Body::from(html))
				.unwrap(),
		)
	}
}

/// The web app's and patient portal's `/env.js`, serialised as JSON so no value can break out.
fn env_js() -> Bytes {
	let var = |name: &str| std::env::var(name).ok().filter(|v| !v.is_empty());
	let env = serde_json::json!({
		"NODE_ENV": var("NODE_ENV").unwrap_or_else(|| "production".into()),
		"BUGSNAG_API_KEY": var("BUGSNAG_API_KEY"),
		"REVISION": var("REVISION"),
	});
	format!("window.env = {env};\n").into()
}
