//! Serves a router on a listener: HTTP/1.1 or cleartext HTTP/2 per connection, with timeouts
//! against slow clients, and a graceful stop bounded in time.
//!
//! spec: SUPV#connections

use std::{convert::Infallible, net::SocketAddr, time::Duration};

use axum::{Router, body::Body};
use hyper::{Request, body::Incoming};
use hyper_util::{
	rt::{TokioExecutor, TokioIo, TokioTimer},
	server::{conn::auto, graceful::GracefulShutdown},
};
use tokio::net::TcpListener;
use tokio_util::sync::CancellationToken;
use tower::ServiceExt;

use crate::listen::Stalling;

/// The address a request's connection came from.
#[derive(Debug, Clone, Copy)]
pub struct Peer(pub SocketAddr);

/// How long a client has to send a request's headers, which also bounds how long a kept-alive
/// connection waits for its next request.
pub const HEADER_TIMEOUT: Duration = Duration::from_secs(60);

/// How long a read or write may wait without progress.
pub const STALL_TIMEOUT: Duration = Duration::from_secs(60);

/// How long open connections have to finish once a stop begins.
pub const GRACE_PERIOD: Duration = Duration::from_secs(10);

/// Serves `router` on `listener` until `shutdown` is cancelled, then gives open connections the
/// grace period to finish.
pub async fn serve(listener: TcpListener, router: Router, shutdown: CancellationToken) {
	let graceful = GracefulShutdown::new();
	let mut builder = auto::Builder::new(TokioExecutor::new());
	builder
		.http1()
		.timer(TokioTimer::new())
		.header_read_timeout(HEADER_TIMEOUT);
	builder.http2().timer(TokioTimer::new());

	loop {
		let (stream, peer) = tokio::select! {
			accepted = listener.accept() => match accepted {
				Ok(accepted) => accepted,
				Err(error) => {
					// Running out of file descriptors, say: wait rather than spin.
					tracing::warn!(%error, "accepting a connection");
					tokio::time::sleep(Duration::from_millis(100)).await;
					continue;
				}
			},
			() = shutdown.cancelled() => break,
		};
		// Without it, small responses wait on the client's delayed acknowledgement.
		let _ = stream.set_nodelay(true);
		let router = router.clone();
		let service = hyper::service::service_fn(move |mut req: Request<Incoming>| {
			req.extensions_mut().insert(Peer(peer));
			let router = router.clone();
			async move {
				let res = router.oneshot(req.map(Body::new)).await;
				Ok::<_, Infallible>(res.unwrap_or_else(|never| match never {}))
			}
		});
		let io = TokioIo::new(Stalling::new(stream, STALL_TIMEOUT));
		let connection = graceful.watch(
			builder
				.serve_connection_with_upgrades(io, service)
				.into_owned(),
		);
		tokio::spawn(async move {
			if let Err(error) = connection.await {
				tracing::debug!(%error, %peer, "connection ended");
			}
		});
	}

	drop(listener);
	if tokio::time::timeout(GRACE_PERIOD, graceful.shutdown())
		.await
		.is_err()
	{
		tracing::info!("grace period over; closing the connections still open");
	}
}
