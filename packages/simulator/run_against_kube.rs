#!/usr/bin/env -S cargo +nightly -Zscript
//! ```cargo
//! [package]
//! edition = "2021"
//!
//! [dependencies]
//! clap = { version = "4.4.0", features = ["derive"] }
//! futures = "0.3.29"
//! kube = { version = "0.86.0", features = ["runtime", "derive"] }
//! k8s-openapi = { version = "0.20.0", features = ["v1_28"] }
//! miette = { version = "5.10.0", features = ["fancy"] }
//! rand = "0.8.5"
//! tokio = { version = "1.33.0", features = ["full"] }
//! tracing = "0.1.40"
//! tracing-subscriber = { version = "0.3.17", features = ["env-filter"] }
//! ```

use std::{collections::HashMap, process::Stdio, str::FromStr};

use clap::Parser;
use k8s_openapi::api::core::v1::Pod;
use kube::{
    api::{Api, ListParams, ResourceExt},
    Client,
};
use miette::{miette, IntoDiagnostic, Result};
use rand::prelude::*;
use tokio::{
    io::AsyncReadExt,
    process::{Child, Command},
    task::JoinSet,
};
use tracing::{debug, error, info, trace};
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

#[derive(Clone, Debug, Parser)]
struct Args {
    /// Namespace this Tamanu is deployed to
    #[clap(short, long)]
    pub namespace: String,

    /// How many facilities to run simulation on
    #[clap(short, long)]
    pub facilities: Option<usize>,

    /// Simulator command
    #[clap(short, long)]
    pub command: String,
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::registry()
        .with(fmt::layer())
        .with(EnvFilter::from_default_env())
        .init();

    let args = Args::parse();
    debug!(?args, "parsed arguments");

    debug!("connecting to k8s");
    let client = Client::try_default().await.into_diagnostic()?;
    debug!("connected to k8s");

    let central = PortForward::create(
        &args,
        &central_lb_resource_name(client.clone(), &args).await?,
        80,
    )
    .await?;

    let mut facilities = HashMap::new();
    let mut resources = facility_api_resource_names(client.clone(), &args).await?;
    let chosen_resources = if let Some(n) = args.facilities {
        resources.partial_shuffle(&mut thread_rng(), n).0.to_vec()
    } else {
        resources
    };
    for resource in chosen_resources {
        let fwd = PortForward::create(&args, &resource, 3000).await?;
        facilities.insert(resource, fwd);
    }

    let mut tasks = JoinSet::<Result<_>>::new();
    for (name, fwd) in facilities {
        let cmd = args.command.clone();
        tasks.spawn(async move {
            let mut command = Command::new("/bin/sh");
            command
                .arg("-c")
                .arg(&cmd)
                .stdout(Stdio::inherit())
                .stderr(Stdio::inherit())
                .env(
                    "SIMULATOR_CENTRAL",
                    format!("http://localhost:{}", central.local_port),
                )
                .env(
                    "SIMULATOR_FACILITY",
                    format!("http://localhost:{}", fwd.local_port),
                )
                .kill_on_drop(true);

            debug!(facility=%name, ?command, "starting simulator");
            let mut child = command.spawn().into_diagnostic()?;
            info!(facility=%name, command=%cmd, "simulating...");
            child.wait().await.into_diagnostic()?;
            info!(%name, "done with facility");
            Ok(fwd)
        });
    }

    while let Some(task) = tasks.join_next().await {
        match task {
            Err(err) => error!("task join failed: {err}"),
            Ok(Err(err)) => error!("task work failed: {err}"),
            Ok(Ok(fwd)) => info!("closing forwarded port {}", fwd.local_port),
        }
    }

    info!("all done");
    Ok(())
}

async fn central_lb_resource_name(client: Client, args: &Args) -> Result<String> {
    let pods: Api<Pod> = Api::namespaced(client, &args.namespace);
    pods.list(&ListParams::default())
        .await
        .into_diagnostic()?
        .into_iter()
        .find_map(|s| {
            let name = s.name_any();
            if name.starts_with("central-haproxy-") {
                Some(format!("pod/{name}"))
            } else {
                None
            }
        })
        .ok_or_else(|| miette!("central-lb not found"))
}

async fn facility_api_resource_names(client: Client, args: &Args) -> Result<Vec<String>> {
    let pods: Api<Pod> = Api::namespaced(client, &args.namespace);
    let names: Vec<_> = pods
        .list(&ListParams::default())
        .await
        .into_diagnostic()?
        .into_iter()
        .filter_map(|s| {
            let name = s.name_any();
            if name.starts_with("facility-") && name.contains("-api-") {
                Some(format!("pod/{name}"))
            } else {
                None
            }
        })
        .collect();
    info!(count = names.len(), "found facilities");
    Ok(names)
}

#[derive(Debug)]
struct PortForward {
    pub local_port: u16,

    #[allow(dead_code)] // only held so it drops when this does
    child: Child,
}

impl PortForward {
    async fn create(args: &Args, resource: &str, port: u16) -> Result<Self> {
        let mut command = Command::new("/usr/bin/kubectl");
        command
            .arg("-n")
            .arg(&args.namespace)
            .arg("port-forward")
            .arg(resource)
            .arg(&format!(":{port}"))
            .stdout(Stdio::piped())
            .kill_on_drop(true);

        debug!(?command, "starting port forward");
        let mut child = command.spawn().into_diagnostic()?;

        let Some(ref mut output) = &mut child.stdout else {
            return Err(miette!("command must have stdout available"));
        };

        debug!("read port forward info from output");
        let mut stdout = String::new();
        loop {
            trace!("read up to 1024 bytes");
            let mut buffer = [0; 1024];
            let bytes_read = output.read(&mut buffer).await.into_diagnostic()?;
            if bytes_read == 0 {
                break;
            }
            let fragment = std::str::from_utf8(&buffer[0..bytes_read]).into_diagnostic()?;
            trace!(?fragment, "read some data");
            stdout = stdout + &fragment;

            if stdout.contains('\n') {
                break;
            }
        }

        debug!(?stdout, "parsing port forward info");
        let local_port = stdout
            .split(|c| c == ':' || c == ' ')
            .find_map(|word| u16::from_str(word).ok())
            .ok_or_else(|| miette!("did not find forwarded port"))?;
        info!("forwarding {resource}:{port} to {local_port}");

        Ok(Self { local_port, child })
    }
}
