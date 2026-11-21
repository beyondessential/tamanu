//! Listeners: HTTP/1.1 or cleartext HTTP/2 per connection, with the secure defaults Caddy gives,
//! and a graceful stop bounded in time.

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

/// The address a connection came from.
#[derive(Debug, Clone, Copy)]
pub struct ClientAddr(pub SocketAddr);

/// Bounds the wait for open connections on stopping, so a long request or an open websocket
/// cannot hold up a restart.
const GRACE_PERIOD: Duration = Duration::from_secs(10);

pub async fn serve(
	addr: SocketAddr,
	router: Router,
	shutdown: CancellationToken,
) -> std::io::Result<()> {
	let listener = TcpListener::bind(addr).await?;
	tracing::info!(%addr, "listening");
	let graceful = GracefulShutdown::new();
	let mut builder = auto::Builder::new(TokioExecutor::new());
	builder
		.http1()
		.timer(TokioTimer::new())
		// Also bounds the wait for the next request on a kept-alive connection.
		.header_read_timeout(Duration::from_secs(60));
	builder.http2().timer(TokioTimer::new());
	// TODO: a stall timeout around each connection's socket, reset on every read and write.

	loop {
		tokio::select! {
			accepted = listener.accept() => {
				let Ok((stream, remote)) = accepted else { continue };
				let _ = stream.set_nodelay(true);
				let router = router.clone();
				let service = hyper::service::service_fn(move |mut req: Request<Incoming>| {
					req.extensions_mut().insert(ClientAddr(remote));
					let router = router.clone();
					async move { Ok::<_, Infallible>(router.oneshot(req.map(Body::new)).await.unwrap_or_else(|e| match e {})) }
				});
				let conn = builder.serve_connection_with_upgrades(TokioIo::new(stream), service).into_owned();
				let conn = graceful.watch(conn);
				tokio::spawn(async move {
					if let Err(error) = conn.await {
						tracing::debug!(%error, "connection");
					}
				});
			}
			_ = shutdown.cancelled() => break,
		}
	}
	drop(listener);
	tokio::select! {
		_ = graceful.shutdown() => {}
		_ = tokio::time::sleep(GRACE_PERIOD) => {}
	}
	Ok(())
}
