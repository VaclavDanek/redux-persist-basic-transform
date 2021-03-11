import { createTransform } from 'redux-persist'
import { fromJS, Iterable } from 'immutable'
import SeamlessImmutable from 'seamless-immutable'
import Encoder from 'crypto-js/enc-utf8'
import AES from 'crypto-js/aes'
import LZ from 'lz-string'
import stringify from 'fast-safe-stringify'

const logError = (message, error) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[redux-persist-smart-transform] => ${message} =>`, error)
  }
}

const JSONStringify = (object) => {
  try { return JSON.stringify(object) }
  catch (error) {
    // logError(`Error while stringifying, perhaps due to circular references`, error)
    return stringify(object)
  }
}

const adjustDataStructure = (object, dataStructure = 'plain') => {
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

export default ({ config, dataStructure, password, whitelist }) => {
  return createTransform(
    // transform state coming from redux on its way to being serialized and stored
    (inboundState, key) => {
      if (!config[key]) {
        config[key] = {}
      }

      let state = {}
      if (config[key].blacklist) {
        Object.keys(inboundState).forEach(param => {
          if (!config[key].blacklist.includes(param)) {
            state[param] = inboundState[param]
          }
        })
      }
      else if (config[key].whitelist) {
        config[key].whitelist.forEach(param => {
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
        expire: config[key].expire ? (Date.now() + (config[key].expire * 60 * 1000)) : 0,
        version: config[key].version || 0,
      }
    },
    // transform state coming from storage, on its way to be rehydrated into redux
    (outboundState, key) => {
      if (!config[key]) {
        config[key] = {}
      }

      const defaultState = adjustDataStructure(config[key].defaultState, dataStructure)
      if (config[key].version && outboundState.version !== config[key].version || config[key].expire && Date.now() >= outboundState.expire) {
        return defaultState || {}
      }

      let state = outboundState.state
      if (state) {
        const { blacklist, compress, encrypt } = config[key]
        if (typeof state === 'string') {
          if (encrypt) {
            try {
              const bytes = AES.decrypt(state, password)
              state = JSON.parse(bytes.toString(Encoder))
            } catch (error) {
              logError(`Error while encrypting ${key} state`, error)
              return defaultState || {}
            }
          }
          else if (compress) {
            try {
              const decompressed = LZ.decompressFromUTF16(state)
              state = JSON.parse(decompressed)
            } catch (error) {
              logError(`Error while compressing ${key} state`, error)
              return defaultState || {}
            }
          }
        }

        // not actually necessary...
        if (blacklist) {
          blacklist.forEach(param => {
            delete state[param]
          })
        }
        else if (whitelist) {
          const stateTemp = {}
          whitelist.forEach(param => {
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
            return defaultState ? { ...defaultState, ...state } : state
        }
      }
      return outboundState
    },
    { whitelist: whitelist || Object.keys(config) }
  )
}
