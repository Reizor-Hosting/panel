#!/bin/ash
# Cosmic Frontiers Server Install Script
# Server Files: /mnt/server

# Create server directory
mkdir -p /mnt/server
cd /mnt/server || exit

# Remove old modpack files if they exist.
rm -rf libraries
rm -rf mods
rm -rf coremods
rm -rf .fabric
rm -f user_jvm_args.txt
rm -f server.jar

# Install required tools
apk add wget jq unzip zip

echo "Downloading modpack archive..."
wget -O artifact.zip "${PACK_LINK}"

# Download the server mods blacklist config
echo "Downloading server mods blacklist configuration..."
wget -O server-mods-config.json "https://raw.githubusercontent.com/Frontiers-PackForge/CosmicFrontiers/main-1.20.1-Forge/server-mods-config.json"

if [ ! -f server-mods-config.json ]; then
    echo "Warning: Could not download server-mods-config.json, proceeding without filtering"
    minecraft_modpack_server_installer --provider detect --file artifact.zip --directory /mnt/server
    echo "Installer completed"
    exit 0
fi

# Extract the artifact to a temporary directory
echo "Extracting modpack archive..."
TEMP_DIR=$(mktemp -d)
unzip -q artifact.zip -d "$TEMP_DIR"

# Find the manifest.json (it could be in root or a subdirectory)
MANIFEST_PATH=$(find "$TEMP_DIR" -name "manifest.json" -type f | head -n 1)

if [ -z "$MANIFEST_PATH" ]; then
    echo "Warning: manifest.json not found in archive, proceeding without filtering"
    rm -rf "$TEMP_DIR"
    minecraft_modpack_server_installer --provider detect --file artifact.zip --directory /mnt/server
    echo "Installer completed"
    exit 0
fi

echo "Found manifest at: $MANIFEST_PATH"

# Extract blacklisted mod IDs from the config
BLACKLIST_IDS=$(jq -r '.blacklist[].id' server-mods-config.json | tr '\n' ' ')

if [ -z "$BLACKLIST_IDS" ]; then
    echo "No blacklisted mods found, proceeding without filtering"
    rm -rf "$TEMP_DIR"
    minecraft_modpack_server_installer --provider detect --file artifact.zip --directory /mnt/server
    echo "Installer completed"
    exit 0
fi

echo "Blacklisted mod IDs: $BLACKLIST_IDS"

# Filter the manifest.json to remove blacklisted mods
# Create a jq filter that removes files with projectID matching any blacklist ID
FILTER='map(select('
FIRST=1
for ID in $BLACKLIST_IDS; do
    if [ $FIRST -eq 1 ]; then
        FILTER="${FILTER}.projectID != ${ID}"
        FIRST=0
    else
        FILTER="${FILTER} and .projectID != ${ID}"
    fi
done
FILTER="${FILTER}))"

echo "Filtering manifest.json..."
# Backup original manifest
cp "$MANIFEST_PATH" "${MANIFEST_PATH}.backup"

# Apply filter to the files array in manifest
jq ".files |= $FILTER" "$MANIFEST_PATH" > "${MANIFEST_PATH}.filtered"
mv "${MANIFEST_PATH}.filtered" "$MANIFEST_PATH"

# Count how many mods were removed
ORIGINAL_COUNT=$(jq '.files | length' "${MANIFEST_PATH}.backup")
FILTERED_COUNT=$(jq '.files | length' "$MANIFEST_PATH")
REMOVED_COUNT=$((ORIGINAL_COUNT - FILTERED_COUNT))

echo "Removed $REMOVED_COUNT blacklisted mods from manifest ($ORIGINAL_COUNT -> $FILTERED_COUNT mods)"

# Re-package the archive
echo "Re-packaging filtered archive..."
rm -f artifact.zip
cd "$TEMP_DIR" || exit
zip -qr /mnt/server/artifact.zip .
cd /mnt/server || exit

# Clean up temp directory
rm -rf "$TEMP_DIR"
rm -f server-mods-config.json

# Run the installer with the filtered archive
echo "Running modpack installer..."
minecraft_modpack_server_installer --provider detect --file artifact.zip --directory /mnt/server

# Clean up the artifact
rm -f artifact.zip

echo "Installer completed successfully"

