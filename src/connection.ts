import { impl, Variant } from "@practical-fp/union-types"
import { array, dictionary, GuardedValue, isNumber, isString, literal, record } from "./guards"
import { Emitter, Observable } from "./emitter"

export type ConnectionStatus =
    | Variant<"Connecting">
    | Variant<"Connected">
    | Variant<"Disconnected">
    | Variant<"Irrecoverable">

export const { Connecting, Connected, Disconnected, Irrecoverable } = impl<ConnectionStatus>()

export type ConnectionMessage =
    | Variant<"StatusChanged", ConnectionStatus>
    | Variant<"UpdateReceived", MarkOfExcellenceUpdate>
    | Variant<"HistoryReceived", MarkOfExcellenceHistory>

export const { StatusChanged, UpdateReceived, HistoryReceived } = impl<ConnectionMessage>()

export class Connection implements Observable<ConnectionMessage> {
    private status: ConnectionStatus = Disconnected()
    private socket: WebSocket | undefined
    private emitter = new Emitter<ConnectionMessage>()

    connect() {
        if (this.socket) return
        this.handleStatusChange(Connecting())
        this.socket = new WebSocket("ws://localhost:15456")
        this.socket.onopen = () => this.handleStatusChange(Connected())
        this.socket.onclose = () => this.handleStatusChange(Disconnected())
        this.socket.onmessage = ({ data }) => this.handleMessage(data)
    }

    observe(observer: (value: ConnectionMessage) => void) {
        observer(StatusChanged(this.status))
        return this.emitter.observe(observer)
    }

    private handleMessage(data: unknown) {
        if (!isString(data)) {
            return this.handleStatusChange(Irrecoverable())
        }

        let payload: unknown
        try {
            payload = JSON.parse(data)
        } catch (e) {
            return this.handleStatusChange(Irrecoverable())
        }

        if (isMarkOfExcellenceUpdate(payload)) {
            return this.emitter.emit(UpdateReceived(payload))
        } else if (isMarkOfExcellenceHistory(payload)) {
            return this.emitter.emit(HistoryReceived(payload))
        } else {
            return this.handleStatusChange(Irrecoverable())
        }
    }

    private handleStatusChange(newStatus: ConnectionStatus) {
        if (Disconnected.is(newStatus)) {
            this.socket = undefined
            setTimeout(() => this.connect(), 5000)
        }
        if (Irrecoverable.is(newStatus)) {
            this.socket?.close()
        }
        this.status = newStatus
        this.emitter.emit(StatusChanged(newStatus))
    }
}

const isMarkOfExcellence = record({
    percentage: isNumber,
    damage: isNumber,
    battles: isNumber,
})

export type MarkOfExcellenceHistory = GuardedValue<typeof isMarkOfExcellenceHistory>
export const isMarkOfExcellenceHistory = record({
    type: literal("MOE_HISTORY"),
    accounts: dictionary(dictionary(array(isMarkOfExcellence))),
})

export type MarkOfExcellenceUpdate = GuardedValue<typeof isMarkOfExcellenceUpdate>
export const isMarkOfExcellenceUpdate = record({
    type: literal("MOE_UPDATE"),
    account: isString,
    vehicles: dictionary(isMarkOfExcellence),
})
