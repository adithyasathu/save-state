import { EventEmitter } from "events";

export interface IHealthCheck {
    // this method would check data store for liveliness and readiness and emits HealthEvents.Ready event
    isReady(): Promise<void>;
}

export interface IStoreOptions {
    url: string;
    retry?: {
        secsWaitBetween: number;
        secsAbortAfter: number;
    };
}

export interface IMongoStoreConfig extends IStoreOptions {
    url: string;
    db: string;
    collection: string;
    driver?: any;
    retry?: {
        secsWaitBetween: number;
        secsAbortAfter: number;
    };
}

export interface IRedisStoreConfig extends IStoreOptions {
    url: string;
    password?: string;
    tls?: boolean;
    retry?: {
        secsWaitBetween: number;
        secsAbortAfter: number;
    };
}

export enum HealthEvents {
    Ready = "READY",
}

export interface IStore extends IHealthCheck, EventEmitter {
    get(keys: string[]): Promise<any>|any;
    set(o: any): Promise<any>|any;
    remove(k: string): void;
    removeAll(): void;
    connect(): Promise<any>;
    disconnect(): Promise<any>;
}
