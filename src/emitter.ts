export interface Observable<T> {
    observe(observer: (value: T) => void): () => void
}

export class Emitter<T> implements Observable<T> {
    private observers = new Set<(value: T) => void>()

    observe(observer: (value: T) => void) {
        this.observers.add(observer)
        return () => this.observers.delete(observer)
    }

    emit(value: T) {
        for (const observer of this.observers) {
            observer(value)
        }
    }
}
