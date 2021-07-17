import { DBSchema, openDB } from "idb"
import { IDBPDatabase } from "idb/build/esm/entry"
import { MoeHistory, MoeMessage, MoeUpdate } from "./connection"
import { assertNever } from "@practical-fp/union-types"

export interface MarkOfExcellenceRecord {
    timestamp: number
    percentage: number
    damage: number
    marks: number
    battles: number
}

export interface VehicleRecord {
    username: string
    realm: string
    vehicle: string
    moeRecords: MarkOfExcellenceRecord[]
}

interface Schema extends DBSchema {
    moeStore: {
        key: [string, string, string]
        value: VehicleRecord
        indexes: {
            account: [string, string]
        }
    }
}

export class DbBlockedError extends Error {}

export async function openDatabase() {
    return await openDB<Schema>("moeDatabase", 1, {
        upgrade: database => {
            const store = database.createObjectStore("moeStore", {
                keyPath: ["username", "realm", "vehicle"],
            })
            store.createIndex("account", ["username", "realm"])
        },
        blocked: () => {
            throw new DbBlockedError()
        },
    })
}

async function processUpdate(database: IDBPDatabase<Schema>, update: MoeUpdate) {
    const tx = database.transaction("moeStore", "readwrite")
    const store = tx.objectStore("moeStore")
    for (const [vehicleId, record] of Object.entries(update.vehicles)) {
        const vehicle = await store.get([update.username, update.realm, vehicleId])
        if (vehicle) {
            const lastRecord = vehicle.moeRecords[vehicle.moeRecords.length - 1]
            if (lastRecord.battles < record.battles) {
                vehicle.moeRecords.push({ ...record, timestamp: Date.now() })
                await store.put(vehicle)
            }
        } else {
            await store.add({
                username: update.username,
                realm: update.realm,
                vehicle: vehicleId,
                moeRecords: [{ ...record, timestamp: Date.now() }],
            })
        }
    }
    await tx.done
}

async function processHistory(database: IDBPDatabase<Schema>, history: MoeHistory) {
    const tx = database.transaction("moeStore", "readwrite")
    const store = tx.objectStore("moeStore")
    for (const account of history.accounts) {
        for (const [vehicleId, records] of Object.entries(account.vehicles)) {
            const vehicle = await store.get([account.username, account.realm, vehicleId])
            if (vehicle) {
                const lastRecord = vehicle.moeRecords[vehicle.moeRecords.length - 1]
                for (const record of records) {
                    if (lastRecord.battles < record.battles) {
                        vehicle.moeRecords.push({ ...record, timestamp: Date.now() })
                    }
                }
                await store.put(vehicle)
            } else {
                await store.add({
                    username: account.username,
                    realm: account.realm,
                    vehicle: vehicleId,
                    moeRecords: records.map(record => ({ ...record, timestamp: Date.now() })),
                })
            }
        }
    }
    await tx.done
}

export function processMoeMessage(database: IDBPDatabase<Schema>, message: MoeMessage) {
    switch (message.type) {
        case "MOE_UPDATE":
            return processUpdate(database, message)
        case "MOE_HISTORY":
            return processHistory(database, message)
        default:
            assertNever(message)
    }
}
