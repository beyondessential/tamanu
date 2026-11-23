app.on_shell("node", |_rt, shell, _param| {
    shell.attach(configure.call(app.job()).arg(["shell"]));
}, #{ description: "Node.js REPL with the server's models loaded" });
