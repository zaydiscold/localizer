#!/usr/bin/env bash
# localizer installer — by zayd @ coldcooks

set -e

INSTALL_DIR="$HOME/.localizer"
REPO="https://github.com/zaydiscold/localizer"

echo ""
echo "  localizer — timezone converter extension"
echo ""

if [ -d "$INSTALL_DIR" ]; then
  echo "  updating existing install..."
  cd "$INSTALL_DIR" && git pull --quiet
else
  echo "  downloading..."
  git clone --quiet "$REPO" "$INSTALL_DIR"
fi

echo ""
echo "  installed to $INSTALL_DIR"
echo ""
echo "  load it in chrome:"
echo "    1. go to chrome://extensions"
echo "    2. turn on developer mode (top right)"
echo "    3. click 'load unpacked'"
echo "    4. select $INSTALL_DIR"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
  read -p "  open chrome://extensions now? [y/n] " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    open "chrome://extensions"
  fi
fi

echo "  done."
echo ""
