export type Renderer<State> = (state: State) => void
export type Reducer<State, Args extends unknown[]> = (state: State, ...args: Args) => State
export type Effect<Args extends unknown[]> = (...args: Args) => void

function createRuntime<State>(initialState: State, renderer: Renderer<State>) {
    let state = initialState

    const action = <Args extends unknown[]>(reducer: Reducer<State, Args>) => {
        return (...args: Args) => {
            state = reducer(state, ...args)
            queueRender()
        }
    }

    const queueEffect = <Args extends unknown[]>(effect: Effect<Args>, ...args: Args) => {
        queueMicrotask(() => effect(...args))
    }

    let animationFrameHandle: number | undefined = undefined
    const queueRender = () => {
        if (animationFrameHandle !== undefined) return
        animationFrameHandle = requestAnimationFrame(() => {
            animationFrameHandle = undefined
            renderer(state)
        })
    }

    return { action, queueEffect }
}
