# Test du Mode Sombre - User Profile

## Modifications effectuées

1. **ThemeService** : Ajout de la gestion de la classe `dark` sur `document.documentElement`
2. **user-profile.html** : Ajout des classes Tailwind responsives au mode sombre (`dark:*`)
3. **tailwind.scss** : Configuration Tailwind v4 avec support du mode sombre
4. **Logs de débogage** : Ajoutés temporairement pour diagnostiquer

## Comment tester

1. **Démarrer l'application** :
   ```bash
   pnpm run start:frontend:with-project-config
   ```

2. **Naviguer vers la page user-profile** :
   - Aller à l'URL : `http://localhost:4200/users/userprofile`

3. **Tester le basculement de thème** :
   - Cliquer sur le bouton de thème dans le header (icône lune/soleil)
   - Vérifier dans la console du navigateur les logs :
     - `🌙 Mode sombre activé - classe dark ajoutée`
     - `☀️ Mode clair activé - classe dark supprimée`

4. **Vérifier visuellement** :
   - **Mode clair** : Fond gris clair, texte sombre
   - **Mode sombre** : Fond gris foncé, texte clair

## Classes modifiées dans user-profile.html

- `bg-gray-50` → `bg-gray-50 dark:bg-gray-900`
- `text-gray-900` → `text-gray-900 dark:text-gray-100`
- `text-gray-600` → `text-gray-600 dark:text-gray-400`
- `bg-white` → `bg-white dark:bg-gray-800`
- `border-gray-200` → `border-gray-200 dark:border-gray-600`
- `text-gray-700` → `text-gray-700 dark:text-gray-300`
- Champs input avec arrière-plan et bordures adaptés

## Debug

Si le mode sombre ne fonctionne pas :

1. **Vérifier la console** : Les logs doivent apparaître lors du clic
2. **Inspecter l'élément `<html>`** : Doit avoir la classe `dark` en mode sombre
3. **Vérifier Tailwind** : Les classes `dark:*` doivent être générées dans le CSS

## Nettoyage après test

Une fois le test validé, supprimer les logs de débogage du `ThemeService`.
