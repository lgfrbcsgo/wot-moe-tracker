import { html, render } from "lit-html"
import { openConnection } from "./connection"
import { openDatabase, processMoeMessage } from "./database"
import { createState } from "./state"
import { throttleAnimationFrame } from "./stream"
import { assertNever } from "@practical-fp/union-types"
import { Variant } from "./types"

import url from "../public/tanks.json"
console.log(url)

type State = Variant<"loading"> | Variant<"content"> | Variant<"error">

const { committer, state$ } = createState<State>({ type: "loading" })

const setLoaded = committer(() => ({ type: "content" }))

const setError = committer(() => ({ type: "error" }))

async function init() {
    const db = await openDatabase()
    setLoaded()
    const { messages$, status$ } = openConnection()
    messages$.observe(message => processMoeMessage(db, message))
}

function view(state: State) {
    switch (state.type) {
        case "loading":
            return html`<h1>Loading...</h1>`
        case "content":
            return html`<h1>Works!</h1>`
        case "error":
            return html`<h1>Error :(</h1>`
        default:
            assertNever(state)
    }
}

const root = document.getElementById("root")!
throttleAnimationFrame(state$).observe(state => render(view(state), root))
init().catch(error => {
    console.error(error)
    setError()
})
