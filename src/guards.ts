export type Guard<T> = (value: unknown) => value is T

export type GuardedValue<G extends Guard<unknown>> = G extends Guard<infer T> ? T : never

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

export type GuardedRecord<Guards extends Record<string, Guard<unknown>>> = {
    [Key in keyof Guards]: Guards[Key] extends Guard<infer T> ? T : never
}

export function record<Guards extends Record<string, Guard<unknown>>>(guards: Guards) {
    return (value: unknown): value is GuardedRecord<Guards> =>
        isObject(value) && Object.entries(guards).every(([key, guard]) => guard(value[key]))
}

export const isMarkOfExcellence = record({
    percentage: isNumber,
    damage: isNumber,
    battles: isNumber,
})

export type MarkOfExcellence = GuardedValue<typeof isMarkOfExcellence>

export const isMarkOfExcellenceHistory = record({
    type: literal("MOE_HISTORY"),
    accounts: dictionary(dictionary(array(isMarkOfExcellence))),
})

export type MarkOfExcellenceHistory = GuardedValue<typeof isMarkOfExcellenceHistory>

export const isMarkOfExcellenceUpdate = record({
    type: literal("MOE_UPDATE"),
    account: isString,
    vehicles: dictionary(isMarkOfExcellence),
})

export type MarkOfExcellenceUpdate = GuardedValue<typeof isMarkOfExcellenceUpdate>
