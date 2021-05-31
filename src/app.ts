import { Command, Init, Update, View } from "./runtime"
import { impl, Variant } from "@practical-fp/union-types"
import { html } from "lit-html"
import {
    isMarkOfExcellenceHistory,
    isMarkOfExcellenceUpdate,
    MarkOfExcellenceHistory,
    MarkOfExcellenceUpdate,
} from "./serverMessages"
import { isString } from "./guards"

export type Msg =
    | Variant<"Connecting">
    | Variant<"Connected">
    | Variant<"UpdateReceived", MarkOfExcellenceUpdate>
    | Variant<"HistoryReceived", MarkOfExcellenceHistory>
    | Variant<"MessageDecodeFailure">
    | Variant<"ConnectionError">
    | Variant<"Closed">

export const {
    Connecting,
    Connected,
    UpdateReceived,
    HistoryReceived,
    MessageDecodeFailure,
    ConnectionError,
    Closed,
} = impl<Msg>()

const connect: Command<Msg> = dispatch => {
    const socket = new WebSocket("ws://localhost:15456")
    socket.onopen = () => dispatch(Connected())
    socket.onmessage = event => {
        if (!isString(event.data)) {
            return dispatch(MessageDecodeFailure())
        }
        let payload: unknown
        try {
            payload = JSON.parse(event.data)
        } catch (e) {
            return dispatch(MessageDecodeFailure())
        }
        if (isMarkOfExcellenceUpdate(payload)) {
            return dispatch(UpdateReceived(payload))
        } else if (isMarkOfExcellenceHistory(payload)) {
            return dispatch(HistoryReceived(payload))
        } else {
            return dispatch(MessageDecodeFailure())
        }
    }
    socket.onerror = () => dispatch(ConnectionError())
    socket.onclose = () => dispatch(Closed())

    dispatch(Connecting())
}

export type State = undefined

export const init: Init<State, Msg> = () => [undefined, connect]

export const update: Update<State, Msg> = (state, message) => [
    undefined,
    () => console.log(message),
]

export const view: View<State, Msg> = (state, dispatch) => html` <h1>Works!</h1> `
