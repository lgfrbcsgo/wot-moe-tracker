import { render, TemplateResult } from "lit-html"
import { AnyVariant } from "@practical-fp/union-types"

export type Dispatch<Msg extends AnyVariant> = (message: Msg) => void
export type Command<Msg extends AnyVariant> = (dispatch: Dispatch<Msg>) => void

export type UpdateReturn<State, Msg extends AnyVariant> = readonly [state: State, ...commands: Array<Command<Msg>>]

export type Init<State, Msg extends AnyVariant> = () => UpdateReturn<State, Msg>
export type Update<State, Msg extends AnyVariant> = (state: State, message: Msg) => UpdateReturn<State, Msg>
export type View<State, Msg extends AnyVariant> = (state: State, dispatch: Dispatch<Msg>) => TemplateResult

export function runApp<State, Msg extends AnyVariant>(
    init: Init<State, Msg>,
    update: Update<State, Msg>,
    view: View<State, Msg>,
    element: HTMLElement,
) {
    const devtools = new Devtools()

    let [state, ...commands] = init()

    const dispatch = (msg: Msg) => {
        const [nextState, ...commands] = update(state, msg)
        if (state !== nextState) {
            state = nextState
            queueRender(state)
        }
        devtools.send(msg, state)
        executeCommands(commands)
    }

    const executeCommands = (commands: Array<Command<Msg>>) => {
        commands.forEach(command => command(dispatch))
    }

    let animationFrameHandle: number | undefined = undefined
    const queueRender = (state: State) => {
        if (animationFrameHandle !== undefined) {
            cancelAnimationFrame(animationFrameHandle)
        }
        animationFrameHandle = requestAnimationFrame(() => {
            const viewResult = view(state, dispatch)
            render(viewResult, element)
        })
    }

    queueRender(state)
    devtools.init(state)
    executeCommands(commands)
}


class Devtools {
    private connection: any

    constructor() {
        this.connection = (window as any).__REDUX_DEVTOOLS_EXTENSION__?.connect({
            autoPause: true,
            features: {},
            maxAge: 25,
        })
    }

    init(state: unknown) {
        queueMicrotask(() => this.connection?.init(state))
    }

    send(msg: AnyVariant, state: unknown) {
        queueMicrotask(() =>
            this.connection?.send({
                type: msg.tag,
                payload: msg.value,
            }, state),
        )
    }
}
