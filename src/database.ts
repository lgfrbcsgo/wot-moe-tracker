import { DBSchema, openDB } from "idb"
import { impl, Variant } from "@practical-fp/union-types"
import { Emitter, Observable } from "./emitter"
import { IDBPDatabase } from "idb/build/esm/entry"

export type DatabaseStatus =
    | Variant<"Closed">
    | Variant<"Opening">
    | Variant<"Open">
    | Variant<"Error">
    | Variant<"Blocked">
    | Variant<"Blocking">

export const { Closed, Opening, Open, Error, Blocked, Blocking } = impl<DatabaseStatus>()

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
                this.handleStatusChange(Error())
                this.database = undefined
            },
        })
            .then(database => {
                this.database = database
                this.handleStatusChange(Open())
            })
            .catch(() => {
                this.handleStatusChange(Error())
            })
    }

    observe(observer: (value: DatabaseStatus) => void) {
        observer(this.status)
        return this.emitter.observe(observer)
    }

    handleStatusChange(newStatus: DatabaseStatus) {
        this.status = newStatus
        this.emitter.emit(newStatus)
    }
}
