// Command fake-actuator runs an in-memory actuator, for running the supervisor
// locally. It starts and stops nothing: parts only change state in memory.
//
//	fake-actuator -listen 127.0.0.1:7000 -delay 2s
//
// Set TAMANU_SUPERVISOR_ACTUATOR_URL=http://127.0.0.1:7000 to use it. While
// it runs, PUT true or false to /fake/upgrading or /fake/controls-parts to
// change those at will.
package main

import (
	"flag"
	"log"
	"net/http"

	"github.com/beyondessential/tamanu/packages/supervisor/internal/actuator/fake"
)

func main() {
	listen := flag.String("listen", "127.0.0.1:7000", "address to listen on")
	delay := flag.Duration("delay", 0, "how long a part takes to start or stop")
	controls := flag.Bool("controls-parts", true, "whether the actuator controls the parts")
	upgrading := flag.Bool("upgrading", false, "whether an upgrade is in progress")
	flag.Parse()

	a := fake.New()
	a.SetDelay(*delay)
	a.SetControlsParts(*controls)
	a.SetUpgrading(*upgrading)

	log.Printf("fake actuator listening on http://%s", *listen)
	log.Fatal(http.ListenAndServe(*listen, a))
}
