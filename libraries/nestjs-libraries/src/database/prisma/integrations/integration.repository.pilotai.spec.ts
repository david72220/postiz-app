import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@gitroom/nestjs-libraries/upload/upload.factory', () => ({
  UploadFactory: { createStorage: () => ({ uploadSimple: async (p: string) => p }) },
}));
vi.mock('@gitroom/nestjs-libraries/database/prisma/prisma.service', () => ({
  PrismaRepository: class {},
}));

import { IntegrationRepository } from './integration.repository';

const WIPED = { token: '', refreshToken: null, tokenExpiration: null, customInstanceDetails: null };

function repo() {
  const integration = {
    findUnique: vi.fn(),
    update: vi.fn(async (args: any) => ({ id: args.where.id })),
    updateMany: vi.fn(async () => ({ count: 1 })),
    findFirst: vi.fn(async () => null),
    upsert: vi.fn(async () => ({ id: 'up' })),
  };
  const post = { updateMany: vi.fn(async () => ({ count: 0 })) };
  const m = (model: any) => ({ model: { integration, post, ...model } });
  const r = new (IntegrationRepository as any)(m({}), m({}), m({}), m({}), m({}), m({}));
  return { r: r as IntegrationRepository, integration, post };
}

describe('deleteChannel (fork pilotai)', () => {
  it('soft-deletes and wipes every credential', async () => {
    const { r, integration } = repo();
    await r.deleteChannel('org', 'ch');
    const data = integration.update.mock.calls[0][0].data;
    expect(data).toMatchObject(WIPED);
    expect(data.deletedAt).toBeInstanceOf(Date);
  });
});

describe('updateIntegration — chosen page (fork pilotai)', () => {
  let ctx: ReturnType<typeof repo>;
  beforeEach(() => {
    ctx = repo();
  });

  it('refuses a page another LIVE channel already publishes to, without touching it', async () => {
    ctx.integration.findUnique.mockResolvedValueOnce({ id: 'other', deletedAt: null });
    await expect(
      ctx.r.updateIntegration('pending', { organizationId: 'org', internalId: 'page-1' } as any)
    ).rejects.toMatchObject({ status: 409 });
    expect(ctx.integration.update).not.toHaveBeenCalled();
    expect(ctx.post.updateMany).not.toHaveBeenCalled();
  });

  it('a soft-deleted channel of the page lives again; the pending row is deleted without credentials', async () => {
    ctx.integration.findUnique
      .mockResolvedValueOnce({ id: 'old', deletedAt: new Date() })
      .mockResolvedValueOnce({ rootInternalId: null, refreshToken: 'r', tokenExpiration: null });
    await ctx.r.updateIntegration('pending', { organizationId: 'org', internalId: 'page-1' } as any);
    const [retired, revived] = ctx.integration.update.mock.calls.map((c: any) => c[0]);
    expect(retired.where).toEqual({ id: 'pending' });
    expect(retired.data).toMatchObject(WIPED);
    expect(revived.where).toEqual({ id: 'old' });
    expect(revived.data).toMatchObject({ deletedAt: null, refreshToken: 'r' });
  });

  it('a free page is saved', async () => {
    ctx.integration.findUnique.mockResolvedValueOnce(null);
    await ctx.r.updateIntegration('pending', { organizationId: 'org', internalId: 'page-1' } as any);
    expect(ctx.integration.update.mock.calls.at(-1)[0].where).toEqual({ id: 'pending' });
  });
});

describe('createOrUpdateIntegration — LinkedIn one-time token copy (fork pilotai)', () => {
  it('never gives credentials back to a deleted channel', async () => {
    const { r, integration } = repo();
    await r.createOrUpdateIntegration(
      undefined, true, 'org', 'Name', undefined, 'social', 'li-1', 'linkedin', 'tok', 'ref', 3600
    );
    const copy = integration.updateMany.mock.calls.at(-1)[0];
    expect(copy.where).toMatchObject({ deletedAt: null });
  });
});
