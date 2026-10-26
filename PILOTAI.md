# Postiz — fork Alliance-digitale (branche `pilotai`)

Fork AGPL-3.0 de [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app), utilisé par
PilotAI (app.alliance-digitale.fr) sur l'instance Postiz auto-hébergée d'Alliance-digitale.
Le code modifié est public ici, conformément à l'article 13 de l'AGPL.

## Ce que le fork change (au-dessus du tag upstream)

| Commit | Changement |
|---|---|
| public API — page choice | `GET /public/v1/integrations/:id/pages` (liste des Pages d'un canal en attente, **sans jetons**, `alreadyConnected`), `POST /public/v1/integrations/:id/page` `{page}` (refus 409 si la Page est déjà reliée à un autre canal vivant), `redirectUrl` accepté sur `GET /public/v1/social/:id` si son origine est listée dans `PUBLIC_API_REDIRECT_ORIGINS`, `inBetweenSteps` dans `GET /public/v1/integrations` |
| state route guard | `POST /integrations/public/provider/:id/connect` refuse aussi une Page déjà reliée (une seule organisation pour tous les clients : la rechoisir supprimait l'autre canal) |
| frontend | page de retour : si l'application d'origine a demandé un retour (`returnURL`) et que le canal attend sa Page, redirection immédiate au lieu de l'écran de choix Postiz |
| credentials | un canal supprimé ne garde ni `token`, ni `refreshToken`, ni `customInstanceDetails` (`deleteChannel`, remplacement d'un canal, recopie `oneTimeToken` LinkedIn) |
| ci | `.github/workflows/pilotai-image.yml` : tag `pilotai-v<upstream>.<n>` → `ghcr.io/david72220/postiz-app:<upstream>-pilotai.<n>` (amd64) |

Fournisseurs pris en charge par le choix public : `facebook`, `instagram` (via une Page), `linkedin-page`
(`PAGE_SELECTION`, `libraries/nestjs-libraries/src/integrations/public.page.selection.ts`).

## Variable d'environnement

`PUBLIC_API_REDIRECT_ORIGINS=https://app.alliance-digitale.fr` — origines https autorisées pour
`redirectUrl`, séparées par des virgules. Absente : tout `redirectUrl` est refusé (400).

## Tests

```bash
npx vitest run --root libraries/nestjs-libraries/src/integrations public.page.selection
npx tsc --noEmit -p apps/backend/tsconfig.json   # erreurs upstream préexistantes, aucune dans les fichiers du fork
```

## Suivre une nouvelle version upstream

```bash
git fetch upstream --tags
git rebase --onto <nouveau-tag> <ancien-tag> pilotai
# relire le diff des fournisseurs Meta / LinkedIn (un nouveau scope casse toutes les connexions)
git push --force-with-lease origin pilotai
git tag pilotai-v<nouvelle-version>.1 && git push origin pilotai-v<nouvelle-version>.1
```
