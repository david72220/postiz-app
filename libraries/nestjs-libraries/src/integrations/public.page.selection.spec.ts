import { describe, expect, it } from 'vitest';
import {
  PAGE_SELECTION,
  WIPED_CREDENTIALS,
  isAllowedRedirect,
  otherConnectedIds,
  toPublicPages,
} from './public.page.selection';

describe('toPublicPages', () => {
  it('never returns a page access token', () => {
    const pages = toPublicPages(
      [
        {
          id: '123',
          name: 'Ma Page',
          username: 'mapage',
          access_token: 'SECRET',
          picture: { data: { url: 'https://img/1.jpg' } },
        },
      ],
      new Set()
    );
    expect(JSON.stringify(pages)).not.toContain('SECRET');
    expect(pages).toEqual([
      {
        id: '123',
        name: 'Ma Page',
        username: 'mapage',
        picture: 'https://img/1.jpg',
        alreadyConnected: false,
      },
    ]);
  });

  it('flags a page already published to by another channel', () => {
    const pages = toPublicPages(
      [{ id: 1, name: 'A' }, { id: '2', name: 'B' }],
      new Set(['1'])
    );
    expect(pages.map((p) => p.alreadyConnected)).toEqual([true, false]);
  });

  it('accepts a LinkedIn string picture and ignores garbage', () => {
    expect(toPublicPages([{ id: 'x', picture: 'https://l/p.png' }], new Set())[0].picture).toBe('https://l/p.png');
    expect(toPublicPages(null, new Set())).toEqual([]);
    expect(toPublicPages([null, { name: 'no id' }], new Set())).toEqual([]);
  });
});

describe('otherConnectedIds', () => {
  it('skips the current channel and deleted ones', () => {
    const ids = otherConnectedIds(
      [
        { id: 'cur', internalId: 'user-1' },
        { id: 'a', internalId: 'page-1' },
        { id: 'b', internalId: 'page-2', deletedAt: new Date() },
      ],
      'cur'
    );
    expect([...ids]).toEqual(['page-1']);
  });
});

describe('PAGE_SELECTION', () => {
  it('rebuilds the provider payload from the listed page', () => {
    expect(PAGE_SELECTION.facebook.toSave({ id: 5 })).toEqual({ page: '5' });
    expect(PAGE_SELECTION.instagram.toSave({ id: 'ig', pageId: 'fb' })).toEqual({ id: 'ig', pageId: 'fb' });
    expect(PAGE_SELECTION['linkedin-page'].toSave({ id: '9' })).toEqual({ page: '9' });
    expect(PAGE_SELECTION['linkedin-page'].list).toBe('companies');
  });
});

describe('isAllowedRedirect', () => {
  const allowed = 'https://app.alliance-digitale.fr, https://other.example';

  it('accepts a listed https origin', () => {
    expect(isAllowedRedirect('https://app.alliance-digitale.fr/social/comptes/retour/abc', allowed)).toBe(true);
    expect(isAllowedRedirect('https://other.example/x', allowed)).toBe(true);
  });

  it('refuses anything else', () => {
    for (const url of [
      'https://evil.example/x',
      'https://app.alliance-digitale.fr.evil.example/x',
      'http://app.alliance-digitale.fr/x',
      'https://user:pw@app.alliance-digitale.fr/x',
      'javascript:alert(1)',
      '//app.alliance-digitale.fr/x',
      'not a url',
      '',
    ]) {
      expect(isAllowedRedirect(url, allowed), url).toBe(false);
    }
  });

  it('refuses plain http even when the origin is listed', () => {
    expect(isAllowedRedirect('http://dev.example/x', 'http://dev.example')).toBe(false);
  });

  it('refuses everything when no origin is configured', () => {
    expect(isAllowedRedirect('https://app.alliance-digitale.fr/x', undefined)).toBe(false);
    expect(isAllowedRedirect('https://app.alliance-digitale.fr/x', '')).toBe(false);
  });
});

describe('WIPED_CREDENTIALS', () => {
  it('clears every credential column', () => {
    expect(WIPED_CREDENTIALS).toEqual({
      token: '',
      refreshToken: null,
      tokenExpiration: null,
      customInstanceDetails: null,
    });
  });
});
