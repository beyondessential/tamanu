//! A response body that holds a guard until it has been sent, so activity and per-instance load
//! are counted until the last byte, not only until the headers.

use std::{
	pin::Pin,
	task::{Context, Poll},
};

use axum::body::Body;
use bytes::Bytes;
use http_body::{Frame, SizeHint};

pub struct Guarded<G> {
	inner: Body,
	_guard: G,
}

impl<G: Send + Unpin + 'static> Guarded<G> {
	pub fn wrap(inner: Body, guard: G) -> Body {
		Body::new(Self {
			inner,
			_guard: guard,
		})
	}
}

impl<G: Unpin> http_body::Body for Guarded<G> {
	type Data = Bytes;
	type Error = axum::Error;

	fn poll_frame(
		mut self: Pin<&mut Self>,
		cx: &mut Context<'_>,
	) -> Poll<Option<Result<Frame<Bytes>, axum::Error>>> {
		Pin::new(&mut self.inner).poll_frame(cx)
	}

	fn is_end_stream(&self) -> bool {
		self.inner.is_end_stream()
	}

	fn size_hint(&self) -> SizeHint {
		self.inner.size_hint()
	}
}
