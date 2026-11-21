//! The reverse proxy to the api's instances: least connections, a retry on a failed connect, the
//! request smuggling hardening, and websockets.

use std::{
	net::IpAddr,
	sync::{
		Arc,
		atomic::{AtomicUsize, Ordering},
	},
	time::Duration,
};

use axum::{
	body::Body,
	http::{HeaderMap, HeaderValue, Request, Response, StatusCode, Uri, header},
};
use hyper_util::{
	client::legacy::{Client, connect::HttpConnector},
	rt::{TokioExecutor, TokioIo, TokioTimer},
};

use crate::guarded::Guarded;

/// Headers that belong to one connection, never forwarded.
const HOP_BY_HOP: &[&str] = &[
	"connection",
	"keep-alive",
	"proxy-connection",
	"proxy-authenticate",
	"proxy-authorization",
	"te",
	"trailer",
	"transfer-encoding",
	"upgrade",
	// Answered here, never passed through.
	"expect",
];

const RETRIES: usize = 2;
const RETRY_WITHIN: Duration = Duration::from_secs(5);

pub struct Proxy {
	instances: Vec<Arc<Instance>>,
	client: Client<HttpConnector, Body>,
	next: AtomicUsize,
}

struct Instance {
	authority: String,
	in_flight: AtomicUsize,
}

/// Ends an instance's count of requests in flight when dropped.
struct Load(Arc<Instance>);

impl Drop for Load {
	fn drop(&mut self) {
		self.0.in_flight.fetch_sub(1, Ordering::Relaxed);
	}
}

/// Where a forwarded request came from.
pub struct Origin {
	pub client: IpAddr,
	/// The forwarded-for chain from trusted proxies, already checked.
	pub forwarded_for: Option<String>,
	pub proto: &'static str,
}

impl Proxy {
	pub fn new(upstreams: &[String]) -> Self {
		let mut connector = HttpConnector::new();
		connector.set_connect_timeout(Some(Duration::from_secs(5)));
		connector.set_nodelay(true);
		let client = Client::builder(TokioExecutor::new())
			.pool_timer(TokioTimer::new())
			.pool_idle_timeout(Duration::from_secs(120))
			.pool_max_idle_per_host(32)
			.build(connector);
		Self {
			instances: upstreams
				.iter()
				.map(|authority| {
					Arc::new(Instance {
						authority: authority.clone(),
						in_flight: AtomicUsize::new(0),
					})
				})
				.collect(),
			client,
			next: AtomicUsize::new(0),
		}
	}

	/// The instance with the fewest requests in flight, ties broken in turn, skipping those
	/// already tried.
	fn pick(&self, tried: &[usize]) -> Option<usize> {
		let start = self.next.fetch_add(1, Ordering::Relaxed);
		(0..self.instances.len())
			.map(|i| (start + i) % self.instances.len())
			.filter(|i| !tried.contains(i))
			.min_by_key(|i| self.instances[*i].in_flight.load(Ordering::Relaxed))
	}

	/// Forwards the request, answering the status of the failure when no instance answered.
	pub async fn forward(
		&self,
		mut req: Request<Body>,
		origin: Origin,
	) -> Result<Response<Body>, StatusCode> {
		let websocket = is_websocket(req.headers());
		let client_upgrade = websocket.then(|| hyper::upgrade::on(&mut req));
		prepare(req.headers_mut(), &origin, websocket);

		// A request without a body can be sent again after a failed connect; one with a body
		// cannot, since sending it consumed the body.
		let replayable = req
			.headers()
			.get(header::CONTENT_LENGTH)
			.is_none_or(|v| v == "0")
			&& !req.headers().contains_key(header::TRANSFER_ENCODING);
		let (parts, body) = req.into_parts();
		let mut body = Some(body);
		let deadline = tokio::time::Instant::now() + RETRY_WITHIN;
		let mut tried = Vec::new();

		loop {
			let Some(i) = self.pick(&tried) else {
				return Err(StatusCode::BAD_GATEWAY);
			};
			tried.push(i);
			let instance = self.instances[i].clone();
			let uri = Uri::builder()
				.scheme("http")
				.authority(instance.authority.as_str())
				.path_and_query(
					parts
						.uri
						.path_and_query()
						.map(|p| p.as_str())
						.unwrap_or("/"),
				)
				.build()
				.map_err(|_| StatusCode::BAD_REQUEST)?;
			let mut attempt = Request::from_parts(parts.clone(), body.take().unwrap_or_default());
			*attempt.uri_mut() = uri;

			instance.in_flight.fetch_add(1, Ordering::Relaxed);
			let load = Load(instance.clone());
			match self.client.request(attempt).await {
				Ok(mut res) => {
					if let Some(client_upgrade) = client_upgrade {
						if res.status() == StatusCode::SWITCHING_PROTOCOLS {
							splice(client_upgrade, hyper::upgrade::on(&mut res), load);
							return Ok(res.map(Body::new));
						}
					}
					strip_hop_by_hop(res.headers_mut());
					return Ok(res.map(|b| Guarded::wrap(Body::new(b), load)));
				}
				Err(error) => {
					let again = error.is_connect()
						&& replayable && tried.len() <= RETRIES
						&& tokio::time::Instant::now() < deadline;
					tracing::warn!(method = %parts.method, path = parts.uri.path(), instance = instance.authority, %error, "forwarding");
					if !again {
						return Err(StatusCode::BAD_GATEWAY);
					}
				}
			}
		}
	}
}

/// A websocket's own connection, copied both ways until either side closes. It is never pooled,
/// so it shares nothing between clients.
fn splice(client: hyper::upgrade::OnUpgrade, upstream: hyper::upgrade::OnUpgrade, load: Load) {
	tokio::spawn(async move {
		let _load = load;
		let (Ok(client), Ok(upstream)) = tokio::join!(client, upstream) else {
			return;
		};
		let _ =
			tokio::io::copy_bidirectional(&mut TokioIo::new(client), &mut TokioIo::new(upstream))
				.await;
	});
}

fn is_websocket(headers: &HeaderMap) -> bool {
	let has = |name, value: &str| {
		headers
			.get_all(name)
			.iter()
			.filter_map(|v| v.to_str().ok())
			.flat_map(|v| v.split(','))
			.any(|v| v.trim().eq_ignore_ascii_case(value))
	};
	has(header::CONNECTION, "upgrade") && has(header::UPGRADE, "websocket")
}

fn strip_hop_by_hop(headers: &mut HeaderMap) {
	let named: Vec<String> = headers
		.get_all(header::CONNECTION)
		.iter()
		.filter_map(|v| v.to_str().ok())
		.flat_map(|v| v.split(','))
		.map(|v| v.trim().to_ascii_lowercase())
		.collect();
	for name in HOP_BY_HOP
		.iter()
		.copied()
		.chain(named.iter().map(String::as_str))
	{
		headers.remove(name);
	}
}

fn prepare(headers: &mut HeaderMap, origin: &Origin, websocket: bool) {
	strip_hop_by_hop(headers);
	if websocket {
		headers.insert(header::CONNECTION, HeaderValue::from_static("upgrade"));
		headers.insert(header::UPGRADE, HeaderValue::from_static("websocket"));
	}
	let host = headers.get(header::HOST).cloned();
	let forwarded_for = match &origin.forwarded_for {
		Some(chain) => format!("{chain}, {}", origin.client),
		None => origin.client.to_string(),
	};
	headers.insert(
		"x-forwarded-for",
		HeaderValue::try_from(forwarded_for).unwrap(),
	);
	headers.insert("x-forwarded-proto", HeaderValue::from_static(origin.proto));
	if let Some(host) = host {
		headers.insert("x-forwarded-host", host);
	}
}
