/* eslint-disable max-len */
const { SourceMapConsumer, SourceMapGenerator } = require('source-map');
const { writeFileSync, readFileSync } = require('fs');

/** Replace `pattern` with `replacer` in the `source` string. */
const replaceInSource = ({ source, pattern, replacer }) => {
  const replacements = [];

  const generatedSource = source
    .split('\n')
    .map((line, lineIndex) => line.replace(pattern, (...args) => {
      const match = args[0];
      const offset = args[args.length - 2];

      const oldValue = match;
      const newValue = typeof replacer === 'function' ? replacer(...args) : replacer;

      replacements.push({
        line: lineIndex + 1, // 1-based numbering!
        column: offset,
        diff: newValue.length - oldValue.length,
      });
      return newValue;
    }))
    .join('\n');

  return [generatedSource, replacements];
};

/** Sums up the offsets in replacements in each line */
const sumUpOffsets = (replacements) => {
  const normalizedReplacements = [];

  let currentDiff = 0;
  let previousLine = 1; // 1-based numbering!
  replacements.forEach(({ line, column, diff }) => {
    if (line > previousLine) {
      normalizedReplacements.push({
        line: previousLine,
        column: Infinity,
        diff: currentDiff,
      });

      currentDiff = 0;
      previousLine = line;
    }
    normalizedReplacements.push({ line, column, diff: currentDiff });
    currentDiff += diff;
  });
  normalizedReplacements.push({
    line: previousLine,
    column: Infinity,
    diff: currentDiff,
  });
  normalizedReplacements.push({
    line: Infinity,
    column: Infinity,
    diff: 0,
  });

  return normalizedReplacements;
};

const updateGeneratedSourceMap = ({ consumer, generator, replacements }) => {
  // convert to summarized - O(n)
  const offsetUpdates = sumUpOffsets(replacements);

  // update the mappings - O(n)
  let currentReplacement = 0;
  consumer.eachMapping((mapping) => {
    const {
      generatedLine, generatedColumn, originalLine, originalColumn, source,
    } = mapping;

    const lineIsGreater = () => generatedLine > offsetUpdates[currentReplacement].line;
    const isSameLineAndColumnIsGreater = () => generatedLine === offsetUpdates[currentReplacement].line
      && generatedColumn > offsetUpdates[currentReplacement].column;

    while (lineIsGreater() || isSameLineAndColumnIsGreater()) {
      currentReplacement += 1;
    }

    const hasOriginal = typeof originalLine === 'number' || typeof originalColumn === 'number';

    return generator.addMapping({
      generated: {
        line: generatedLine,
        column: generatedColumn + offsetUpdates[currentReplacement].diff,
      },
      original: hasOriginal
        ? {
          line: originalLine,
          column: originalColumn,
        }
        : null,
      source: source || null,
    });
  });
};

const updateSourceMap = ({ map, replacements, file }) => SourceMapConsumer.with(map, null, (consumer) => {
  // prepare generator
  const generator = new SourceMapGenerator({ file });
  generator.applySourceMap(consumer, file);

  // update positions
  updateGeneratedSourceMap({ consumer, generator, replacements });

  // return
  return generator.toString();
});

const replace = async (pattern, replacer, {
  file, mapFile, srcDir, outDir,
}) => {
  // read files
  const source = readFileSync(srcDir + file, { encoding: 'utf8' });
  const map = JSON.parse(readFileSync(srcDir + mapFile));

  // replace in source
  const [outSource, replacements] = replaceInSource({
    source,
    pattern,
    replacer,
  });

  // update source map
  const outMap = await updateSourceMap({
    source,
    map,
    replacements,
    file,
  });

  writeFileSync(outDir + file, outSource, 'utf-8');
  writeFileSync(outDir + mapFile, outMap, 'utf-8');
};

module.exports = {
  replace,
  replaceInSource,
  sumUpOffsets,
  updateGeneratedSourceMap,
};
