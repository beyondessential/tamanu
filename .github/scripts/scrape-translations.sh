#!/bin/bash

ttregex='stringId="([^"]*)"\s*?fallback="([^"]*)'
gtregex="getTranslation\(\s*?[\"'](.*?)[\"'],.*?[\"'](.*?)[\"'].*?\)"

# Get all translated string data from TranslatedText, getTranslatedString and enums.
teoutput=$(npx tsx packages/constants/scripts/printTranslatedEnums.ts)
ttoutput=$(rg -PINU --multiline-dotall $ttregex -or '"$1","$2"' -g "*.{ts,tsx,js,jsx}" ./packages \
    | rg --multiline-dotall --passthru -U '\n\s*\b' -r '' )
gtoutput=$(rg -PINU --multiline-dotall $gtregex -or '"$1","$2"' -g "*.{ts,tsx,js,jsx}" ./packages)

# Combine and sort
data=$(printf "%s\n%s\n%s" "$ttoutput" "$gtoutput" "$teoutput" | sort -u)

if [ -z "$data" ]; then
    echo "No data found"
    exit 1
fi

# Append header and write to csv file
printf "stringId,fallback\n%s" "$data"
