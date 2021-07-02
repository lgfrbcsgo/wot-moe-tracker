import { Init, Update, View } from "./runtime"
import { html } from "lit-html"
import { Connection, ConnectionStatus, MoeMessage } from "./connection"
import { Database } from "./database"
import { impl, matchExhaustive, Variant } from "@practical-fp/union-types"

export type Message =
    | Variant<"DatabaseInitialized">
    | Variant<"ConnectionStatusChange", ConnectionStatus>
    | Variant<"MoeMessageReceived", MoeMessage>

const { DatabaseInitialized, ConnectionStatusChange, MoeMessageReceived } = impl<Message>()

const connection = new Connection()
const database = new Database()

export type State = undefined

export const init: Init<State, Message> = () => [
    undefined,
    dispatch => database.open().then(() => dispatch(DatabaseInitialized())),
    dispatch => connection.messages$.observe(message => dispatch(MoeMessageReceived(message))),
    dispatch => connection.status$.observe(status => dispatch(ConnectionStatusChange(status))),
]

export const update: Update<State, Message> = (state, message) => {
    console.log(message)
    return matchExhaustive(message, {
        DatabaseInitialized: () => [undefined, () => connection.connect()] as const,
        ConnectionStatusChange: () => [undefined] as const,
        MoeMessageReceived: message => {
            switch (message.type) {
                case "MOE_UPDATE":
                    return [undefined, () => database.processUpdate(message)] as const
                case "MOE_HISTORY":
                    return [undefined, () => database.processHistory(message)] as const
                default:
                    return [undefined] as const
            }
        },
    })
}

export const view: View<State, Message> = () => html`<h1>Works!</h1>`
