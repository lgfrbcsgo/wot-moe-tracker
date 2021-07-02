import {
    anyOf,
    array,
    dictionary,
    GuardedValue,
    isNumber,
    isString,
    literal,
    record,
} from "./guards"
import { WritableReactiveValue, WritableStream } from "./stream"

export const enum ConnectionStatus {
    Connecting,
    Connected,
    Disconnected,
    InvalidMessageFormat,
}

export class Connection {
    private _status$ = new WritableReactiveValue(ConnectionStatus.Disconnected)
    private _messages$ = new WritableStream<MoeMessage>()
    private socket: WebSocket | undefined

    readonly status$ = this._status$.readonly()
    readonly messages$ = this._messages$.readonly()

    connect() {
        if (this.socket) return
        this.socket = new WebSocket("ws://localhost:15456")
        this.socket.onopen = () => this.handleStatusChange(ConnectionStatus.Connected)
        this.socket.onclose = () => this.handleStatusChange(ConnectionStatus.Disconnected)
        this.socket.onmessage = ({ data }) => this.handleMessage(data)
        this.handleStatusChange(ConnectionStatus.Connecting)
    }

    private handleMessage(data: unknown) {
        if (!isString(data)) {
            return this.handleStatusChange(ConnectionStatus.InvalidMessageFormat)
        }

        let payload: unknown
        try {
            payload = JSON.parse(data)
        } catch (e) {
            return this.handleStatusChange(ConnectionStatus.InvalidMessageFormat)
        }

        if (isMoeMessage(payload)) {
            return this._messages$.emit(payload)
        } else {
            return this.handleStatusChange(ConnectionStatus.InvalidMessageFormat)
        }
    }

    private handleStatusChange(newStatus: ConnectionStatus) {
        if (ConnectionStatus.Disconnected === newStatus) {
            this.socket = undefined
            if (ConnectionStatus.InvalidMessageFormat === this._status$.value) return
            setTimeout(() => this.connect(), 10000)
        }
        if (ConnectionStatus.InvalidMessageFormat === newStatus) {
            this.socket?.close()
        }
        this._status$.emit(newStatus)
    }
}

const isMoe = record({
    percentage: isNumber,
    damage: isNumber,
    battles: isNumber,
    marks: isNumber,
})

export type MoeHistory = GuardedValue<typeof isMoeHistory>
export const isMoeHistory = record({
    type: literal("MOE_HISTORY"),
    accounts: array(
        record({
            username: isString,
            realm: isString,
            vehicles: dictionary(array(isMoe)),
        }),
    ),
})

export type MoeUpdate = GuardedValue<typeof isMoeUpdate>
export const isMoeUpdate = record({
    type: literal("MOE_UPDATE"),
    username: isString,
    realm: isString,
    vehicles: dictionary(isMoe),
})

export type MoeMessage = GuardedValue<typeof isMoeMessage>
export const isMoeMessage = anyOf(isMoeUpdate, isMoeHistory)
