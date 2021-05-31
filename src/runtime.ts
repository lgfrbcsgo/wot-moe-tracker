import { render, TemplateResult } from "lit-html"

export type Dispatch<Msg> = (message: Msg) => void
export type Command<Msg> = (dispatch: Dispatch<Msg>) => void

export type UpdateReturn<State, Msg> = readonly [state: State, ...commands: Array<Command<Msg>>]

export type Init<State, Msg> = () => UpdateReturn<State, Msg>
export type Update<State, Msg> = (state: State, message: Msg) => UpdateReturn<State, Msg>
export type View<State, Msg> = (state: State, dispatch: Dispatch<Msg>) => TemplateResult

export function runApp<State, Msg>(
    init: Init<State, Msg>,
    update: Update<State, Msg>,
    view: View<State, Msg>,
    element: HTMLElement,
) {
    let [state, ...commands] = init()

    const dispatch = (msg: Msg) => {
        const [nextState, ...commands] = update(state, msg)
        if (state !== nextState) {
            state = nextState
            queueRender(state)
        }
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
    executeCommands(commands)
}
