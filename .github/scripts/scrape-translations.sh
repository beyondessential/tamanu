#!/bin/bash

# Get all translated string data from TranslatedText, getTranslatedString and enums.
teoutput=$(npx tsx packages/constants/scripts/printTranslatedEnums.ts)
ttoutput=$(rg -PINU --multiline-dotall 'stringId="([^"]*)"\s*?fallback="([^"]*)' -or '"$1","$2"' \
    | rg --multiline-dotall --passthru -U '\n\s*\b' -r '')
gtoutput=$(rg -PINU --multiline-dotall "getTranslation\(\s*?[\"'](.*?)[\"'],.*?[\"'](.*?)[\"'].*?\)" -or '"$1","$2"')

# Combine and sort
data=$(printf "%s\n%s\n%s" "$ttoutput" "$gtoutput" "$teoutput" | sort -u)

# if no data, exit
if [ -z "$data" ]; then
    echo "No data found"
    exit 1
fi

# Append header and write to csv file
printf "stringId,fallback\n%s" "$data"
