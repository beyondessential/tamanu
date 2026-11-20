app.on_shell("node", |_rt, shell, _param| {
    shell.attach(configure_server.call(app.job()).arg(["shell"]));
}, #{ description: "Tamanu shell in the facility server image" });
