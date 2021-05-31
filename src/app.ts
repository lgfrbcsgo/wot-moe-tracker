import { Init, Update, View } from "./runtime"
import { impl, matchExhaustive, Variant } from "@practical-fp/union-types"
import { html } from "lit-html"

export type Msg = Variant<"Increment"> | Variant<"Decrement">
export const { Increment, Decrement } = impl<Msg>()

export type State = number

export const init: Init<State, Msg> = () => [0]

export const update: Update<State, Msg> = (state, message) =>
    matchExhaustive(message, {
        Increment: () => [state + 1] as const,
        Decrement: () => [state - 1] as const,
    })

export const view: View<State, Msg> = (state, dispatch) => html`
    <h1>${state}</h1>
    <button @click=${() => dispatch(Increment())}>+</button>
    <button @click=${() => dispatch(Decrement())}>-</button>
`
