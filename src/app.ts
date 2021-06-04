import { Init, Update, View } from "./runtime"
import { html } from "lit-html"
import { Connection, ConnectionMessage } from "./connection"

export type Msg = ConnectionMessage

const connection = new Connection()
connection.connect()

export type State = undefined

export const init: Init<State, Msg> = () => [undefined, dispatch => connection.observe(dispatch)]

export const update: Update<State, Msg> = (state, message) => [
    undefined,
    () => console.log(message),
]

export const view: View<State, Msg> = (state, dispatch) => html` <h1>Works!</h1> `
