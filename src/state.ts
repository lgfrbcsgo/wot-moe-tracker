import { WritableReactiveValue } from "./stream"

export type Committer<State, Args extends unknown[]> = (state: State, ...args: Args) => State

export function createState<State>(initialState: State) {
    const state$ = new WritableReactiveValue(initialState)

    const committer = <Args extends unknown[]>(committer: Committer<State, Args>) => {
        return (...args: Args) => {
            const newState = committer(state$.value, ...args)
            state$.emit(newState)
            return newState
        }
    }

    return { committer, state$: state$.readonly() }
}

export const { committer, state$ } = createState(undefined)
