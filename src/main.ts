import { runApp } from "./runtime"
import { services } from "./services"
import { init, update, view } from "./app"

const root = document.getElementById("root")!
runApp(init, update, view, services, root)
