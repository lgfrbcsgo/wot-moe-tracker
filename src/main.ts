import { html } from "lit-html"
import { Init, runApp, Update, View } from "./app"
import { impl, matchExhaustive, Variant } from "@practical-fp/union-types"
import { services, Services } from "./services"

type Msg = Variant<"Increment"> | Variant<"Decrement">

const { Increment, Decrement } = impl<Msg>()

type State = number

const init: Init<State, Msg, Services> = () => [0]

const update: Update<State, Msg, Services> = (state, message) =>
    matchExhaustive(message, {
        Increment: () => [state + 1] as const,
        Decrement: () => [state - 1] as const,
    })

const view: View<State, Msg> = (state, dispatch) => html`
    <h1>${state}</h1>
    <button @click=${() => dispatch(Increment())}>+</button>
    <button @click=${() => dispatch(Decrement())}>-</button>
`

const root = document.getElementById("root")!
runApp(init, update, view, services, root)
