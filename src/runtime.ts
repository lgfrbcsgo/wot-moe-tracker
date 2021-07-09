export type Renderer<State> = (state: State) => void
export type Reducer<State, Args extends unknown[]> = (state: State, ...args: Args) => State
export type Effect<Args extends unknown[]> = (...args: Args) => void

export function createRuntime<State>(initialState: State, renderer: Renderer<State>) {
    let state = initialState

    const action = <Args extends unknown[]>(reducer: Reducer<State, Args>) => {
        return (...args: Args) => {
            const newState = reducer(state, ...args)
            if (newState !== state) {
                queueRender()
            }
            state = newState
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

    queueRender()

    return { action, queueEffect }
}
