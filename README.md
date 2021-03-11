# Info
This transform allows filter, encrypt, compress, versioning and expiring persisted data from redux states. Also works with immutable and seamless-immutable data structures.

## Install
```git
yarn add https://github.com/VaclavDanek/redux-persist-basic-transform
```

### Configuration
Variable       |   Type    |   Description     
---------------|-----------|-------------------   
config         |   {[key: string]: Options}   | Configures transformation for specified redux. *(key represents name of specified redux)*
dataStructure  |   string          | State data structure. Only available options: 'plain', 'immutable', 'seamless-immutable'. *(default: plain)*
password       |   string          | Password for data encryption. *(optional)*
whitelist      |   Array<string>   | Specify reduxes on which is this transform is applied. *(default: everyone of reduxes, mentioned in the config above)*

### Options
Variable       |   Type    |   Description     
---------------|-----------|-------------------  
defaultState | {[key: string]: any} | Default state for specific redux. *(required only with the default (autoMergeLevel1) state reconciler in persistConfig, otherwise it's optional)*
expire | number | Expiration time in minutes. *(default: 0 -> never)*
version | string | State version *(optional)*

Expiring or changing state version, turns current redux state to the default.

### Exclusive options
Only one option from each of these groups can be applied at the same time.

Variable       |   Type    |   Description     
---------------|-----------|-------------------  
encrypt        |  boolean  | Determines, if redux state will be encrypted on its way to a storage. *(default: false)*
compress       |  boolean  | Determines, if redux state will be compressed on its way to a storage. *(default: false)*

Variable       |   Type    |   Description     
---------------|-----------|-------------------  
blacklist      | Array<string> | Excludes defined variables from persist. *(optional)*
whitelist      | Array<string> | Defines which only variables will be persistent. *(optional)*

## 1. example of usage (plain object state with the default (autoMergeLevel1) state reconciler)
```javascript
import basicTransform from 'redux-persist-basic-transform'
import { reducer as UserDataReduxReducer, INITIAL_STATE as UserDataInitial } from '../Redux/UserDataRedux'
import { reducer as AppDataReduxReducer, INITIAL_STATE as AppDataInitial } from '../Redux/AppDataRedux'

const reduxConfig = {
  appData: {
    defaultState: AppDataInitial,
    blacklist: ['some variable excluded from persist'],
    compress: true,
    version: 2,
  },
  userData: {
    defaultState: UserDataInitial,
    encrypt: true,
    version: 1,
  },
}, whitelist = Object.keys(reduxConfig)

const persistConfig = {
  key: 'app',
  storage: localForage.createInstance({
    drive: localForage.INDEXEDDB,
    name: 'MyAPP',
  }),
  transforms: [
    basicTransform({
      config: reduxConfig,
      password: '12345',
      whitelist,
    }),
  ],
  whitelist,
}

export const makeRootReducer = (): GlobalState =>
  persistReducer(persistConfig,
    combineReducers({
      appData: AppDataReduxReducer,
      userData: UserDataReduxReducer,
    })
  )
```

## 2. example of usage (plain object state with autoMergeLevel2)
```javascript
import basicTransform from 'redux-persist-basic-transform'
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'

const reduxConfig = {
  appData: {
    blacklist: ['some variable excluded from persist'],
    compress: true,
    version: 2,
  },
  userData: {
    encrypt: true,
    version: 1,
  },
}, whitelist = Object.keys(reduxConfig)

const persistConfig = {
  key: 'app',
  stateReconciler: autoMergeLevel2,
  storage: localForage.createInstance({
    drive: localForage.INDEXEDDB,
    name: 'MyAPP',
  }),
  transforms: [
    basicTransform({
      config: reduxConfig,
      password: '12345',
      whitelist,
    }),
  ],
  whitelist,
}
```

## 3. example of usage (seamless-immutable)
```javascript
import basicTransform from 'redux-persist-basic-transform'
import { seamlessImmutableReconciler } from 'redux-persist-seamless-immutable'

const reduxConfig = {
  appData: {
    blacklist: ['some variable excluded from persist'],
    compress: true,
    version: 2,
  },
  userData: {
    encrypt: true,
    version: 1,
  },
}, whitelist = Object.keys(reduxConfig)

const persistConfig = {
  key: 'app',
  stateReconciler: seamlessImmutableReconciler,
  storage: localForage.createInstance({
    drive: localForage.INDEXEDDB,
    name: 'MyAPP',
  }),
  transforms: [
    basicTransform({
      config: reduxConfig,
      dataStructure: 'seamless-immutable',
      password: '12345',
      whitelist,
    }),
  ],
  whitelist,
}
```
