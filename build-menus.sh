#!/bin/bash
# Regenerates the menu images from the PDFs in menus/source/ and updates the
# menu viewer in food-and-drink.html.
#
# To change a menu: drop the new PDF into menus/source/ under the same name
# (or edit menus/menus.json if the page numbers or labels changed), then run
# this script and commit the result.
#
# RUN THIS LOCALLY, ON A MAC. It renders the PDFs with Swift and PDFKit, which
# only exist on macOS — it cannot run on Cloudflare's Linux build image. Do not
# wire it up as a Pages build command; that will break the deploy. The site has
# no build step: Pages serves the committed files as-is, so the generated JPEGs
# must be committed to the repo, not produced in CI.
set -euo pipefail
cd "$(dirname "$0")"
echo "Rendering menus from menus/source/ ..."
swift tools/build-menus.swift .
