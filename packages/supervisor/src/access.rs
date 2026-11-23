//! The access log: a line for each request, written once its response body has been handed to the
//! connection or abandoned, so the duration covers the transfer but for what the socket buffers.
//! It wraps the response compression, so the size is what was sent.
//!
//! spec: SUPV#logging

use std::{
	pin::Pin,
	task::{Context, Poll},
	time::Instant,
};

use axum::{
	body::Body,
	http::{Method, Request, Response, header},
	middleware::Next,
};
use bytes::Bytes;
use http_body::{Frame, SizeHint};

use crate::server::Peer;

/// What the line says about a request, besides what the response adds.
struct Entry {
	started: Instant,
	method: Method,
	path: String,
	peer: String,
	/// A Kubernetes probe, logged at debug.
	probe: bool,
}

/// Logs the request, wrapping the response's body so the line is written when the body is
/// finished with.
pub async fn log(req: Request<Body>, next: Next) -> Response<Body> {
	let entry = Entry {
		started: Instant::now(),
		method: req.method().clone(),
		path: req.uri().path().to_owned(),
		peer: req
			.extensions()
			.get::<Peer>()
			.map_or_else(|| "-".to_owned(), |p| p.0.ip().to_canonical().to_string()),
		probe: req
			.headers()
			.get(header::USER_AGENT)
			.is_some_and(|agent| agent.as_bytes().starts_with(b"kube-probe/")),
	};
	let res = next.run(req).await;
	let status = res.status().as_u16();
	res.map(|inner| {
		Body::new(Logged {
			inner,
			line: Line {
				entry,
				status,
				bytes: 0,
			},
		})
	})
}

struct Line {
	entry: Entry,
	status: u16,
	/// The body's bytes handed on to be sent.
	bytes: u64,
}

impl Drop for Line {
	fn drop(&mut self) {
		let Entry {
			started,
			method,
			path,
			peer,
			probe,
		} = &self.entry;
		let ms = started.elapsed().as_secs_f64() * 1000.0;
		let (status, bytes) = (self.status, self.bytes);
		if *probe {
			tracing::debug!(%method, path, status, bytes, ms, peer, "file");
		} else {
			tracing::info!(%method, path, status, bytes, ms, peer, "file");
		}
	}
}

struct Logged {
	inner: Body,
	line: Line,
}

impl http_body::Body for Logged {
	type Data = Bytes;
	type Error = axum::Error;

	fn poll_frame(
		mut self: Pin<&mut Self>,
		cx: &mut Context<'_>,
	) -> Poll<Option<Result<Frame<Bytes>, axum::Error>>> {
		let frame = Pin::new(&mut self.inner).poll_frame(cx);
		if let Poll::Ready(Some(Ok(frame))) = &frame
			&& let Some(data) = frame.data_ref()
		{
			self.line.bytes += data.len() as u64;
		}
		frame
	}

	fn is_end_stream(&self) -> bool {
		self.inner.is_end_stream()
	}

	fn size_hint(&self) -> SizeHint {
		self.inner.size_hint()
	}
}
