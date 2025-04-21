/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * FileSystemMap implements the Map interface with file system persistence.
 * All key-value pairs are stored in a single JSON file with namespaced keys.
 */
export class FileSystemMap<K, V> implements Map<K, V> {
  private basePath: string;
  private namespace: string;
  private filePath: string;
  private data: Record<string, { key: K; value: V }>;
  private size_: number;
  readonly [Symbol.toStringTag] = 'Map';

  /**
   * Creates a new FileSystemMap
   * @param basePath Directory where the storage file will be located
   * @param namespace Namespace to separate different maps in the same file
   */
  constructor(basePath: string, namespace: string) {
    this.basePath = basePath;
    this.namespace = namespace;
    this.data = {};
    this.size_ = 0;

    // Ensure the directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }

    this.filePath = path.join(this.basePath, 'storage.json');

    // Load existing entries into memory
    this.loadExistingEntries();
  }

  /**
   * Loads existing entries from the file system into memory
   */
  private loadExistingEntries(): void {
    try {
      let allData: Record<string, Record<string, { key: K; value: V }>> = {};

      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf8');
        allData = JSON.parse(content);
      }

      // Initialize namespace if it doesn't exist
      if (!allData[this.namespace]) {
        allData[this.namespace] = {};
      }

      this.data = allData[this.namespace];
      this.size_ = Object.keys(this.data).length;
    } catch (err) {
      console.error('Error loading existing entries:', err);
      this.data = {};
      this.size_ = 0;
    }
  }

  /**
   * Saves the current state to the file system
   */
  private saveToFileSystem(): void {
    try {
      let allData: Record<string, Record<string, { key: K; value: V }>> = {};

      // Read existing data first
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf8');
        allData = JSON.parse(content);
      }

      // Update only our namespace
      allData[this.namespace] = this.data;

      fs.writeFileSync(this.filePath, JSON.stringify(allData, null, 4), 'utf8');
    } catch (err) {
      console.error('Error writing to file system:', err);
      throw err;
    }
  }

  /**
   * Converts a key to a string identifier
   */
  private keyToString(key: K): string {
    const keyStr = JSON.stringify(key);
    return crypto.createHash('md5').update(keyStr).digest('hex');
  }

  /**
   * Sets a key-value pair in the map
   */
  set(key: K, value: V): this {
    const keyStr = this.keyToString(key);

    if (!this.data[keyStr]) {
      this.size_++;
    }

    this.data[keyStr] = { key, value };
    this.saveToFileSystem();

    return this;
  }

  /**
   * Gets a value from the map
   */
  get(key: K): V | undefined {
    const keyStr = this.keyToString(key);
    const entry = this.data[keyStr];
    return entry ? entry.value : undefined;
  }

  /**
   * Checks if a key exists in the map
   */
  has(key: K): boolean {
    const keyStr = this.keyToString(key);
    return keyStr in this.data;
  }

  /**
   * Deletes a key-value pair from the map
   */
  delete(key: K): boolean {
    const keyStr = this.keyToString(key);

    if (keyStr in this.data) {
      delete this.data[keyStr];
      this.size_--;
      this.saveToFileSystem();
      return true;
    }

    return false;
  }

  /**
   * Clears all entries from the map
   */
  clear(): void {
    this.data = {};
    this.size_ = 0;
    this.saveToFileSystem();
  }

  /**
   * Returns the number of key-value pairs in the map
   */
  get size(): number {
    return this.size_;
  }

  /**
   * Returns an iterator for the keys in the map
   */
  *keys(): IterableIterator<K> {
    for (const entry of Object.values(this.data)) {
      yield entry.key;
    }
  }

  /**
   * Returns an iterator for the values in the map
   */
  *values(): IterableIterator<V> {
    for (const entry of Object.values(this.data)) {
      yield entry.value;
    }
  }

  /**
   * Returns an iterator for the entries in the map
   */
  *entries(): IterableIterator<[K, V]> {
    for (const entry of Object.values(this.data)) {
      yield [entry.key, entry.value];
    }
  }

  /**
   * Executes a callback for each key-value pair in the map
   */
  forEach(
    callbackfn: (value: V, key: K, map: Map<K, V>) => void,
    thisArg?: any
  ): void {
    for (const [key, value] of this.entries()) {
      callbackfn.call(thisArg, value, key, this);
    }
  }

  /**
   * Returns an iterator for the entries in the map
   */
  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.entries();
  }
}
