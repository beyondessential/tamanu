//! Serves one built frontend, configured from the environment.
//!
//! spec: SUPV#configuration

use std::process::ExitCode;

use tamanu_supervisor::{config::Frontend, files::Files, frontend, listen, server};
use tokio_util::sync::CancellationToken;
use tracing_subscriber::EnvFilter;

const USAGE: &str = "usage: tamanu-supervisor [--check]

Serves the built frontend at FRONTEND_ROOT on the addresses in BIND_ADDRESS.
--check prints the configuration and exits.
";

/// Which log lines are written.
const LOG_VAR: &str = "TAMANU_SUPERVISOR_LOG";

fn main() -> ExitCode {
	let filter = match std::env::var(LOG_VAR) {
		Ok(directives) if !directives.trim().is_empty() => match EnvFilter::try_new(&directives) {
			Ok(filter) => filter,
			Err(error) => {
				eprintln!("{LOG_VAR}: {error}");
				return ExitCode::FAILURE;
			}
		},
		_ => EnvFilter::new("info"),
	};
	tracing_subscriber::fmt()
		.json()
		.with_env_filter(filter)
		.with_writer(std::io::stderr)
		.init();

	let args: Vec<String> = std::env::args().skip(1).collect();
	let check = match args.as_slice() {
		[] => false,
		[flag] if flag == "--check" => true,
		_ => {
			eprint!("{USAGE}");
			return ExitCode::from(2);
		}
	};
	let config = match Frontend::from_env() {
		Ok(config) => config,
		Err(problems) => {
			eprint!("{problems}");
			return ExitCode::FAILURE;
		}
	};
	if check {
		if let Err(error) = Files::new(&config.root, |_| None) {
			eprintln!("FRONTEND_ROOT: {error}");
			return ExitCode::FAILURE;
		}
		println!("{config:#?}");
		return ExitCode::SUCCESS;
	}

	let runtime = tokio::runtime::Builder::new_multi_thread()
		.enable_all()
		.build()
		.expect("starting the runtime");
	match runtime.block_on(run(config)) {
		Ok(()) => ExitCode::SUCCESS,
		Err(error) => {
			tracing::error!(%error, "stopped");
			ExitCode::FAILURE
		}
	}
}

async fn run(config: Frontend) -> std::io::Result<()> {
	let files = Files::new(&config.root, |name| std::env::var(name).ok())
		.map_err(|error| std::io::Error::new(error.kind(), format!("FRONTEND_ROOT: {error}")))?;
	let router = frontend(files);
	let shutdown = stop_signal();

	let mut servers = tokio::task::JoinSet::new();
	for bind in config.binds {
		let listener = listen::bind(bind).map_err(|error| {
			std::io::Error::new(error.kind(), format!("BIND_ADDRESS {bind}: {error}"))
		})?;
		tracing::info!(address = %listener.local_addr()?, root = %config.root.display(), "serving");
		servers.spawn(server::serve(listener, router.clone(), shutdown.clone()));
	}
	servers.join_all().await;
	Ok(())
}

/// Cancelled on the first stop signal: `SIGTERM` or `SIGINT`, or on Windows the console's Ctrl-C
/// or Ctrl-Break, which the Windows runtime sends to stop a frontend.
fn stop_signal() -> CancellationToken {
	let token = CancellationToken::new();
	let stop = token.clone();
	tokio::spawn(async move {
		#[cfg(unix)]
		{
			use tokio::signal::unix::{SignalKind, signal};
			let mut terminate = signal(SignalKind::terminate()).expect("listening for SIGTERM");
			tokio::select! {
				_ = terminate.recv() => {}
				_ = tokio::signal::ctrl_c() => {}
			}
		}
		#[cfg(windows)]
		{
			let mut ctrl_break =
				tokio::signal::windows::ctrl_break().expect("listening for Ctrl-Break");
			tokio::select! {
				_ = ctrl_break.recv() => {}
				_ = tokio::signal::ctrl_c() => {}
			}
		}
		tracing::info!("stopping");
		stop.cancel();
	});
	token
}
