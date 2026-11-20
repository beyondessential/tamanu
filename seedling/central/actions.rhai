// spec: SDDEF#first-run
app.on_action("provision", |rt, param| {
    let file = param["file"];
    if file.starts_with("/") || file.contains("..") {
        throw "file must be a path within the site volume";
    }
    rt.start(configure_server.call(app.job())
        .description("Provision the server from a provisioning file")
        .mount("/provisioning", app.external_volume(param["site_volume"]))
        .workdir("/provisioning")
        .arg(["provision", `/provisioning/${file}`])
    ).terminated_eventually().ensure_success();
}, #{
    description: "Provision a newly installed server from a provisioning file on a site volume",
    params: #{
        site: #{
            kind: "volume",
            required: true,
            description: "Site volume holding the provisioning file and the files it refers to",
        },
        file: #{
            kind: "text",
            required: true,
            default_value: "provisioning.json5",
            description: "Path of the provisioning file within the site volume",
        },
    },
});

app.on_shell("node", |_rt, shell, _param| {
    shell.attach(configure_server.call(app.job()).arg(["shell"]));
}, #{ description: "Tamanu shell in the central server image" });
