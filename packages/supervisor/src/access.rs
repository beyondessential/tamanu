//! The access log: a line for each request, written once its response body has been handed to the
//! connection or abandoned, so the duration covers the transfer but for what the socket buffers.
//!
//! spec: SUPV#logging

use std::{
	pin::Pin,
	task::{Context, Poll},
	time::Instant,
};

use axum::{
	body::Body,
	http::{Method, Response},
};
use bytes::Bytes;
use http_body::{Frame, SizeHint};

/// What the line says about a request, besides what the response adds.
pub struct Entry {
	pub started: Instant,
	pub method: Method,
	pub path: String,
	pub peer: String,
	/// A Kubernetes probe, logged at debug.
	pub probe: bool,
}

/// Wraps the response's body so the line is written when the body is finished with.
pub fn log(entry: Entry, res: Response<Body>) -> Response<Body> {
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
