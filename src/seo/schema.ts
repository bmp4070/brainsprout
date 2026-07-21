import { SITE_URL } from './constants';

/** WebSite structured data, placed on the home page. */
export function websiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BrainSprout',
    url: SITE_URL,
    description:
      'Free online word search and jigsaw games for kids ages 5 to 11.',
  };
}

export interface GameSchemaOptions {
  name: string;
  description: string;
  path: string;
  /** e.g. "8x8, 10x10, or 12x12 grid" */
  genre?: string;
}

/**
 * VideoGame structured data for a playable game or theme landing page.
 * VideoGame subtypes both Game and SoftwareApplication, so the
 * applicationCategory and offers fields validate cleanly.
 */
export function gameSchema({ name, description, path }: GameSchemaOptions): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name,
    description,
    url: `${SITE_URL}${path}`,
    applicationCategory: 'Game',
    audience: {
      '@type': 'PeopleAudience',
      suggestedMinAge: 5,
      suggestedMaxAge: 11,
    },
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };
}
