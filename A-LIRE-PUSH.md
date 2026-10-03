# Site complet, prêt à pousser

Basé sur votre dépôt au commit **`966eece`**, avec les correctifs
manquants ajoutés à leur place.

Supprimez ce fichier avant de pousser, ou laissez-le : il est
inoffensif.

---

## Comment pousser

```bash
cd /home/user/SITE-A-PUSH
git init
git remote add origin https://github.com/ambiancesignaturecontact-blip/fais-ton-s-dalle.git
git add -A
git commit -m "Suppression de compte : route e-mail + utilisateur Auth"
git branch -M main
git push -u origin main --force
```

> `--force` est nécessaire : ce dossier n'a pas d'historique Git.
> Votre historique distant sera remplacé par un commit unique.
>
> Si vous préférez le conserver, copiez plutôt dans votre clone :
> ```bash
> cp -r /home/user/SITE-A-PUSH/src/* VOTRE-CLONE/src/
> ```

---

## Ce qui a été ajouté

Votre push précédent avait bien apporté la correction de l'e-mail.
Il manquait les deux fichiers de la suppression de compte — le
dossier `delete/` s'était perdu, comme `support/` la fois d'avant.

| Fichier | Action |
|---|---|
| `src/app/api/auth/delete/route.ts` | **nouveau** |
| `src/app/api/customer/route.ts` | remplacé |
| `src/__tests__/paiement.test.ts` | 6 tests ajoutés |

### `auth/delete` — suppression d'un compte e-mail

L'application appelait `/api/customer`, qui exige un jeton de session
SMS. Un compte créé par e-mail n'en a pas : la requête repartait en
**401 « Session expirée »**, et l'écran affichait « Suppression
impossible ».

Cette route couvre le second mode d'authentification, en vérifiant le
mot de passe au préalable.

### `customer` — supprime aussi l'utilisateur Auth

La fiche `customers` était effacée, mais l'utilisateur **Supabase
Auth** restait. Constaté en base : **trois comptes orphelins**.

Conséquences :
- identifiant et mot de passe toujours valides → le compte n'était
  pas réellement supprimé (guideline **5.1.1(v)**) ;
- impossible de se réinscrire avec la même adresse
  (« already been registered »).

---

## Vérifications effectuées sur CE dossier

| Contrôle | Résultat |
|---|---|
| `tsc --noEmit` | **0 erreur** |
| `eslint` | **0 erreur** |
| `jest` | **109 tests, 8 suites** |
| `next build --webpack` | **Compiled successfully** |

Serveur de production lancé en local, avec la vraie base :

```
création de compte                 200  emailEnvoye: true
suppression, MAUVAIS mot de passe  401  "E-mail ou mot de passe incorrect"
suppression, BON mot de passe      200  {"success":true,"supprime":true}
utilisateur Supabase Auth          effacé
réinscription, même adresse        200  ← impossible auparavant
```

> Une faille avait été introduite puis corrigée en cours de route :
> la vérification du mot de passe était conditionnée à la présence de
> `SUPABASE_ANON`. Sans cette clé, un mot de passe erroné supprimait
> quand même le compte. Elle est désormais inconditionnelle.

---

## Après le déploiement

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://www.faistonsdalle.com/api/auth/delete
```

Attendu : **200** (actuellement 404).

---

## Ensuite, le build iOS

```bash
cd /home/user/ftsd-ios
npm install --legacy-peer-deps
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production --latest
```

⚠️ La suppression ne fonctionnera pas sur le build actuel, même une
fois le site à jour : l'application embarquée ne connaît pas encore la
nouvelle route. Le build est indispensable.

Il apportera aussi : correction 3D (WebGL 1), navigation après
connexion, message de confirmation d'inscription, page de bienvenue
équilibrée, mise en page iPad.
