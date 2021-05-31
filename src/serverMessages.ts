import { array, dictionary, GuardedValue, isNumber, isString, literal, record } from "./guards"

export type MarkOfExcellence = GuardedValue<typeof isMarkOfExcellence>
export const isMarkOfExcellence = record({
    percentage: isNumber,
    damage: isNumber,
    battles: isNumber,
})

export type MarkOfExcellenceHistory = GuardedValue<typeof isMarkOfExcellenceHistory>
export const isMarkOfExcellenceHistory = record({
    type: literal("MOE_HISTORY"),
    accounts: dictionary(dictionary(array(isMarkOfExcellence))),
})

export type MarkOfExcellenceUpdate = GuardedValue<typeof isMarkOfExcellenceUpdate>
export const isMarkOfExcellenceUpdate = record({
    type: literal("MOE_UPDATE"),
    account: isString,
    vehicles: dictionary(isMarkOfExcellence),
})
