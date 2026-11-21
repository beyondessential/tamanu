//! The responses the supervisor gives itself rather than forwarding: waking, upgrading and
//! unavailable.

use std::{collections::BTreeMap, path::Path, time::Duration};

use axum::{
	body::Body,
	http::{HeaderMap, Method, Response, StatusCode, header},
};
use bytes::Bytes;

#[derive(Debug, Clone)]
pub struct Page {
	pub name: &'static str,
	pub message: &'static str,
	pub retry_after: Option<Duration>,
	html: Option<Bytes>,
}

/// spec: SLPWK#waking
const WAKING: Page = Page {
	name: "ServerWaking",
	message: "The server is starting up. Try again shortly.",
	retry_after: Some(Duration::from_secs(10)),
	html: None,
};

/// spec: SUPV#upgrades
const UPGRADING: Page = Page {
	name: "ServerUpgrading",
	message: "The server is being upgraded. Try again shortly.",
	retry_after: Some(Duration::from_secs(30)),
	html: None,
};

/// No Retry-After, so a client reads it as a failure, not a waking server.
const UNAVAILABLE: Page = Page {
	name: "ServerUnavailable",
	message: "The server cannot be reached right now.",
	retry_after: None,
	html: None,
};

const ERRORS_DIR: &str = "/resources/errors/";

#[derive(Debug, Clone)]
pub struct Pages {
	pub waking: Page,
	pub upgrading: Page,
	unavailable: BTreeMap<u16, Page>,
}

impl Pages {
	/// Reads Tamanu's pages from the web app's directory.
	///
	/// spec: SUPV#front-door
	pub fn load(web_root: &Path) -> Self {
		let read = |page: Page, name: &str| {
			let path = web_root.join(ERRORS_DIR.trim_start_matches('/')).join(name);
			match std::fs::read(path) {
				Ok(html) => Page {
					html: Some(with_base(&html).into()),
					..page
				},
				Err(_) => page,
			}
		};
		Self {
			waking: read(WAKING, "waking.html"),
			upgrading: read(UPGRADING, "526.html"),
			unavailable: [502, 503, 504]
				.into_iter()
				.map(|status| (status, read(UNAVAILABLE, &format!("{status}.html"))))
				.collect(),
		}
	}

	pub fn unavailable(&self, status: StatusCode) -> Option<&Page> {
		self.unavailable.get(&status.as_u16())
	}
}

/// Points the page's relative addresses at the errors directory, since it is served at whatever
/// path was asked for.
fn with_base(page: &[u8]) -> Vec<u8> {
	let lower = page.to_ascii_lowercase();
	let Some(i) = lower.windows(6).position(|w| w == b"<head>") else {
		return page.to_vec();
	};
	let i = i + 6;
	[
		&page[..i],
		format!("<base href=\"{ERRORS_DIR}\">").as_bytes(),
		&page[i..],
	]
	.concat()
}

impl Page {
	/// A page for a browser opening one, JSON for any other API request, and plain text otherwise.
	pub fn respond(
		&self,
		method: &Method,
		path: &str,
		headers: &HeaderMap,
		status: StatusCode,
	) -> Response<Body> {
		let mut res = Response::builder()
			.status(status)
			.header(header::CACHE_CONTROL, "no-store");
		if let Some(retry) = self.retry_after {
			res = res.header(header::RETRY_AFTER, retry.as_secs());
		}
		let (content_type, body): (&str, Bytes) = match &self.html {
			Some(html) if is_browser(method, headers) => ("text/html; charset=utf-8", html.clone()),
			_ if is_api_path(path) => (
				"application/json",
				serde_json::to_vec(&serde_json::json!({
					"error": { "name": self.name, "message": self.message, "status": status.as_u16() }
				}))
				.unwrap()
				.into(),
			),
			_ => (
				"text/plain; charset=utf-8",
				format!("{}\n", self.message).into(),
			),
		};
		res = res.header(header::CONTENT_TYPE, content_type);
		let body = if method == Method::HEAD {
			Body::empty()
		} else {
			Body::from(body)
		};
		res.body(body).unwrap()
	}
}

pub fn is_api_path(path: &str) -> bool {
	path == "/api" || path == "/v1" || path.starts_with("/api/") || path.starts_with("/v1/")
}

/// Whether the request is a browser asking for a page.
pub fn is_browser(method: &Method, headers: &HeaderMap) -> bool {
	(method == Method::GET || method == Method::HEAD)
		&& headers
			.get_all(header::ACCEPT)
			.iter()
			.any(|v| v.as_bytes().windows(9).any(|w| w == b"text/html"))
}
