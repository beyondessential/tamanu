#!/usr/bin/env bash

set -euxo pipefail

ttregex='stringId="([^"]*)"\s*?fallback="([^"]*)'
gtregex="getTranslation\(\s*?[\"'](.*?)[\"'],.*?[\"'](.*?)[\"'].*?\)"

# Search one specific place or the whole repo.
# Useful to get a list of translations added in a branch by
# running git diff main..<branch> --unified=0 | grep '^+ ' > branch-diffs.txt
directory=${1-./packages}

# Get all registered enums if no directory is specified
teoutput=""
if [[ "$directory" == "./packages" ]]; then
  teoutput=$(npx tsx packages/constants/scripts/printTranslatedEnums.ts)
fi

# Get all translated string data from TranslatedText and getTranslatedString.
ttoutput=$(rg -PINU --multiline-dotall "$ttregex" -or '"$1","$2"' -g "*.{ts,tsx,js,jsx}" "$directory" \
    | rg --multiline-dotall --passthru -U '\n\s*\b' -r '' )
gtoutput=$(rg -PINU --multiline-dotall "$gtregex" -or '"$1","$2"' -g "*.{ts,tsx,js,jsx}" "$directory")

# Combine and sort
data=$(printf "%s\n%s\n%s" "$ttoutput" "$gtoutput" "$teoutput" | sort -u)

if [ -z "$data" ]; then
    echo 'No data found'
    exit 1
fi

duplicates=$(cut -d, -f1 <<< "$data" | sort | uniq -d)
if [ ! -z "$duplicates" ]; then
    echo '!!! Duplicates found !!!'
    echo "$data"
    exit 2
fi

# Append csv header and print data
printf "stringId,en\n"languageName","English"\n"countryCode","gb"\n%s" "$data"
