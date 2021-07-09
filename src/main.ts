import { html, render } from "lit-html"
import { Connection, ConnectionStatus, MoeMessage } from "./connection"
import { Database } from "./database"
import { assertNever } from "@practical-fp/union-types"
import { createRuntime } from "./runtime"

const connection = new Connection()
const database = new Database()

const root = document.getElementById("root")!
const { action, queueEffect } = createRuntime(undefined, state =>
    render(html`<h1>Works!</h1>`, root),
)

const databaseInitialized = action(state => {
    queueEffect(() => connection.connect())
    return state
})

const connectionStatusChanged = action((state, connectionStatus: ConnectionStatus) => {
    return state
})

const moeMessageReceived = action((state, message: MoeMessage) => {
    switch (message.type) {
        case "MOE_UPDATE":
            queueEffect(() => database.processUpdate(message))
            break
        case "MOE_HISTORY":
            queueEffect(() => database.processHistory(message))
            break
        default:
            assertNever(message)
    }
    return state
})

connection.messages$.observe(moeMessageReceived)
connection.status$.observe(connectionStatusChanged)
database.open().then(databaseInitialized)
