/**
 *
 *
 *
 * source: https://github.com/sorribas/typesafe-event-emitter#readme
 *
 *
 *
 */

import { EventEmitter } from 'events';

interface StringKeyedObject {
  [key: string]: unknown;
}

export interface IEventEmitter<C extends StringKeyedObject>
  extends EventEmitter {
  addListener<K extends Extract<keyof C, string>>(
    eventName: K,
    listener: (arg: C[K]) => void
  ): this;
  on<K extends Extract<keyof C, string>>(
    eventName: K,
    listener: (arg: C[K]) => void
  ): this;
  once<K extends Extract<keyof C, string>>(
    eventName: K,
    listener: (arg: C[K]) => void
  ): this;
  removeListener<K extends Extract<keyof C, string>>(
    eventName: K,
    listener: (arg: C[K]) => void
  ): this;
  off<K extends Extract<keyof C, string>>(
    eventName: K,
    listener: (arg: C[K]) => void
  ): this;
  removeAllListeners<K extends Extract<keyof C, string>>(eventName?: K): this;
  setMaxListeners(n: number): this;
  getMaxListeners(): number;
  emit<K extends Extract<keyof C, string>>(eventName: K, arg: C[K]): boolean;
  listenerCount<K extends Extract<keyof C, string>>(eventName: K): number;
  prependListener<K extends Extract<keyof C, string>>(
    eventName: K,
    listener: (arg: C[K]) => void
  ): this;
  prependOnceListener<K extends Extract<keyof C, string>>(
    eventName: K,
    listener: (arg: C[K]) => void
  ): this;
}
