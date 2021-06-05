import { Init, Update, View } from "./runtime"
import { html } from "lit-html"
import { Connection, ConnectionMessage } from "./connection"
import { Database, DatabaseStatus } from "./database"
import { impl, Variant } from "@practical-fp/union-types"

export type Message =
    | Variant<"ConnectionMessage", ConnectionMessage>
    | Variant<"DatabaseStatusChange", DatabaseStatus>

const { ConnectionMessage, DatabaseStatusChange } = impl<Message>()

const connection = new Connection()
connection.connect()

const database = new Database()
database.open()

export type State = undefined

export const init: Init<State, Message> = () => [
    undefined,
    dispatch => connection.observe(message => dispatch(ConnectionMessage(message))),
    dispatch => database.observe(status => dispatch(DatabaseStatusChange(status))),
]

export const update: Update<State, Message> = (state, message) => [
    undefined,
    () => console.log(message),
]

export const view: View<State, Message> = (state, dispatch) => html` <h1>Works!</h1> `
