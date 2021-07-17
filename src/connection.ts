import { isString } from "./guards"
import { reactiveValue, stream } from "./stream"
import { isMoeMessage, MoeMessage } from "./types"

export const enum ConnectionStatus {
    Connecting,
    Connected,
    Disconnected,
    InvalidMessageFormat,
}

export function openConnection() {
    const status$ = reactiveValue(ConnectionStatus.Disconnected)
    const messages$ = stream<MoeMessage>()

    let socket: WebSocket | undefined = undefined

    const connect = () => {
        if (socket) return
        socket = new WebSocket("ws://localhost:15456")
        socket.onopen = () => handleStatusChange(ConnectionStatus.Connected)
        socket.onclose = () => handleStatusChange(ConnectionStatus.Disconnected)
        socket.onmessage = ({ data }) => handleMessage(data)
        handleStatusChange(ConnectionStatus.Connecting)
    }

    const handleMessage = (data: unknown) => {
        if (!isString(data)) {
            return handleStatusChange(ConnectionStatus.InvalidMessageFormat)
        }

        let payload: unknown
        try {
            payload = JSON.parse(data)
        } catch (e) {
            return handleStatusChange(ConnectionStatus.InvalidMessageFormat)
        }

        if (isMoeMessage(payload)) {
            return messages$.emit(payload)
        } else {
            return handleStatusChange(ConnectionStatus.InvalidMessageFormat)
        }
    }

    const handleStatusChange = (newStatus: ConnectionStatus) => {
        if (ConnectionStatus.Disconnected === newStatus) {
            socket = undefined
            if (ConnectionStatus.InvalidMessageFormat === status$.value) return
            setTimeout(connect, 10000)
        }
        if (ConnectionStatus.InvalidMessageFormat === newStatus) {
            socket?.close()
        }
        status$.emit(newStatus)
    }

    return {
        status$: status$.readonly(),
        messages$: messages$.readonly(),
    }
}
