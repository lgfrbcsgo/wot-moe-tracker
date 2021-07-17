import {
    anyOf,
    array,
    dictionary,
    GuardedValue,
    isNumber,
    isString,
    literal,
    record,
} from "./guards"

export type Vehicle = GuardedValue<typeof isVehicle>
export const isVehicle = record({
    id: isString,
    tier: isNumber,
    name: isString,
    iconUrl: isString,
    imageUrl: isString,
})

const isMoe = record({
    percentage: isNumber,
    damage: isNumber,
    battles: isNumber,
    marks: isNumber,
})

export type MoeHistory = GuardedValue<typeof isMoeHistory>
export const isMoeHistory = record({
    type: literal("MOE_HISTORY"),
    accounts: array(
        record({
            username: isString,
            realm: isString,
            vehicles: dictionary(array(isMoe)),
        }),
    ),
})

export type MoeUpdate = GuardedValue<typeof isMoeUpdate>
export const isMoeUpdate = record({
    type: literal("MOE_UPDATE"),
    username: isString,
    realm: isString,
    vehicles: dictionary(isMoe),
})

export type MoeMessage = GuardedValue<typeof isMoeMessage>
export const isMoeMessage = anyOf(isMoeUpdate, isMoeHistory)
