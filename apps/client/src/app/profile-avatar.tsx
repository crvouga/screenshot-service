/**
 * Profile Avatars
 */
import { createAvatar } from '@dicebear/core';
import * as identicon from '@dicebear/identicon';

export type Style = 'identicon';

export const STYLES: { [style in Style]: Style } = {
  identicon: 'identicon',
};

export const ALL_STYLES = Object.keys(STYLES) as Style[];

const capitalize = (word: string) => {
  const [first, ...rest] = word.split('');
  return [first?.toUpperCase() ?? '', ...rest].join('');
};

export const formatStyle = (style: Style) => {
  return style
    .split(/(?=[A-Z])/)
    .map(capitalize)
    .join(' ');
};

export const toStyle = (style: string): Style => {
  if (style in STYLES) {
    return style as Style;
  }

  return STYLES['identicon'];
};

export type Seed = string & { type: 'Seed' };

export const toSeed = (seedString: string) => {
  return seedString.replace(' ', '').replace(';', '').replace('.', '') as Seed;
};

// Map style names to their respective packages
const styleToPackage = {
  identicon: identicon,
};

export const toUrl = ({
  seed,
  style = 'identicon',
}: {
  seed: Seed;
  style?: Style;
}) => {
  const stylePackage = styleToPackage[style];

  const avatar = createAvatar(stylePackage, {
    seed: seed,
    backgroundColor: ['ffffff'],
    backgroundType: ['solid'],
    radius: 50,
    size: 200,
  });

  return `data:image/svg+xml;utf8,${encodeURIComponent(avatar.toString())}`;
};

export const parseUrl = (
  avatarUrl?: string
): {
  seed: Seed;
  style: Style;
} => {
  try {
    if (!avatarUrl || !avatarUrl.startsWith('data:image/svg+xml')) {
      // Try to parse old URL format
      const url = new URL(avatarUrl ?? '');
      const pathParts = url.pathname.split('/');
      const style = pathParts[pathParts.length - 3];
      const seed = pathParts[pathParts.length - 2];

      if (style && seed) {
        return {
          style: toStyle(style),
          seed: toSeed(seed),
        };
      }
    }

    // Default values if we can't parse
    return {
      style: STYLES['identicon'],
      seed: toSeed(''),
    };
  } catch (error) {
    return {
      style: STYLES['identicon'],
      seed: toSeed(''),
    };
  }
};

export const generateRandomAvatarSeed = () => {
  return toSeed(String(Math.floor(Math.random() * 10000)));
};
