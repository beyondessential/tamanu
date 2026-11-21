//! The supervisor's front door: the server's address, and on central the patient portal's.
//!
//! spec: SUPV#front-door

use std::{net::IpAddr, sync::Arc};

use axum::{
	Router,
	body::Body,
	extract::State,
	http::{HeaderMap, HeaderValue, Request, Response, StatusCode, header},
};
use percent_encoding::percent_decode_str;
use tower_http::compression::CompressionLayer;

use crate::{
	config::Cidr,
	files::Files,
	guarded::Guarded,
	headers,
	pages::{Pages, is_browser},
	proxy::{Origin, Proxy},
	ratelimit::Limits,
	server::ClientAddr,
	state::{Admission, Part, Server},
};

/// How a route's requests bear on sleep and wake.
///
/// spec: SLPWK#activity
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Class {
	Activity,
	Exempt,
	Websocket,
	Static,
	Page,
	Index,
}

enum Route {
	RedirectLogin,
	Refused,
	Api(Class),
	Files(Class),
}

pub struct Front {
	pub files: Files,
	pub proxy: Arc<Proxy>,
	pub limits: Arc<Limits>,
	pub state: Arc<Server>,
	pub pages: Arc<Pages>,
	pub trusted: Arc<Vec<Cidr>>,
}

pub fn router(front: Front) -> Router {
	Router::new()
		.fallback(handle)
		.layer(CompressionLayer::new())
		.with_state(Arc::new(front))
}

async fn handle(State(front): State<Arc<Front>>, mut req: Request<Body>) -> Response<Body> {
	if is_ambiguous(req.headers()) {
		return status(StatusCode::BAD_REQUEST);
	}
	let Some(normalised) = normalise(req.uri().path()) else {
		tracing::warn!(path = req.uri().path(), "refused path");
		return status(StatusCode::BAD_REQUEST);
	};
	let peer = req
		.extensions()
		.get::<ClientAddr>()
		.map(|c| c.0.ip())
		.unwrap();
	let origin = origin(peer, req.headers_mut(), &front.trusted);

	let route = classify(&front, &normalised, req.headers()).await;
	tracing::debug!(path = normalised, "request");
	let class = match route {
		Route::RedirectLogin => {
			let query = req
				.uri()
				.query()
				.map(|q| format!("?{q}"))
				.unwrap_or_default();
			return Response::builder()
				.status(StatusCode::PERMANENT_REDIRECT)
				.header(header::LOCATION, format!("/api/login{query}"))
				.body(Body::empty())
				.unwrap();
		}
		Route::Refused => {
			tracing::warn!(path = normalised, "refused path");
			return status(StatusCode::NOT_FOUND);
		}
		Route::Api(class) => {
			if !front.limits.allow(origin.client, &normalised) {
				// TODO: counted per client address and minute rather than logged each time.
				return status(StatusCode::TOO_MANY_REQUESTS);
			}
			class
		}
		Route::Files(class) => class,
	};
	gate(&front, class, req, origin).await
}

/// Decides what the request gets from the server's state, and passes it on.
///
/// spec: SUPV#front-door
async fn gate(front: &Front, class: Class, req: Request<Body>, origin: Origin) -> Response<Body> {
	let browser = is_browser(req.method(), req.headers());
	let class = match class {
		// spec: SLPWK#activity
		Class::Index if !browser => return front.files.serve(req).await,
		Class::Index => Class::Activity,
		Class::Page if browser => Class::Activity,
		Class::Page => Class::Static,
		other => other,
	};
	let files = matches!(class, Class::Static) || !crate::pages::is_api_path(req.uri().path());

	let (admission, in_flight) = match class {
		Class::Static => {
			// spec: SLPWK#waking
			let in_flight = front.state.admit_static();
			let res = front.files.serve(req).await;
			return res.map(|b| Guarded::wrap(b, in_flight));
		}
		Class::Activity => front.state.admit_activity(Part::Api),
		_ => (front.state.admit_exempt(Part::Api), None),
	};

	let (method, path, headers) = (
		req.method().clone(),
		req.uri().path().to_owned(),
		req.headers().clone(),
	);
	match admission {
		Admission::Forward => {
			let res = if files {
				front.files.serve(req).await
			} else {
				forward(front, req, origin, &method, &path, &headers).await
			};
			match in_flight {
				Some(in_flight) => res.map(|b| Guarded::wrap(b, in_flight)),
				None => res,
			}
		}
		// spec: SUPV#upgrades
		Admission::Upgrading => {
			front
				.pages
				.upgrading
				.respond(&method, &path, &headers, StatusCode::SERVICE_UNAVAILABLE)
		}
		Admission::Hold if class == Class::Websocket => front
			.pages
			.unavailable(StatusCode::SERVICE_UNAVAILABLE)
			.unwrap()
			.respond(&method, &path, &headers, StatusCode::SERVICE_UNAVAILABLE),
		// spec: SLPWK#waking
		Admission::Hold => {
			front
				.pages
				.waking
				.respond(&method, &path, &headers, StatusCode::SERVICE_UNAVAILABLE)
		}
	}
}

async fn forward(
	front: &Front,
	req: Request<Body>,
	origin: Origin,
	method: &axum::http::Method,
	path: &str,
	headers: &HeaderMap,
) -> Response<Body> {
	match front.proxy.forward(req, origin).await {
		Ok(mut res) => {
			headers::api(res.headers_mut());
			res.headers_mut()
				.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
			res
		}
		Err(failure) => match front.pages.unavailable(failure) {
			Some(page) => page.respond(method, path, headers, failure),
			None => status(failure),
		},
	}
}

async fn classify(front: &Front, path: &str, headers: &HeaderMap) -> Route {
	match path {
		"/v1/login" => Route::RedirectLogin,
		// The api's routes for the supervisor, which calls them directly.
		// spec: SUPV#talking-to-the-server
		p if p == "/api/supervisor" || p.starts_with("/api/supervisor/") => Route::Refused,
		// spec: SLPWK#activity
		p if p.starts_with("/api/socket.io/") && is_upgrade(headers) => {
			Route::Api(Class::Websocket)
		}
		"/api/public/ping" | "/api/timesync" => Route::Api(Class::Exempt),
		p if crate::pages::is_api_path(p) => Route::Api(Class::Activity),
		"/env.js" | "/manifest.json" => Route::Files(Class::Static),
		"/" => Route::Files(Class::Index),
		p if front.files.is_file(p).await => Route::Files(Class::Static),
		_ => Route::Files(Class::Page),
	}
}

fn is_upgrade(headers: &HeaderMap) -> bool {
	headers
		.get(header::UPGRADE)
		.is_some_and(|v| v.as_bytes().eq_ignore_ascii_case(b"websocket"))
}

/// A request whose body framing a front and back end could read differently.
fn is_ambiguous(headers: &HeaderMap) -> bool {
	let lengths = headers.get_all(header::CONTENT_LENGTH).iter().count();
	let codings: Vec<_> = headers.get_all(header::TRANSFER_ENCODING).iter().collect();
	lengths > 1
		|| (lengths > 0 && !codings.is_empty())
		|| codings
			.iter()
			.any(|v| !v.as_bytes().eq_ignore_ascii_case(b"chunked"))
}

/// The path as routes see it: percent-decoded, lowercased, dot segments resolved and slashes
/// merged. A path that decodes to a slash, a backslash or a NUL has none.
fn normalise(path: &str) -> Option<String> {
	let mut segments: Vec<String> = Vec::new();
	for raw in path.split('/') {
		let segment = percent_decode_str(raw).decode_utf8().ok()?;
		if segment.contains(['/', '\\', '\0']) {
			return None;
		}
		match segment.as_ref() {
			"" | "." => {}
			".." => {
				segments.pop();
			}
			s => segments.push(s.to_lowercase()),
		}
	}
	let mut normalised = format!("/{}", segments.join("/"));
	if path.ends_with('/') && normalised.len() > 1 {
		normalised.push('/');
	}
	Some(normalised)
}

/// Where the request came from: the nearest untrusted address in the forwarded-for chain when the
/// peer is a trusted proxy, and the peer otherwise, whose forwarded headers are dropped.
fn origin(peer: IpAddr, headers: &mut HeaderMap, trusted: &[Cidr]) -> Origin {
	let is_trusted = |ip: IpAddr| trusted.iter().any(|c| c.contains(ip));
	if !is_trusted(peer) {
		for name in ["x-forwarded-for", "x-forwarded-proto", "x-forwarded-host"] {
			headers.remove(name);
		}
		return Origin {
			client: peer,
			forwarded_for: None,
			proto: "http",
		};
	}
	let chain: Vec<IpAddr> = headers
		.get_all("x-forwarded-for")
		.iter()
		.filter_map(|v| v.to_str().ok())
		.flat_map(|v| v.split(','))
		.filter_map(|v| v.trim().parse().ok())
		.collect();
	let client = chain
		.iter()
		.rev()
		.copied()
		.find(|ip| !is_trusted(*ip))
		.unwrap_or(peer);
	let proto = match headers.get("x-forwarded-proto").map(|v| v.as_bytes()) {
		Some(b"https") => "https",
		_ => "http",
	};
	let forwarded_for = (!chain.is_empty()).then(|| {
		chain
			.iter()
			.map(IpAddr::to_string)
			.collect::<Vec<_>>()
			.join(", ")
	});
	Origin {
		client,
		forwarded_for,
		proto,
	}
}

fn status(status: StatusCode) -> Response<Body> {
	Response::builder()
		.status(status)
		.body(Body::empty())
		.unwrap()
}
