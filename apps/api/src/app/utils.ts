//
//
//
// Actions
//
//
//

// source: https://warhol.io/blog/reducing-redux-boilerplate-in-typescript

type IActionCreatorMap = Record<string, (...args: any[]) => any>;

export type InferActionMap<TActionCreatorMap extends IActionCreatorMap> = {
  [Name in keyof TActionCreatorMap]: TActionCreatorMap[Name] extends (
    ...args: any[]
  ) => any
    ? ReturnType<TActionCreatorMap[Name]>
    : never;
};

export type InferActionUnion<TActionCreatorMap extends IActionCreatorMap> =
  InferActionMap<TActionCreatorMap>[keyof TActionCreatorMap];
