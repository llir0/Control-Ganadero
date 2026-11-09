#!/usr/bin/env bash
# Sube el proyecto a GitHub (une historiales y hace push). Uso: ./subir.sh
set -e
cd "$(dirname "$0")"

if [ -z "$(git config user.name)" ];  then read -p "Tu nombre para git: " n; git config user.name "$n"; fi
if [ -z "$(git config user.email)" ]; then read -p "Tu correo para git: " e; git config user.email "$e"; fi

npm run build
git add -A
git commit -m "Add vercel.json y proyecto completo" || echo "Nada nuevo que commitear"
git fetch origin
git merge origin/main --allow-unrelated-histories --no-edit -X ours || {
  echo "Conflictos: resuélvelos, haz 'git commit' y vuelve a ejecutar."; exit 1; }
git push origin main
echo "Listo. Haz Redeploy en Vercel del último commit."
