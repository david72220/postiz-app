# Postiz — fork Alliance-digitale (branche `pilotai`)

Fork AGPL-3.0 de [gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app), utilisé par
PilotAI (app.alliance-digitale.fr) sur l'instance Postiz auto-hébergée d'Alliance-digitale.
Le code modifié est public ici, conformément à l'article 13 de l'AGPL.

## Ce que le fork change (au-dessus du tag upstream)

| Commit | Changement |
|---|---|
| public API — page choice | `GET /public/v1/integrations/:id/pages` (liste des Pages d'un canal en attente, **sans jetons**, `alreadyConnected`), `POST /public/v1/integrations/:id/page` `{page}` (refus 409 si la Page est déjà reliée à un autre canal vivant), `redirectUrl` accepté sur `GET /public/v1/social/:id` si son origine est listée dans `PUBLIC_API_REDIRECT_ORIGINS`, `inBetweenSteps` dans `GET /public/v1/integrations` |
| page guard | `updateIntegration` (seul écrivain d'une Page choisie, toutes routes) refuse 409 une Page déjà reliée à un autre canal vivant : une seule organisation pour tous les clients, la rechoisir donnait à l'autre canal le jeton du nouveau venu et supprimait le nouveau canal. La réponse de `social-connect` ne renvoie plus les jetons des Pages |
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
npx vitest run -c vitest.pilotai.config.mts
npx tsc --noEmit -p apps/backend/tsconfig.json   # erreurs upstream préexistantes, aucune dans les fichiers du fork
```

## Suivre une nouvelle version upstream

Fusion du nouveau tag (jamais de rebase : l'historique publié n'est pas réécrit, pas de force-push).

```bash
git fetch upstream --tags
git switch pilotai && git merge --no-ff <nouveau-tag>
# relire le diff des fournisseurs Meta / LinkedIn (un nouveau scope casse toutes les connexions)
npx vitest run -c vitest.pilotai.config.mts
git push origin pilotai
git tag pilotai-v<nouvelle-version>.1 && git push origin pilotai-v<nouvelle-version>.1
```

`git diff <tag-upstream> pilotai` montre à tout moment l'écart exact du fork.
`.github/workflows/build-containers.yml` (upstream) est retiré du fork : il publierait vers `ghcr.io/gitroomhq` à chaque tag.
