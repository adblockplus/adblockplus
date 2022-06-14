import api from "./api";

export {
  app,
  doclinks,
  filters,
  notifications,
  prefs,
  requests,
  stats,
  subscriptions
} from "./api";

export {
  addConnectListener,
  addDisconnectListener,
  addMessageListener,
  listen,
  removeDisconnectListener
} from "./api.port";

export type {
  AppGetWhat,
  AppOpenWhat,
  DisplayMethod,
  ListenFilters,
  ListenProps,
  ListenTypes,
  MessageProps,
  PlatformToStore,
  Platform,
  ExtensionInfo,
  Port,
  PortEventListener,
  PrefsGetWhat,
  SendArgs,
  SendType,
  Store,
  SubscriptionOptions
} from "./api.types";

export default api;
