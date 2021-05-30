import { html, TemplateResult, render } from "lit"
import { Init, runApp, Update, View } from "./app"
import { Variant, impl, matchExhaustive } from "@practical-fp/union-types"
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

const view: View<State, Msg, TemplateResult> = (state, dispatch) => html`
    <h1>${state}</h1>
    <button @click=${() => dispatch(Increment())}>+</button>
    <button @click=${() => dispatch(Decrement())}>-</button>
`

const root = document.getElementById("root")!
runApp(init, update, view, result => render(result, root), services)
