//! Tamanu's supervisor. With no command it serves one built frontend alone, as the frontend images
//! do by default; with `supervisor` it is the server's front door, and puts the server to sleep and
//! wakes it.
//!
//! spec: SUPV#front-door
//! spec: SUPV#platforms

#![forbid(unsafe_code)]

mod actuator;
mod apiclient;
mod buildinfo;
mod config;
mod files;
mod front;
mod guarded;
mod headers;
mod http;
mod machine;
mod pages;
mod peers;
mod proxy;
mod ratelimit;
mod server;
mod state;
mod status;

use std::{process::ExitCode, sync::Arc};

use axum::Router;
use tokio_util::sync::CancellationToken;
use tracing_subscriber::EnvFilter;

fn main() -> ExitCode {
	tracing_subscriber::fmt()
		.json()
		.with_env_filter(
			EnvFilter::try_from_env("TAMANU_SUPERVISOR_LOG")
				.unwrap_or_else(|_| EnvFilter::new("info")),
		)
		.with_writer(std::io::stderr)
		.init();

	let args: Vec<String> = std::env::args().skip(1).collect();
	let check = args.iter().any(|a| a == "--check");
	let supervisor = args.first().is_some_and(|a| a == "supervisor");

	let runtime = tokio::runtime::Builder::new_multi_thread()
		.enable_all()
		.build()
		.unwrap();
	let result = if supervisor {
		match config::Supervisor::from_env() {
			Err(problems) => Err(problems.to_string()),
			Ok(config) if check => {
				println!("{config:#?}");
				Ok(())
			}
			Ok(config) => runtime.block_on(run_supervisor(config)),
		}
	} else {
		match config::Frontend::from_env() {
			Err(problems) => Err(problems.to_string()),
			Ok(config) if check => {
				println!("{config:#?}");
				Ok(())
			}
			Ok(config) => runtime.block_on(run_frontend(config)),
		}
	};
	match result {
		Ok(()) => ExitCode::SUCCESS,
		Err(error) => {
			eprint!("{error}");
			ExitCode::FAILURE
		}
	}
}

/// Cancelled on SIGTERM or SIGINT.
fn shutdown_signal() -> CancellationToken {
	let token = CancellationToken::new();
	let cancel = token.clone();
	tokio::spawn(async move {
		#[cfg(unix)]
		{
			let mut term =
				tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()).unwrap();
			tokio::select! {
				_ = term.recv() => {}
				_ = tokio::signal::ctrl_c() => {}
			}
		}
		#[cfg(not(unix))]
		let _ = tokio::signal::ctrl_c().await;
		cancel.cancel();
	});
	token
}

async fn run_frontend(config: config::Frontend) -> Result<(), String> {
	let shutdown = shutdown_signal();
	let files = files::Files::new(&config.root);
	let router = Router::new()
		.fallback(move |req| {
			let files = files.clone();
			async move { files.serve(req).await }
		})
		.layer(tower_http::compression::CompressionLayer::new());
	let servers = config
		.binds
		.iter()
		.map(|addr| tokio::spawn(server::serve(*addr, router.clone(), shutdown.clone())));
	for server in servers {
		server
			.await
			.map_err(|e| e.to_string())?
			.map_err(|e| e.to_string())?;
	}
	Ok(())
}

async fn run_supervisor(config: config::Supervisor) -> Result<(), String> {
	let shutdown = shutdown_signal();
	let state = state::Server::new(&state::PARTS);
	let pages = Arc::new(pages::Pages::load(&config.web_root));
	let proxy = Arc::new(proxy::Proxy::new(&config.api_upstreams));
	let limits = ratelimit::Limits::new();
	let trusted = Arc::new(config.trusted_proxies.clone());
	let instance = format!(
		"{}-{:x}",
		std::env::var("HOSTNAME").unwrap_or_default(),
		std::time::SystemTime::now()
			.duration_since(std::time::UNIX_EPOCH)
			.unwrap()
			.as_nanos() as u64
	);

	let machine = config.actuator_url.as_ref().map(|url| {
		let token = config.api_token.as_deref().unwrap_or_default();
		machine::Machine::new(
			machine::Config {
				central: config.role == config::Role::Central,
				parts: state::PARTS.to_vec(),
				release: buildinfo::VERSION,
				instance: instance.clone(),
				timing: machine::Timing::production(config.idle_time),
			},
			state.clone(),
			actuator::Client::new(url, token),
			apiclient::Client::new(&config.api_upstreams, token),
		)
	});

	// The lease is given up as the signal arrives, and the machine goes on following while the
	// connections drain.
	let root = CancellationToken::new();
	let running = machine.clone().map(|m| tokio::spawn(m.run(root.clone())));
	if let Some(machine) = machine.clone() {
		let shutdown = shutdown.clone();
		tokio::spawn(async move {
			shutdown.cancelled().await;
			machine.step_down().await;
		});
	}

	let front_for = |root: &std::path::Path| {
		front::router(front::Front {
			files: files::Files::new(root),
			proxy: proxy.clone(),
			limits: limits.clone(),
			state: state.clone(),
			pages: pages.clone(),
			trusted: trusted.clone(),
		})
	};
	let mut servers = vec![tokio::spawn(server::serve(
		config.listen,
		front_for(&config.web_root),
		shutdown.clone(),
	))];
	if let Some((addr, root)) = &config.portal {
		servers.push(tokio::spawn(server::serve(
			*addr,
			front_for(root),
			shutdown.clone(),
		)));
	}
	let status = status::router(status::Status {
		state: state.clone(),
		machine: machine.clone(),
		idle_time: config.idle_time,
		instance,
	});
	servers.push(tokio::spawn(server::serve(
		config.status_listen,
		status,
		shutdown.clone(),
	)));

	for server in servers {
		server
			.await
			.map_err(|e| e.to_string())?
			.map_err(|e| e.to_string())?;
	}
	root.cancel();
	if let Some(running) = running {
		let _ = running.await;
	}
	Ok(())
}
