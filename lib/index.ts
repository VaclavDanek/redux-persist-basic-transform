import { createTransform } from 'redux-persist'
import { fromJS, Iterable } from 'immutable'
import SeamlessImmutable from 'seamless-immutable'
import Encoder from 'crypto-js/enc-utf8'
import AES from 'crypto-js/aes'
import LZ from 'lz-string'
import stringify from 'fast-safe-stringify'

// types
import type { DataStructure, IConfig, InboundState, IOutboundState } from './types'

const logError = (message: string, error: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[redux-persist-smart-transform] => ${message} =>`, error)
  }
}

const JSONStringify = (object: any) => {
  try { return JSON.stringify(object) }
  catch (error) {
    // logError(`Error while stringifying, perhaps due to circular references`, error)
    return stringify(object)
  }
}

const adjustDataStructure = 
  (object: Record<string, any> | undefined, dataStructure: DataStructure = 'plain'): any => {
    if (object) {
      switch (dataStructure) {
        case 'immutable':
          if (!Iterable.isIterable(object)) {
            return fromJS(object)
          }
          break
        case 'seamless-immutable':
          if (!SeamlessImmutable.isImmutable(object)) {
            return SeamlessImmutable(object)
          }
          break
      }
    }
    return object
  }

export default ({ config, dataStructure, password, whitelist }: {
  config: Record<string, IConfig>;
  dataStructure: DataStructure;
  password: string;
  whitelist: string[];
}) => (
  createTransform(
    // transform state coming from redux on its way to being serialized and stored
    (inboundState: InboundState, key: string) => {
      if (!config[key]) {
        config[key] = {}
      }

      let state: Partial<Record<keyof InboundState, any>> | string = {}
      if (config[key].blacklist) {
        for (const [param, value] of Object.entries(inboundState)) {
          if (!config[key].blacklist?.includes(param)) {
            state[param] = value
          }
        }
      }
      else if (config[key].whitelist) {
        config[key].whitelist?.forEach((param: string) => {
          state[param] = inboundState[param]
        })
      }
      else {
        state = inboundState
      }

      if (config[key].encrypt) {
        state = AES.encrypt(JSONStringify(state), password).toString()
      }
      else if (config[key].compress) {
        state = LZ.compressToUTF16(JSONStringify(state))
      }
      return {
        state,
        expire: config[key].expire ? (Date.now() + (config[key].expire as number * 60 * 1000)) : 0,
        version: config[key].version || 0,
      }
    },
    // transform state coming from storage, on its way to be rehydrated into redux
    (outboundState: IOutboundState, key: string) => {
      if (!config[key]) {
        config[key] = {}
      }

      const defaultState = adjustDataStructure(config[key].defaultState, dataStructure)
      if (config[key].version && outboundState.version !== config[key].version || config[key].expire && Date.now() >= outboundState.expire) {
        return defaultState || {}
      }

      let state: Record<string, any> | string = outboundState.state
      if (state) {
        const { blacklist, compress, encrypt } = config[key]
        if (typeof state === 'string') {
          if (encrypt) {
            try {
              const bytes = AES.decrypt(state, password)
              state = JSON.parse(bytes.toString(Encoder))
            } catch (error: unknown) {
              logError(`Error while encrypting ${key} state`, error)
              return defaultState || {}
            }
          }
          else if (compress) {
            try {
              const decompressed = LZ.decompressFromUTF16(state)
              state = JSON.parse(decompressed)
            } catch (error: unknown) {
              logError(`Error while compressing ${key} state`, error)
              return defaultState || {}
            }
          }
        }

        // not actually necessary... just for forgetting old data, which are newly not configured as persistent.
        if (blacklist) {
          blacklist.forEach((param: string) => {
            delete state[param]
          })
        }
        else if (config[key].whitelist) {
          const stateTemp = {}
          config[key].whitelist?.forEach((param: string) => {
            if (state[param]) {
              stateTemp[param] = state[param]
            }
          })
          state = stateTemp
        }

        switch (dataStructure) {
          case 'immutable':
            state = fromJS(state)
            return defaultState ? defaultState.mergeDeep(state) : state
          case 'seamless-immutable':
            state = SeamlessImmutable(state)
            return defaultState ? defaultState.merge(state, { deep: false }) : state
          case 'plain':
          default:
            return defaultState ? { ...defaultState, ...state as Record<string, any> } : state
        }
      }
      return outboundState
    },
    { whitelist: whitelist || Object.keys(config) }
  )
)
