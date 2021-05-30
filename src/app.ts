export type Dispatch<Msg> = (message: Msg) => void

export type Command<Msg, Deps> = (dispatch: Dispatch<Msg>, dependencies: Deps) => void

export type UpdateReturn<State, Msg, Deps> = [state: State, ...commands: Array<Command<Msg, Deps>>]

export type Init<State, Msg, Deps> = () => UpdateReturn<State, Msg, Deps>
export type Update<State, Msg, Deps> = (state: State, message: Msg) => UpdateReturn<State, Msg, Deps>
export type View<State, Msg, ViewResult> = (state: State, dispatch: Dispatch<Msg>) => ViewResult
export type Render<ViewResult> = (result: ViewResult) => void

export function runApp<State, Msg, Deps, ViewResult>(
    init: Init<State, Msg, Deps>,
    update: Update<State, Msg, Deps>,
    view: View<State, Msg, ViewResult>,
    render: Render<ViewResult>,
    dependencies: Deps,
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

    const executeCommands = (commands: Array<Command<Msg, Deps>>) => {
        commands.forEach(command => command(dispatch, dependencies))
    }

    let animationFrameHandle: number | undefined = undefined
    const queueRender = (state: State) => {
        if (animationFrameHandle !== undefined) {
            cancelAnimationFrame(animationFrameHandle)
        }
        animationFrameHandle = requestAnimationFrame(() => {
            const viewResult = view(state, dispatch)
            render(viewResult)
        })
    }

    queueRender(state)
    executeCommands(commands)
}
