#!/bin/bash

set -e

API_URL="http://192.168.1.146:8000/api/recipes/"
RELEASE_TAG="recipes-data"
FILE="recipes.json"

echo "Downloading recipes from Django..."

curl -f "$API_URL" -o "$FILE"

echo "Downloaded $(jq length "$FILE") recipes."

if gh release view "$RELEASE_TAG" >/dev/null 2>&1; then
    echo "Updating existing GitHub Release..."
    gh release upload "$RELEASE_TAG" "$FILE" --clobber
else
    echo "Creating GitHub Release..."
    gh release create "$RELEASE_TAG" "$FILE" \
        --title "Recipes data" \
        --notes "Snapshot of the recipes database."
fi

rm "$FILE"

echo "Recipes release updated successfully!"