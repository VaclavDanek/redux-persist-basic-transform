/// <reference types="redux-persist" />
import type { DataStructure, IConfig, InboundState } from './types';
declare const _default: ({ config, dataStructure, password, whitelist }: {
    config: Record<keyof InboundState, IConfig>;
    dataStructure: DataStructure;
    password: string;
    whitelist: string[];
}) => import("redux-persist").Transform<InboundState, {
    state: {};
    expire: number;
    version: string | number;
}>;
export default _default;
