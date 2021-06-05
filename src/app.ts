import { Init, Update, View } from "./runtime"
import { html } from "lit-html"
import { Connection, ConnectionMessage, HistoryReceived, UpdateReceived } from "./connection"
import { Database, DatabaseStatus, Open } from "./database"
import { impl, tag, Variant } from "@practical-fp/union-types"
import { __, match, select } from "ts-pattern"

export type Message =
    | Variant<"ConnectionMessage", ConnectionMessage>
    | Variant<"DatabaseStatusChange", DatabaseStatus>

const { ConnectionMessage, DatabaseStatusChange } = impl<Message>()

const connection = new Connection()
const database = new Database()

export type State = undefined

export const init: Init<State, Message> = () => [
    undefined,
    () => database.open(),
    dispatch => connection.observe(message => dispatch(ConnectionMessage(message))),
    dispatch => database.observe(status => dispatch(DatabaseStatusChange(status))),
]

export const update: Update<State, Message> = (state, message) => {
    console.log(message)
    return match(message)
        .with(
            tag(ConnectionMessage.tag, tag(UpdateReceived.tag, select())),
            update => [undefined, () => database.processUpdate(update)] as const,
        )
        .with(
            tag(ConnectionMessage.tag, tag(HistoryReceived.tag, select())),
            history => [undefined, () => database.processHistory(history)] as const,
        )
        .with(DatabaseStatusChange(Open()), () => [undefined, () => connection.connect()] as const)
        .with(__, () => [undefined] as const)
        .exhaustive()
}

export const view: View<State, Message> = (state, dispatch) => html` <h1>Works!</h1> `
