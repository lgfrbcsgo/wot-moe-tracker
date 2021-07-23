import { WritableReactiveValue } from "./stream"

export type Mapper<State> = (state: State) => State

export function createState<State>(initialState: State) {
    const state$ = new WritableReactiveValue(initialState)

    const mapState = (mapper: Mapper<State>) => {
        const newState = mapper(state$.value)
        state$.emit(newState)
        return newState
    }

    return { mapState, state$: state$.readonly() }
}
