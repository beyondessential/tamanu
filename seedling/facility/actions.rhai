app.on_shell("node", |_rt, shell, _param| {
    shell.attach(configure.call(app.job()).arg(["shell"]));
}, #{ description: "Tamanu shell" });
