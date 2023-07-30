#!/bin/bash
# generate thumbnails for all tourney bgs
# chatgpt wrote this script

# Check if ImageMagick's 'convert' command is installed
if ! command -v convert &>/dev/null; then
    echo "ImageMagick 'convert' command not found. Please install ImageMagick and try again."
    exit 1
fi

# Set the source and destination directories
src_dir="client/src/public/backgrounds"
dest_dir="client/src/public/thumbnails"

# Loop through all files in the source directory
for file in "$src_dir"/*; do
    # Check if the file is an image
    if [[ -f "$file" && $(file -b --mime-type "$file") =~ ^image/ ]]; then
        # Extract the filename without the extension
        filename=$(basename -- "$file")
        filename_no_ext="${filename%.*}"

        # Use 'convert' to rescale the image to 135x90
        convert "$file" -resize 135x90 "$dest_dir/${filename_no_ext}-small.png"

        echo "Rescaled $file to $dest_dir/${filename_no_ext}-small.png"
    fi
done

echo "Rescaling complete."