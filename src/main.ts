import { html, render } from "lit-html"
import { Connection } from "./connection"
import { openDatabase, processMoeMessage } from "./database"
import { state$ } from "./state"
import { throttleAnimationFrame } from "./stream"

const root = document.getElementById("root")!

async function init() {
    const db = await openDatabase()
    const connection = new Connection()
    connection.connect()
    connection.messages$.observe(message => processMoeMessage(db, message))
    throttleAnimationFrame(state$).observe(state => render(html`<h1>Works!</h1>`, root))
}

init().catch(console.error)
