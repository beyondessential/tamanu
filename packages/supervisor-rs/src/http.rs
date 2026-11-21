//! Thin JSON calls for the actuator and api clients, over plain HTTP.

use std::time::Duration;

use axum::http::{Method, Request, StatusCode, header};
use bytes::Bytes;
use http_body_util::{BodyExt, Full, Limited};
use hyper_util::{
	client::legacy::{Client, connect::HttpConnector},
	rt::TokioExecutor,
};
use serde::{Serialize, de::DeserializeOwned};

pub type JsonClient = Client<HttpConnector, Full<Bytes>>;

pub fn client() -> JsonClient {
	let mut connector = HttpConnector::new();
	connector.set_connect_timeout(Some(Duration::from_secs(5)));
	Client::builder(TokioExecutor::new()).build(connector)
}

#[derive(Debug)]
pub enum CallError {
	/// The request never got an answer.
	Unreachable(String),
	/// The answer's status, its body left out, which the other side logs itself.
	Status(StatusCode, Bytes),
	Decode(String),
	Timeout,
}

impl std::fmt::Display for CallError {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		match self {
			Self::Unreachable(e) => write!(f, "unreachable: {e}"),
			Self::Status(s, _) => write!(f, "answered {s}"),
			Self::Decode(e) => write!(f, "reading the answer: {e}"),
			Self::Timeout => write!(f, "timed out"),
		}
	}
}

pub struct Call<'a> {
	pub method: Method,
	pub url: String,
	pub token: &'a str,
	pub headers: Vec<(&'static str, String)>,
	pub timeout: Duration,
}

impl Call<'_> {
	/// Sends `body` as JSON, and answers the status and the body read, up to a megabyte.
	pub async fn send(
		self,
		client: &JsonClient,
		body: Option<&impl Serialize>,
	) -> Result<(StatusCode, Bytes), CallError> {
		let mut req = Request::builder()
			.method(self.method)
			.uri(self.url)
			.header(header::ACCEPT, "application/json")
			.header(header::AUTHORIZATION, format!("Bearer {}", self.token));
		for (name, value) in self.headers {
			req = req.header(name, value);
		}
		let body = match body {
			Some(b) => {
				req = req.header(header::CONTENT_TYPE, "application/json");
				Bytes::from(serde_json::to_vec(b).unwrap())
			}
			None => Bytes::new(),
		};
		let req = req
			.body(Full::new(body))
			.map_err(|e| CallError::Unreachable(e.to_string()))?;
		let exchange = async {
			let res = client
				.request(req)
				.await
				.map_err(|e| CallError::Unreachable(e.to_string()))?;
			let status = res.status();
			let body = Limited::new(res.into_body(), 1 << 20)
				.collect()
				.await
				.map_err(|e| CallError::Unreachable(e.to_string()))?
				.to_bytes();
			Ok((status, body))
		};
		tokio::time::timeout(self.timeout, exchange)
			.await
			.map_err(|_| CallError::Timeout)?
	}
}

pub fn decode<T: DeserializeOwned>(body: &[u8]) -> Result<T, CallError> {
	serde_json::from_slice(body).map_err(|e| CallError::Decode(e.to_string()))
}
