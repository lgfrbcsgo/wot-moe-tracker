export interface Stream<T> {
    observe(observer: (value: T) => void): () => void
}

export class WritableStream<T> implements Stream<T> {
    private observers = new Set<(value: T) => void>()

    observe(observer: (value: T) => void): () => void {
        this.observers.add(observer)
        return () => this.observers.delete(observer)
    }

    emit(value: T) {
        for (const observer of this.observers) {
            observer(value)
        }
    }

    readonly(): Stream<T> {
        return this
    }
}

export interface ReactiveValue<T> extends Stream<T> {
    readonly value: T
}

export class WritableReactiveValue<T> extends WritableStream<T> implements ReactiveValue<T> {
    constructor(public value: T) {
        super()
    }

    override observe(observer: (value: T) => void): () => void {
        observer(this.value)
        return super.observe(observer)
    }

    override emit(value: T) {
        this.value = value
        super.emit(value)
    }

    override readonly(): ReactiveValue<T> {
        return this
    }
}

export function throttleAnimationFrame<T>(stream: Stream<T>): Stream<T> {
    return {
        observe(observer: (value: T) => void): () => void {
            let animationFrameHandle: number | undefined = undefined
            return stream.observe(value => {
                if (animationFrameHandle !== undefined) {
                    cancelAnimationFrame(animationFrameHandle)
                }
                animationFrameHandle = requestAnimationFrame(() => {
                    animationFrameHandle = undefined
                    observer(value)
                })
            })
        }
    }
}
