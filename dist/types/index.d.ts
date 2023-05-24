export type ObjectType = Partial<Record<string, any>>;
export type ValuesType = Partial<Record<string, string | number>>;
export type DataStructure = 'plain' | 'immutable' | 'seamless-immutable';
export type InboundState = Record<string, any>;
export interface IConfig {
    defaultState?: Record<string, any>;
    expire?: number;
    version?: string | number;
    encrypt?: boolean;
    compress?: boolean;
    blacklist?: string[];
    whitelist?: string[];
}
export interface IOutboundState {
    state: Partial<Record<keyof InboundState, any>> | string;
    expire: number;
    version: string | number;
}
