# Cockpit ERA - Guide de lancement Windows (Frontend)

Ce guide explique, pas a pas, comment installer les prerequis et lancer le frontend du projet sur **Windows**.

Perimetre de ce README:
- Frontend uniquement (`frontend/`)
- Installation de Node.js et npm
- Lancement en mode developpement
- Build de production et verification locale

## 1) Prerequis Windows

## 1.1 Installer Git for Windows

Si Git n'est pas encore installe:
- Telechargez: [https://git-scm.com/download/win](https://git-scm.com/download/win)
- Installez avec les options par defaut

Verification dans PowerShell:

```powershell
git --version
```

Vous devez voir une version (ex: `git version 2.x.x`).

## 1.2 Installer Node.js LTS (npm inclus)

Le frontend utilise Vite/Vue et se lance avec npm.

- Telechargez la version LTS de Node.js: [https://nodejs.org/](https://nodejs.org/)
- Installez avec les options par defaut (npm est installe automatiquement)
- Fermez puis reouvrez PowerShell apres installation

Verifications:

```powershell
node -v
npm -v
```

Vous devez obtenir deux numeros de version.

## 2) Recuperer le projet

Si vous n'avez pas encore le projet:

```powershell
git clone <URL_DU_REPO>
cd cockpit-era
```

Si le projet est deja sur votre machine, placez-vous a sa racine:

```powershell
cd "C:\chemin\vers\cockpit-era"
```

## 3) Se placer dans le frontend

```powershell
cd frontend
```

## 4) Installer les dependances npm

```powershell
npm install
```

Notes:
- Cette commande peut prendre de 30 secondes a quelques minutes selon votre connexion.
- Un dossier `node_modules` et un fichier `package-lock.json` sont utilises pour les dependances.

## 5) Lancer l'application en developpement

```powershell
npm run dev
```

Ensuite, ouvrez l'URL affichee dans le terminal (en general):
- [http://localhost:5173](http://localhost:5173)

Pour arreter le serveur:
- `Ctrl + C` dans le terminal

## 6) Construire la version production

```powershell
npm run build
```

Cette commande:
- verifie TypeScript (`vue-tsc -b`)
- genere le build Vite dans le dossier `dist/`

Pour verifier le build localement:

```powershell
npm run preview
```

Puis ouvrez l'URL affichee (souvent `http://localhost:4173`).

## 7) Resume ultra-rapide (copier/coller)

Depuis la racine du projet:

```powershell
cd frontend
npm install
npm run dev
```

## 8) Depannage Windows

## Probleme: `node` ou `npm` n'est pas reconnu

Symptome:
- `'node' n'est pas reconnu...`
- `'npm' n'est pas reconnu...`

Solutions:
- Verifier que Node.js est bien installe
- Fermer/reouvrir PowerShell
- Redemarrer Windows si besoin
- Reinstaller Node.js LTS (installateur officiel)

## Probleme: le port est deja utilise

Si `5173` est pris, Vite propose souvent un autre port automatiquement.
Sinon, fermez le processus qui utilise ce port, puis relancez:

```powershell
npm run dev
```

## Probleme: erreur reseau pendant `npm install`

Actions recommandees:

```powershell
npm cache clean --force
npm install
```

Si vous etes derriere un proxy d'entreprise, configurez npm selon votre environnement reseau.

## Probleme: installation corrompue ou incoherente

Depuis `frontend/`, suppression et reinstallation propre:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

## 9) Scripts disponibles (frontend)

Dans `frontend/package.json`:
- `npm run dev` : demarre le serveur de developpement Vite
- `npm run build` : verifie TypeScript puis build production
- `npm run preview` : sert le build localement pour verification

---

Si vous voulez ensuite un README **full stack** (Windows + backend Django + PostgreSQL), il faudra ajouter une section backend separee.
