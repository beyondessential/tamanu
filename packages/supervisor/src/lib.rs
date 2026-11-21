//! Tamanu's supervisor, the front door of a Tamanu server. This release serves a built frontend
//! alone, as the frontend images do by default.
//!
//! spec: SUPV#serving-a-frontend

pub mod config;
pub mod files;
pub mod headers;
pub mod listen;
pub mod server;

use axum::Router;
use tower_http::compression::CompressionLayer;

use crate::files::Files;

/// The router serving a frontend's files.
pub fn frontend(files: Files) -> Router {
	Router::new()
		.fallback(move |req| {
			let files = files.clone();
			async move { files.serve(req).await }
		})
		.layer(CompressionLayer::new())
}
