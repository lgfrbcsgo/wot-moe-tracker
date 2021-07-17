import { html, render } from "lit-html"
import { openConnection } from "./connection"
import { openDatabase, processMoeMessage } from "./database"
import { state$ } from "./state"
import { throttleAnimationFrame } from "./stream"

const root = document.getElementById("root")!

async function init() {
    const db = await openDatabase()
    const { messages$, status$ } = openConnection()
    messages$.observe(message => processMoeMessage(db, message))
    throttleAnimationFrame(state$).observe(state => render(html`<h1>Works!</h1>`, root))
}

init().catch(console.error)
