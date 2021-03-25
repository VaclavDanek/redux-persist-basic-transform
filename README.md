# Info
This transform allows filter, encrypt, compress, versioning and expiring persisted data from redux-persist. Also works with immutable and seamless-immutable data structures.

## Installation
```
npm install redux-persist-complex-transform

or

yarn add redux-persist-complex-transform
```

## Configuration
Variable       |     Type      |   Description     
---------------|---------------|-------------------   
config         | {[key: string]: {Options & Exclusive options}} | Configures transformation of the selected reducers. *(key represents a reducer name used in redux store)*
dataStructure  | string        | State data structure. The only available options: 'plain', 'immutable', 'seamless-immutable'. *(default: plain)*
password       | string        | Password for a data encryption. *(optional)*
whitelist      | Array<string> | Specifies reducers on which this transform should be applied. *(default: all listed in the config above)*

### Options
Variable       |         Type         |   Description     
---------------|----------------------|-------------------  
defaultState   | {[key: string]: any} | Redefines the default state for the selected reducer. *(required only with the default (autoMergeLevel1) state reconciler, otherwise it's optional)*
expire         | number               | An expiration time in minutes. *(default: 0 -> never)*
version        | string               | State version. *(optional)*

Expiring or changing the version, turns a persisted state of the selected reducer to default.

### Exclusive options
Only a one option from each of these groups can be applied at the same time.

Variable       |   Type    |   Description     
---------------|-----------|-------------------  
encrypt        |  boolean  | Specify, if the reducer state should be encrypted on its way to a storage. *(default: false)*
compress       |  boolean  | Specify, if the reducer state should be compressed on its way to a storage. *(default: false)*

Variable       |   Type        |   Description     
---------------|---------------|-------------------  
blacklist      | Array<string> | Excludes the selected variables from persist. *(optional)*
whitelist      | Array<string> | Defines which an only variables will be persistent. *(optional)*

## Some examples:

### 1) Plain object state with the default (autoMergeLevel1) state reconciler.
```javascript
import complexTransform from 'redux-persist-complex-transform'
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
    complexTransform({
      config: reduxConfig,
      password: '12345',
      whitelist,
    }),
  ],
  whitelist,
}

const rootReducer = () =>
  persistReducer(persistConfig,
    combineReducers({
      appData: AppDataReduxReducer,
      userData: UserDataReduxReducer,
    })
  )
```

### 2) Plain object state with the autoMergeLevel2 state reconciler.
```javascript
import complexTransform from 'redux-persist-complex-transform'
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'
import { reducer as UserDataReduxReducer } from '../Redux/UserDataRedux'
import { reducer as AppDataReduxReducer } from '../Redux/AppDataRedux'

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
    complexTransform({
      config: reduxConfig,
      password: '12345',
      whitelist,
    }),
  ],
  whitelist,
}

const rootReducer = () =>
  persistReducer(persistConfig,
    combineReducers({
      appData: AppDataReduxReducer,
      userData: UserDataReduxReducer,
    })
  )
```

### 3) Seamless-immutable state with an appropriate state reconciler.
```javascript
import complexTransform from 'redux-persist-complex-transform'
import { seamlessImmutableReconciler } from 'redux-persist-seamless-immutable'
import { reducer as UserDataReduxReducer } from '../Redux/UserDataRedux'
import { reducer as AppDataReduxReducer } from '../Redux/AppDataRedux'

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
    complexTransform({
      config: reduxConfig,
      dataStructure: 'seamless-immutable',
      password: '12345',
      whitelist,
    }),
  ],
  whitelist,
}

const rootReducer = () =>
  persistReducer(persistConfig,
    combineReducers({
      appData: AppDataReduxReducer,
      userData: UserDataReduxReducer,
    })
  )
```
