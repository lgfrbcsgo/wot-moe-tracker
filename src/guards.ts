export type Guard<T> = (value: unknown) => value is T

export type GuardedValue<G extends Guard<unknown>> = G extends Guard<infer T> ? T : never

export type GuardedRecord<G extends Record<string, Guard<unknown>>> = {
    [Key in keyof G]: GuardedValue<G[Key]>
}

export type Expand<T> = T extends T ? { [K in keyof T]: T[K] } : never

export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null
}

export function isNumber(value: unknown): value is number {
    return typeof value === "number"
}

export function isString(value: unknown): value is string {
    return typeof value === "string"
}

export function literal<Lit extends string>(literal: Lit) {
    return (value: unknown): value is Lit => value === literal
}

export function array<T>(guard: Guard<T>) {
    return (value: unknown): value is T[] => Array.isArray(value) && value.every(guard)
}

export function dictionary<T>(guard: Guard<T>) {
    return (value: unknown): value is Record<string, T> =>
        isObject(value) && Object.values(value).every(guard)
}

export function record<Guards extends Record<string, Guard<unknown>>>(guards: Guards) {
    return (value: unknown): value is Expand<GuardedRecord<Guards>> =>
        isObject(value) && Object.entries(guards).every(([key, guard]) => guard(value[key]))
}

export function anyOf<Guards extends Array<Guard<unknown>>>(...guards: Guards) {
    return (value: unknown): value is GuardedValue<Guards[number]> => {
        return guards.some(guard => guard(value))
    }
}
