#!/usr/bin/env bash
# Backport the minimal ops -> infra change to the supported release branches.
#
# On each release branch the only thing that names the repo is the "Checkout ops" step of
# .github/actions/setup-cd/action.yml. This points it at beyondessential/infra and drops the
# ssh-key (infra is public; the ops deploy key is bound to the ops repo). The `ops/` checkout
# path and the `ops-ssh-key` / `ops-ref` input names stay, so cd-up.yml and cd-down.yml on the
# branch are untouched. The TAMANU_OPS_SSH secret must therefore stay defined (any non-empty
# value) until every branch has been backported and no longer passes it.
#
# Prerequisite: beyondessential/infra must have a .node-version at its root.
#
# Usage:
#   backport-infra-checkout.sh                  check the edit applies to every branch, change nothing
#   backport-infra-checkout.sh --commit         also commit it to a local branch per release
#   backport-infra-checkout.sh --push          also push those branches (PR them into the release branch)
#   backport-infra-checkout.sh --commit 2.60    limit to the listed releases
set -euo pipefail

RELEASES=(2.43 2.53 2.54 2.57 2.60 2.61 2.62 2.63 2.64 2.65 2.66 2.67)
ACTION=.github/actions/setup-cd/action.yml
COMMIT_MESSAGE='ci(cd): S10: check out infra instead of ops in setup-cd

The Pulumi programs now live in the public beyondessential/infra repo.
Keep the ops/ checkout path and the ops-* input names so cd-up and cd-down
need no change.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>'

mode=check
selected=()
for arg in "$@"; do
  case "$arg" in
    --commit) mode=commit ;;
    --push) mode=push ;;
    [0-9]*.[0-9]*) selected+=("$arg") ;;
    *) echo "unknown argument: $arg" >&2; exit 2 ;;
  esac
done
if [ ${#selected[@]} -gt 0 ]; then RELEASES=("${selected[@]}"); fi

repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"
git fetch --quiet origin "${RELEASES[@]/#/release/}"

scratch=$(mktemp -d)
trap 'git worktree prune; rm -rf "$scratch"' EXIT

failed=()
for release in "${RELEASES[@]}"; do
  base="release/$release"
  branch="ci/S10/infra-checkout-$release"
  tree="$scratch/$release"

  git worktree add --quiet --detach "$tree" "origin/$base"
  (
    cd "$tree"

    # exactly one of each, or this branch's action has drifted and needs a human
    [ "$(grep -c '^        repository: beyondessential/ops$' "$ACTION")" = 1 ]
    [ "$(grep -c '^        ssh-key: \${{ inputs.ops-ssh-key }}$' "$ACTION")" = 1 ]

    sed -i \
      -e 's#^        repository: beyondessential/ops$#        repository: beyondessential/infra#' \
      -e '/^        ssh-key: \${{ inputs.ops-ssh-key }}$/d' \
      "$ACTION"

    if grep -qE 'beyondessential/ops|ssh-key: ' "$ACTION"; then
      echo "$base: ops reference or ssh-key left over" >&2
      exit 1
    fi
    [ "$(git diff --numstat -- "$ACTION" | cut -f1,2)" = "$(printf '1\t2')" ]
  ) || { echo "FAIL  $base"; failed+=("$release"); git worktree remove --force "$tree"; continue; }

  if [ "$mode" = check ]; then
    echo "ok    $base ($(git -C "$tree" diff --shortstat -- "$ACTION" | xargs))"
    git worktree remove --force "$tree"
    continue
  fi

  git -C "$tree" switch --quiet -c "$branch"
  git -C "$tree" commit --quiet -am "$COMMIT_MESSAGE"
  git worktree remove --force "$tree"
  echo "commit $branch (on $base)"

  if [ "$mode" = push ]; then
    git push --quiet origin "$branch"
    echo "push  $branch -> open a PR into $base"
  fi
done

if [ ${#failed[@]} -gt 0 ]; then
  echo "failed: ${failed[*]}" >&2
  exit 1
fi
