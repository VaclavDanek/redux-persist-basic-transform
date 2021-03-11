"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _reduxPersist = require("redux-persist");

var _immutable = require("immutable");

var _seamlessImmutable = _interopRequireDefault(require("seamless-immutable"));

var _encUtf = _interopRequireDefault(require("crypto-js/enc-utf8"));

var _aes = _interopRequireDefault(require("crypto-js/aes"));

var _lzString = _interopRequireDefault(require("lz-string"));

var _fastSafeStringify = _interopRequireDefault(require("fast-safe-stringify"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var logError = function logError(message, error) {
  if (process.env.NODE_ENV === 'development') {
    console.log("[redux-persist-smart-transform] => ".concat(message, " =>"), error);
  }
};

var JSONStringify = function JSONStringify(object) {
  try {
    return JSON.stringify(object);
  } catch (error) {
    // logError(`Error while stringifying, perhaps due to circular references`, error)
    return (0, _fastSafeStringify["default"])(object);
  }
};

var adjustDataStructure = function adjustDataStructure(object) {
  var dataStructure = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'plain';

  if (object) {
    switch (dataStructure) {
      case 'immutable':
        if (!_immutable.Iterable.isIterable(object)) {
          return (0, _immutable.fromJS)(object);
        }

        break;

      case 'seamless-immutable':
        if (!_seamlessImmutable["default"].isImmutable(object)) {
          return (0, _seamlessImmutable["default"])(object);
        }

        break;
    }
  }

  return object;
};

var _default = function _default(_ref) {
  var config = _ref.config,
      dataStructure = _ref.dataStructure,
      password = _ref.password,
      whitelist = _ref.whitelist;
  return (0, _reduxPersist.createTransform)( // transform state coming from redux on its way to being serialized and stored
  function (inboundState, key) {
    if (!config[key]) {
      config[key] = {};
    }

    var state = {};

    if (config[key].blacklist) {
      Object.keys(inboundState).forEach(function (param) {
        if (!config[key].blacklist.includes(param)) {
          state[param] = inboundState[param];
        }
      });
    } else if (config[key].whitelist) {
      config[key].whitelist.forEach(function (param) {
        state[param] = inboundState[param];
      });
    } else {
      state = inboundState;
    }

    if (config[key].encrypt) {
      state = _aes["default"].encrypt(JSONStringify(state), password).toString();
    } else if (config[key].compress) {
      state = _lzString["default"].compressToUTF16(JSONStringify(state));
    }

    return {
      state: state,
      expire: config[key].expire ? Date.now() + config[key].expire * 60 * 1000 : 0,
      version: config[key].version || 0
    };
  }, // transform state coming from storage, on its way to be rehydrated into redux
  function (outboundState, key) {
    if (!config[key]) {
      config[key] = {};
    }

    var defaultState = adjustDataStructure(config[key].defaultState, dataStructure);

    if (config[key].version && outboundState.version !== config[key].version || config[key].expire && Date.now() >= outboundState.expire) {
      return defaultState || {};
    }

    var state = outboundState.state;

    if (state) {
      var _config$key = config[key],
          blacklist = _config$key.blacklist,
          compress = _config$key.compress,
          encrypt = _config$key.encrypt;

      if (typeof state === 'string') {
        if (encrypt) {
          try {
            var bytes = _aes["default"].decrypt(state, password);

            state = JSON.parse(bytes.toString(_encUtf["default"]));
          } catch (error) {
            logError("Error while encrypting ".concat(key, " state"), error);
            return defaultState || {};
          }
        } else if (compress) {
          try {
            var decompressed = _lzString["default"].decompressFromUTF16(state);

            state = JSON.parse(decompressed);
          } catch (error) {
            logError("Error while compressing ".concat(key, " state"), error);
            return defaultState || {};
          }
        }
      }

      if (blacklist) {
        blacklist.forEach(function (param) {
          delete state[param];
        });
      }

      switch (dataStructure) {
        case 'immutable':
          state = (0, _immutable.fromJS)(state);
          return defaultState ? defaultState.mergeDeep(state) : state;

        case 'seamless-immutable':
          state = (0, _seamlessImmutable["default"])(state);
          return defaultState ? defaultState.merge(state, {
            deep: false
          }) : state;

        case 'plain':
        default:
          return defaultState ? _objectSpread({}, defaultState, {}, state) : state;
      }
    }

    return outboundState;
  }, {
    whitelist: whitelist || Object.keys(config)
  });
};

exports["default"] = _default;