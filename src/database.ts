import { DBSchema, openDB } from "idb"

export interface MarkOfExcellenceRecord {
    timestamp: number
    percentage: number
    damage: number
    battles: number
}

export interface VehicleRecord {
    account: string
    vehicle: number
    moeRecords: MarkOfExcellenceRecord[]
}

interface Schema extends DBSchema {
    moeStore: {
        key: [string, number]
        value: VehicleRecord
        indexes: {
            account: string
        }
    }
}

function connect() {
    return openDB<Schema>("moeDatabase", 1, {
        upgrade(database) {
            const store = database.createObjectStore("moeStore", {
                keyPath: ["account", "vehicle"],
            })
            store.createIndex("account", "account")
        },
    })
}
