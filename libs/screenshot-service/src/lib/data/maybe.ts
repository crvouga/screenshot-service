export type Nothing = { type: 'Nothing' };

export type Just<TValue> = { type: 'Just'; value: TValue };

export const Nothing: Nothing = { type: 'Nothing' };

export const Just = <T>(value: T): Just<T> => ({ type: 'Just', value });

export type Maybe<T> = Nothing | Just<T>


