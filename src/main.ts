import { html, render } from "lit-html"
import { openConnection } from "./connection"
import { openDatabase, processMoeMessage } from "./database"
import { createState, Mapper } from "./state"
import { throttleAnimationFrame } from "./stream"
import { assertNever } from "@practical-fp/union-types"
import { isVehicle, Variant, Vehicle } from "./types"

import tanksJsonUrl from "../public/tanks.json"
import { array } from "./guards"

type State = Variant<"loading"> | Variant<"content", { vehicles: Vehicle[] }> | Variant<"error">

const { mapState, state$ } = createState<State>({ type: "loading" })

function setLoaded(vehicles: Vehicle[]): Mapper<State> {
    return () => ({ type: "content", vehicles })
}

function setError(): Mapper<State> {
    return () => ({ type: "error" })
}

async function init() {
    const db = await openDatabase()
    const response = await fetch(tanksJsonUrl)
    const vehicles = await response.json()
    if (!array(isVehicle)(vehicles)) {
        throw new Error("Invalid data format")
    }
    mapState(setLoaded(vehicles))
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
    mapState(setError())
})
