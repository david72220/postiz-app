// Page selection for two-step channels through the public API (fork
// david72220/postiz-app, branch pilotai). Pure helpers, no Nest or Prisma
// import, so they can be unit tested on their own.

export interface PublicPage {
  id: string;
  name: string;
  username: string | null;
  picture: string | null;
  // another live channel of the organization already publishes to this page:
  // choosing it again would replace (and delete) that channel
  alreadyConnected: boolean;
}

interface SelectionRule {
  list: 'pages' | 'companies';
  // what fetchPageInformation expects, rebuilt server-side from the listed
  // page so the caller only ever sends a page id
  toSave: (item: any) => Record<string, string>;
}

export const PAGE_SELECTION: Record<string, SelectionRule> = {
  facebook: {
    list: 'pages',
    toSave: (item) => ({ page: String(item.id) }),
  },
  instagram: {
    list: 'pages',
    toSave: (item) => ({ id: String(item.id), pageId: String(item.pageId) }),
  },
  'linkedin-page': {
    list: 'companies',
    toSave: (item) => ({ page: String(item.id) }),
  },
};

export function pictureUrl(picture: unknown): string | null {
  if (typeof picture === 'string') {
    return picture || null;
  }
  const url = (picture as any)?.data?.url;
  return typeof url === 'string' && url ? url : null;
}

// Never return the page access tokens that pages() includes
export function toPublicPages(
  items: unknown,
  connectedInternalIds: Set<string>
): PublicPage[] {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .filter((item) => item && item.id !== undefined && item.id !== null)
    .map((item) => ({
      id: String(item.id),
      name: typeof item.name === 'string' ? item.name : '',
      username: typeof item.username === 'string' ? item.username : null,
      picture: pictureUrl(item.picture),
      alreadyConnected: connectedInternalIds.has(String(item.id)),
    }));
}

// internalIds of the other live channels of the organization
export function otherConnectedIds(
  integrations: { id: string; internalId: string; deletedAt?: Date | null }[],
  currentId: string
): Set<string> {
  return new Set(
    integrations
      .filter((i) => i.id !== currentId && !i.deletedAt)
      .map((i) => String(i.internalId))
  );
}

// redirectUrl must be an https URL whose origin is listed (comma separated)
// in PUBLIC_API_REDIRECT_ORIGINS, otherwise the public API would hand out an
// open redirect on our domain
export function isAllowedRedirect(
  redirectUrl: string,
  allowedOrigins: string | undefined
): boolean {
  if (!redirectUrl || !allowedOrigins) {
    return false;
  }
  let url: URL;
  try {
    url = new URL(redirectUrl);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    return false;
  }
  return allowedOrigins
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .some((origin) => {
      try {
        return new URL(origin).origin === url.origin;
      } catch {
        return false;
      }
    });
}

// What a deleted channel keeps of its credentials: nothing. token is NOT NULL
// in the schema, hence the empty string.
export const WIPED_CREDENTIALS: {
  token: string;
  refreshToken: null;
  tokenExpiration: null;
  customInstanceDetails: null;
} = {
  token: '',
  refreshToken: null,
  tokenExpiration: null,
  customInstanceDetails: null,
};
