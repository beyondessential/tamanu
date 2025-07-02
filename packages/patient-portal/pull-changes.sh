#!/bin/bash
mkdir -p packages/patient-portal/legacy/hackathon-a packages/patient-portal/legacy/hackathon-b

TARGET_DIR="packages/web"

# For branch A
echo "Processing hackathon-patient-portal-epic-fret branch..."
git log --pretty=format:%H --reverse main..origin/hackathon-patient-portal-epic-fret | while read commit; do
  git diff-tree --no-commit-id --name-only -r "$commit" -- "$TARGET_DIR" | while read file; do
    if git show "$commit:$file" > /dev/null 2>&1; then
      mkdir -p "packages/patient-portal/legacy/hackathon-a/$(dirname "$file")"
      git show "$commit:$file" > "packages/patient-portal/legacy/hackathon-a/$file"
      echo "Extracted: $file from commit $commit"
    fi
  done
done

# For branch B
echo "Processing hackathon/patient-portal-team-that-will-win branch..."
git log --pretty=format:%H --reverse main..origin/hackathon/patient-portal-team-that-will-win | while read commit; do
  git diff-tree --no-commit-id --name-only -r "$commit" -- "$TARGET_DIR" | while read file; do
    if git show "$commit:$file" > /dev/null 2>&1; then
      mkdir -p "packages/patient-portal/legacy/hackathon-b/$(dirname "$file")"
      git show "$commit:$file" > "packages/patient-portal/legacy/hackathon-b/$file"
      echo "Extracted: $file from commit $commit"
    fi
  done
done

echo "Done! Check packages/patient-portal/legacy/hackathon-a and packages/patient-portal/legacy/hackathon-b directories."
