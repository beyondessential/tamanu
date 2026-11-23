// spec: SDDEF#first-run
app.on_action("provision", |rt, param| {
    let file = param["file"];
    if file.starts_with("/") || file.contains("..") {
        throw "file must be a path within the site volume";
    }
    rt.start(configure.call(app.job())
        .description("Provision")
        .mount("/provisioning", app.external_volume(param["site_volume"]))
        .workdir("/provisioning")
        .arg(["provision", `/provisioning/${file}`])
    ).terminated_eventually().ensure_success();
}, #{
    description: "Provision a new server from a file on a site volume; refused if the file's admin users already exist",
    params: #{
        site: #{
            kind: "volume",
            required: true,
            description: "Site volume holding the provisioning files",
        },
        file: #{
            kind: "text",
            required: true,
            default_value: "provisioning.json5",
            description: "Provisioning file, relative to the site volume",
        },
    },
});

app.on_shell("node", |_rt, shell, _param| {
    shell.attach(configure.call(app.job()).arg(["shell"]));
}, #{ description: "Node.js REPL with the server's models loaded" });
