export type DataStructure = 'plain' | 'immutable' | 'seamless-immutable'

export type InboundState = Record<string, any>

export interface IOutboundState {
  state: Record<string, any> | string;
  expire: number;
  version: string | number;
}

export interface IConfig {
  defaultState?: Record<string, any>;
  expire?: number;
  version?: string | number;
  encrypt?: boolean;
  compress?: boolean;
  blacklist?: string[];
  whitelist?: string[];
}