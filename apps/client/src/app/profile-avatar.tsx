/**
 *
 *
 *
 * Profile Avatars
 *
 *
 *
 */

export type Style =
  // | 'adventurer'
  // | 'adventurer-neutral'
  // | 'avataaars'
  // | 'bottts'
  // | 'big-ears'
  // | 'big-ears-neutral'
  // | 'big-smile'
  // | 'croodles'
  // | 'croodles-neutral'
  // | 'gridy'
  // 'identicon';
  // | 'initials'
  'jdenticon';
// | 'micah'
// | 'miniavs'
// | 'open-peeps'
// | 'personas'
// | 'pixel-art'
// | 'pixel-art-neutral';

export const STYLES: { [style in Style]: Style } = {
  // adventurer: 'adventurer',
  // 'adventurer-neutral': 'adventurer-neutral',
  // avataaars: 'avataaars',
  // 'big-ears': 'big-ears',
  // bottts: 'bottts',
  // 'big-ears-neutral': 'big-ears-neutral',
  // 'big-smile': 'big-smile',
  // croodles: 'croodles',
  // 'croodles-neutral': 'croodles-neutral',
  // gridy: 'gridy',
  // identicon: 'identicon',
  // initials: 'initials',
  jdenticon: 'jdenticon',
  // micah: 'micah',
  // miniavs: 'miniavs',
  // 'open-peeps': 'open-peeps',
  // personas: 'personas',
  // 'pixel-art': 'pixel-art',
  // 'pixel-art-neutral': 'pixel-art-neutral',
};

export const ALL_STYLES = Object.keys(STYLES) as Style[];

const capitalize = (word: string) => {
  const [first, ...rest] = word.split('');
  return [first?.toUpperCase() ?? '', ...rest].join('');
};

export const formatStyle = (style: Style) => {
  return style.split('-').map(capitalize).join(' ');
};

export const toStyle = (style: string): Style => {
  if (style in STYLES) {
    return style as Style;
  }

  return STYLES.jdenticon;
};

export type Seed = string & { type: 'Seed' };

export const toSeed = (seedString: string) => {
  return seedString.replace(' ', '').replace(';', '').replace('.', '') as Seed;
};

const BASE_URL = `https://avatars.dicebear.com/api`;
const FILE_TYPE = 'png';

export const toUrl = ({ seed, style }: { style: Style; seed: Seed }) => {
  const url = new URL(`${BASE_URL}/${style}/${seed}.${FILE_TYPE}`);

  // if (style === 'croodles' || style === 'croodles-neutral') {
  //   url.searchParams.append('backgroundColor', 'white');
  // }

  return url.toString();
};

export const parseUrl = (
  avatarUrl?: string
): {
  seed: Seed;
  style: Style;
} => {
  try {
    const [style, seed] =
      new URL(avatarUrl ?? '')?.pathname
        ?.split('.')?.[0]
        ?.split('/')
        ?.slice(-2) ?? [];

    if (style && seed) {
      return {
        style: toStyle(style),
        seed: toSeed(seed),
      };
    }
    return {
      style: STYLES.jdenticon,
      seed: toSeed(''),
    };
  } catch (error) {
    return {
      style: STYLES.jdenticon,
      seed: toSeed(''),
    };
  }
};

export const generateRandomAvatarSeed = () => {
  return toSeed(String(Math.floor(Math.random() * 10000)));
};
