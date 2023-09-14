import { writeFile } from 'fs'
import { promisify } from 'util'
import chroma from 'chroma-js'
// Original Lucy
import og_theme from './lucy/theme.mjs'
import og_colors from './lucy/colors.mjs'
// Oh Lucy
import theme from './oh-lucy/theme.mjs'
import colors from './oh-lucy/colors.mjs'

const promisifiedWriteFile = promisify(writeFile);

const calculate_evening_theme = (color) => {
  const [red, green, blue, alpha] = chroma(color).rgba();

  const sum = red + green + blue;

  const clamp = (number) => Math.min(Math.max(number, 0), 255);

  // Shift colors while preserving luminosity
  const newRed = clamp(red * (1 + 0.175 * (1 - sum / 800)));
  const newGreen = clamp(green * (1 - 0.01 * (1 - sum / 800)));
  const newBlue = clamp(sum - (newRed + newGreen));

  return chroma({ r: newRed, g: newGreen, b: newBlue, a: alpha }).hex();
}

const VARIANTS = {
  // Original Lucy themes
  // Note: Excluded from package.json until Oh Lucy becomes significantly different
  'lucy': {
    theme: og_theme,
    colors: og_colors,
    getColor: (color) => color,
  },
  'lucy-evening': {
    theme: og_theme,
    colors: og_colors,
    getColor: (color) => calculate_evening_theme(color),
  },
  // Oh Lucy themes
  'oh-lucy': {
    theme: theme,
    colors: colors,
    getColor: (color) => color,
  },
  'oh-lucy-evening': {
    theme: theme,
    colors: colors,
    getColor: (color) => calculate_evening_theme(color),
  },
};

const buildTheme = async (variants) => {
  try {
    await Promise.all(
      // For each theme variant
      Object.entries(variants).map(([variantName, variant]) => {
        // Assemble the theme's JSON
        const themeWithColors = variant.theme({
          'name': variantName,
          'colors': Object.entries(variant.colors).reduce(
            (acc, [colorName, colorValue]) => ({
              ...acc,
              [colorName]: variant.getColor(colorValue)
            }),
            {}
          )
        });

        // Export it to a file
        return promisifiedWriteFile(
          `./dist/${variantName}.json`,
          JSON.stringify(themeWithColors)
        );
      })
    );
    console.log('🌺 Theme built. 💅');
  } catch (error) {
    console.log(error);
  }
};

buildTheme(VARIANTS)