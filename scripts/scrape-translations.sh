#!/usr/bin/env bash

teoutput="$(node scripts/print-enum-translations.mjs)"

ttregex='stringId="([^"]*)"\s*?fallback="([^"]*)'
ttoutput=$(rg -PINU --multiline-dotall $ttregex -or '"$1","$2"' | rg --multiline-dotall --passthru -U '\n\s*\b' -r '')

# Entries for getTranslation
gttregex="getTranslation\(\s*?[\"'](.*?)[\"'],.*?[\"'](.*?)[\"'].*?\)"
gttoutput=$(rg -PINU --multiline-dotall $gttregex -or '"$1","$2"')

# concatenate and sort
echo "$(printf "%s\n%s\n%s" "$ttoutput" "$gttoutput" "$teoutput" | sort -u)"
