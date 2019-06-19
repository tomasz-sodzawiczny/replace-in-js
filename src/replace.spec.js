const { replaceInSource, sumUpOffsets } = require('./replace');

describe('replaceInSource', () => {
  it('works when there are no replacements', () => {
    const source = 'foobarbaz';
    const result = replaceInSource({ source, pattern: 'asdf', replacer: '' });
    expect(result).toEqual([source, []]);
  });

  it('works with string pattern', () => {
    const source = 'foobarbaz';
    const result = replaceInSource({ source, pattern: 'bar', replacer: 'xxx' });
    expect(result).toEqual(['fooxxxbaz', [{ line: 1, column: 3, diff: 0 }]]);
  });

  it('works with regexp pattern', () => {
    const source = 'foobarbaz';
    const result = replaceInSource({ source, pattern: /b.r/, replacer: 'xxx' });
    expect(result).toEqual(['fooxxxbaz', [{ line: 1, column: 3, diff: 0 }]]);
  });

  it('works with function replacer', () => {
    const source = 'foobarbaz';
    const result = replaceInSource({ source, pattern: /b.r/, replacer: () => 'xxx' });
    expect(result).toEqual(['fooxxxbaz', [{ line: 1, column: 3, diff: 0 }]]);
  });

  it('works with function replacer and regexp pattern with group', () => {
    const source = 'foobarbaz';
    const result = replaceInSource({
      source,
      pattern: /b(.)r/,
      replacer: (match, group) => `x${group}x`,
    });
    expect(result).toEqual(['fooxaxbaz', [{ line: 1, column: 3, diff: 0 }]]);
  });

  it('works with replacement longer than pattern', () => {
    const source = 'foobarbaz';
    const result = replaceInSource({ source, pattern: 'bar', replacer: 'baaar' });
    expect(result).toEqual(['foobaaarbaz', [{ line: 1, column: 3, diff: 2 }]]);
  });

  it('works with replacement shorter than pattern', () => {
    const source = 'foobarbaz';
    const result = replaceInSource({ source, pattern: 'bar', replacer: '' });
    expect(result).toEqual(['foobaz', [{ line: 1, column: 3, diff: -3 }]]);
  });

  it('works with multiple replacements', () => {
    const source = 'xfooxbarxbazx';
    const result = replaceInSource({ source, pattern: /x/g, replacer: '' });
    expect(result).toEqual([
      'foobarbaz',
      [
        { line: 1, column: 0, diff: -1 },
        { line: 1, column: 4, diff: -1 },
        { line: 1, column: 8, diff: -1 },
        { line: 1, column: 12, diff: -1 },
      ],
    ]);
  });

  it('works replacements in multiple lines', () => {
    const source = 'foo\nbar\nbaz';
    const result = replaceInSource({ source, pattern: 'bar', replacer: '' });
    expect(result).toEqual(['foo\n\nbaz', [{ line: 2, column: 0, diff: -3 }]]);
  });
});

describe('sumUpOffsets', () => {
  it('creates correct bounds for empty array', () => {
    const result = sumUpOffsets([]);
    expect(result).toEqual([
      { line: 1, column: Infinity, diff: 0 },
      { line: Infinity, column: Infinity, diff: 0 },
    ]);
  });

  it('creates correct bounds for single item', () => {
    const result = sumUpOffsets([{ line: 1, column: 3, diff: -1 }]);
    expect(result).toEqual([
      { line: 1, column: 3, diff: 0 },
      { line: 1, column: Infinity, diff: -1 },
      { line: Infinity, column: Infinity, diff: 0 },
    ]);
  });

  it('creates correct bounds for multiple item', () => {
    const result = sumUpOffsets([
      { line: 1, column: 3, diff: -1 },
      { line: 1, column: 6, diff: -2 },
    ]);
    expect(result).toEqual([
      { line: 1, column: 3, diff: 0 },
      { line: 1, column: 6, diff: -1 },
      { line: 1, column: Infinity, diff: -3 },
      { line: Infinity, column: Infinity, diff: 0 },
    ]);
  });

  it('creates correct bounds items in multiple lines', () => {
    const result = sumUpOffsets([
      { line: 1, column: 3, diff: -1 },
      { line: 2, column: 6, diff: -2 },
    ]);
    expect(result).toEqual([
      { line: 1, column: 3, diff: 0 },
      { line: 1, column: Infinity, diff: -1 },
      { line: 2, column: 6, diff: 0 },
      { line: 2, column: Infinity, diff: -2 },
      { line: Infinity, column: Infinity, diff: 0 },
    ]);
  });
});
