type Column = {
  title: string;
  values: string[];
};

export default class UnicodeSheet {
  private columns: Column[] = [];

  constructor(private separateRows: boolean = false) {}

  addColumn(title: string, values: string[]): UnicodeSheet {
    if (!title || title.trim() === '')
      throw new Error('Column title cannot be empty');
    if (!values) throw new Error('Column values cannot be null');
    if (values.length === 0) throw new Error('Column values cannot be empty');
    if (
      this.columns.length > 0 &&
      values.length !== this.columns[0].values.length
    )
      throw new Error('All columns must have the same number of values');

    this.columns.push({ title, values });
    return this;
  }

  build(): string {
    return this.buildRows().join('\n');
  }

  private buildRows(): string[] {
    if (this.columns.length === 0)
      throw new Error("Can't build rows without any columns");

    const columnsLength = this.getMaxColumnsLength();
    const rows: string[] = [];

    rows.push(...this.buildHeaderRows(columnsLength));

    for (let i = 0; i < this.columns[0].values.length; i++) {
      const values = this.columns.map((c) => c.values[i]);
      rows.push(this.buildSpecialLine('│', '│', '│', values, columnsLength));

      if (this.separateRows && i < this.columns[0].values.length - 1)
        rows.push(this.buildLine('├', '┼', '┤', columnsLength));
    }

    rows.push(this.buildLine('└', '┴', '┘', columnsLength));

    return rows;
  }

  private buildHeaderRows(columnsLength: number[]): string[] {
    const rows: string[] = [];

    if (this.separateRows) {
      rows.push(this.buildLine('╔', '╦', '╗', columnsLength, '═'));
      rows.push(
        this.buildSpecialLine(
          '║',
          '║',
          '║',
          this.columns.map((c) => c.title),
          columnsLength
        )
      );
      rows.push(this.buildLine('╠', '╬', '╣', columnsLength, '═'));
    } else {
      rows.push(this.buildLine('┌', '┬', '┐', columnsLength));
      rows.push(
        this.buildSpecialLine(
          '│',
          '│',
          '│',
          this.columns.map((c) => c.title),
          columnsLength
        )
      );
      rows.push(this.buildLine('├', '┼', '┤', columnsLength));
    }

    return rows;
  }

  private getMaxColumnsLength(): number[] {
    return this.columns.map((c) =>
      Math.max(c.title.length, Math.max(...c.values.map((v) => v.length)))
    );
  }

  private buildLine(
    left: string,
    middle: string,
    right: string,
    columnsLength: number[],
    separator: string = '─'
  ): string {
    let line = left;
    for (let i = 0; i < this.columns.length; i++) {
      line += separator.repeat(columnsLength[i] + 2);
      if (i < this.columns.length - 1) line += middle;
    }
    line += right;
    return line;
  }

  private buildSpecialLine(
    left: string,
    middle: string,
    right: string,
    values: string[],
    columnsLength: number[]
  ): string {
    let line = left;
    for (let i = 0; i < this.columns.length; i++) {
      line += ` ${values[i].padEnd(columnsLength[i])} `;
      if (i < this.columns.length - 1) line += middle;
    }
    line += right;
    return line;
  }
}
