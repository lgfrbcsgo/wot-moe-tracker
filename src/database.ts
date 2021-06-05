import { DBSchema, openDB } from "idb"
import { impl, Variant } from "@practical-fp/union-types"
import { Emitter, Observable } from "./emitter"
import { IDBPDatabase } from "idb/build/esm/entry"
import { MarkOfExcellenceHistory, MarkOfExcellenceUpdate } from "./connection"

export type DatabaseStatus =
    | Variant<"Closed">
    | Variant<"Opening">
    | Variant<"Open">
    | Variant<"Irrecoverable">
    | Variant<"Blocked">
    | Variant<"Blocking">

export const { Closed, Opening, Open, Irrecoverable, Blocked, Blocking } = impl<DatabaseStatus>()

export interface MarkOfExcellenceRecord {
    timestamp: number
    percentage: number
    damage: number
    battles: number
}

export interface VehicleRecord {
    account: string
    vehicle: string
    moeRecords: MarkOfExcellenceRecord[]
}

interface Schema extends DBSchema {
    moeStore: {
        key: [string, string]
        value: VehicleRecord
        indexes: {
            account: string
        }
    }
}

export class Database implements Observable<DatabaseStatus> {
    private status: DatabaseStatus = Closed()
    private database: IDBPDatabase<Schema> | undefined
    private emitter = new Emitter<DatabaseStatus>()

    open() {
        if (Opening.is(this.status) || Open.is(this.status)) return
        this.handleStatusChange(Opening())
        openDB<Schema>("moeDatabase", 1, {
            upgrade: database => {
                const store = database.createObjectStore("moeStore", {
                    keyPath: ["account", "vehicle"],
                })
                store.createIndex("account", "account")
            },
            blocked: () => this.handleStatusChange(Blocked()),
            blocking: () => this.handleStatusChange(Blocking()),
            terminated: () => {
                this.handleStatusChange(Irrecoverable())
                this.database = undefined
            },
        })
            .then(database => {
                this.database = database
                this.handleStatusChange(Open())
            })
            .catch(() => {
                this.handleStatusChange(Irrecoverable())
            })
    }

    observe(observer: (value: DatabaseStatus) => void) {
        observer(this.status)
        return this.emitter.observe(observer)
    }

    async processUpdate(update: MarkOfExcellenceUpdate) {
        if (!this.database) throw new Error("Database not opened.")
        const tx = this.database.transaction("moeStore", "readwrite")
        const store = tx.objectStore("moeStore")
        for (const [vehicleId, record] of Object.entries(update.vehicles)) {
            const vehicle = await store.get([update.account, vehicleId])
            if (vehicle) {
                const lastRecord = vehicle.moeRecords[vehicle.moeRecords.length - 1]
                if (lastRecord.battles < record.battles) {
                    vehicle.moeRecords.push({ ...record, timestamp: Date.now() })
                    await store.put(vehicle)
                }
            } else {
                await store.add({
                    account: update.account,
                    vehicle: vehicleId,
                    moeRecords: [{ ...record, timestamp: Date.now() }],
                })
            }
        }
        await tx.done
    }

    async processHistory(history: MarkOfExcellenceHistory) {
        if (!this.database) throw new Error("Database not opened.")
        const tx = this.database.transaction("moeStore", "readwrite")
        const store = tx.objectStore("moeStore")
        for (const [account, vehicles] of Object.entries(history.accounts)) {
            for (const [vehicleId, records] of Object.entries(vehicles)) {
                const vehicle = await store.get([account, vehicleId])
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
                        account: account,
                        vehicle: vehicleId,
                        moeRecords: records.map(record => ({ ...record, timestamp: Date.now() })),
                    })
                }
            }
        }
    }

    private handleStatusChange(newStatus: DatabaseStatus) {
        this.status = newStatus
        this.emitter.emit(newStatus)
    }
}
