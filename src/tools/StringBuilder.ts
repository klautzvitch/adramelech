/* eslint-disable @typescript-eslint/no-explicit-any */
// This is a almost 1:1 copy of the C# StringBuilder class

interface IStringBuilder {
  length: number;
  capacity: number;
  maxCapacity: number;

  append(value: any): IStringBuilder;
  appendLine(value?: any): IStringBuilder;
  appendFormat(format: string, ...args: any[]): IStringBuilder;
  appendRepeat(value: string, count: number): IStringBuilder;
  insert(index: number, value: any): IStringBuilder;
  remove(startIndex: number, length: number): IStringBuilder;
  replace(oldValue: string, newValue: string): IStringBuilder;
  clear(): IStringBuilder;
  equals(other: string): boolean;
  isEmpty(): boolean;
  substring(startIndex: number, length?: number): string | undefined;
  toString(): string;
}

export default class StringBuilder implements IStringBuilder {
  private strings: string[] = [];
  private _capacity: number;
  private _maxCapacity: number = 2147483647; // Int32.MaxValue as in C#

  constructor(
    value?: string,
    capacity: number = 16,
    maxCapacity = this._maxCapacity
  ) {
    this._capacity = capacity;
    this._maxCapacity = maxCapacity;
    if (value) {
      this.append(value);
    }
  }

  get length(): number {
    return this.toString().length;
  }

  get capacity(): number {
    return this._capacity;
  }
  set capacity(value: number) {
    if (value < 0 || value > this._maxCapacity)
      throw new Error('Capacity out of range');
    this._capacity = value;
  }

  get maxCapacity(): number {
    return this._maxCapacity;
  }

  append(value: any): StringBuilder {
    if (value !== null && value !== undefined) {
      this.strings.push(String(value));
      this.ensureCapacity(this.length);
    }
    return this;
  }

  appendLine(value: any = ''): StringBuilder {
    this.append(value);
    this.strings.push('\n');
    this.ensureCapacity(this.length);
    return this;
  }

  appendFormat(format: string, ...args: any[]): StringBuilder {
    let result = format;
    for (let i = 0; i < args.length; i++) {
      const placeholder = `{${i}}`;
      result = result.split(placeholder).join(String(args[i]));
    }
    this.append(result);
    return this;
  }

  appendRepeat(value: string, count: number): StringBuilder {
    if (count < 0) throw new Error('Count cannot be negative');
    if (count > 0 && value) this.append(value.repeat(count));
    return this;
  }

  insert(index: number, value: any): StringBuilder {
    if (index < 0 || index > this.length) throw new Error('Index out of range');

    const current = this.toString();
    const before = current.substring(0, index);
    const after = current.substring(index);

    this.strings = [];
    this.append(before);
    this.append(value);
    this.append(after);

    return this;
  }

  remove(startIndex: number, length: number): StringBuilder {
    if (startIndex < 0 || length < 0 || startIndex + length > this.length)
      throw new Error('Index or length out of range');

    const current = this.toString();
    const before = current.substring(0, startIndex);
    const after = current.substring(startIndex + length);

    this.strings = [];
    this.append(before);
    this.append(after);

    return this;
  }

  replace(oldValue: string, newValue: string): StringBuilder {
    const current = this.toString();
    const updated = current.split(oldValue).join(newValue);

    this.strings = [];
    this.append(updated);

    return this;
  }

  clear(): StringBuilder {
    this.strings = [];
    return this;
  }

  equals(other: string): boolean {
    return this.toString() === other;
  }

  isEmpty(): boolean {
    return this.length === 0;
  }

  substring(startIndex: number, length?: number): string | undefined {
    try {
      const str = this.toString();
      if (length === undefined) return str.substring(startIndex);
      return str.substring(startIndex, startIndex + length);
    } catch {
      return undefined;
    }
  }

  toString(): string {
    return this.strings.join('');
  }

  private ensureCapacity(requiredCapacity: number): void {
    while (requiredCapacity > this._capacity) {
      this._capacity = Math.min(this._capacity * 2, this._maxCapacity);
    }
  }
}
