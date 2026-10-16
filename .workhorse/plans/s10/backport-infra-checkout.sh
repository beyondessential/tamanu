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
# Every run fetches the release branches first, so it always works from their current tips.
#
# Usage:
#   backport-infra-checkout.sh                    check the edit applies to every branch, change nothing
#   backport-infra-checkout.sh --commit           also commit it to a local branch per release
#   backport-infra-checkout.sh --push             also push those branches and open a PR per release with gh
#   backport-infra-checkout.sh --push --deploy 2.67
#                                                 as above, and tick Deploy on that release's PR
#                                                 (a cheap end-to-end test of the infra checkout)
#   backport-infra-checkout.sh --push 2.60 2.61   limit to the listed releases
#
# Re-running is safe. A release is skipped entirely when its branch on origin already checks out
# infra, or when a PR (open, merged or closed) already exists from our branch. A local branch left
# over from --commit is reused rather than recreated.
set -euo pipefail

RELEASES=(2.43 2.53 2.54 2.57 2.60 2.61 2.62 2.63 2.64 2.65 2.66 2.67)
ACTION=.github/actions/setup-cd/action.yml
TEMPLATE=.github/pull_request_template.md
PR_TITLE='ci(cd): S10: check out infra instead of ops in setup-cd'
COMMIT_MESSAGE="$PR_TITLE

The Pulumi programs now live in the public beyondessential/infra repo.
Keep the ops/ checkout path and the ops-* input names so cd-up and cd-down
need no change.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
PR_SUMMARY='🤖 The Pulumi programs now live in the public `beyondessential/infra` repo, so `setup-cd` checks that out instead of `beyondessential/ops`. Only the checkout step changes: `repository` points at infra and the `ssh-key` is dropped, since infra is public. The `ops/` path and the `ops-*` inputs stay, so `cd-up` and `cd-down` are unchanged.

`TAMANU_OPS_SSH` must stay defined until every release branch carries this change, as `cd-up` and `cd-down` still use it to decide whether to run the setup.'

mode=check
deploy_release=
selected=()
while [ $# -gt 0 ]; do
  case "$1" in
    --commit) [ "$mode" = push ] || mode=commit ;;
    --push) mode=push ;;
    --deploy) deploy_release=${2:?--deploy needs a release, e.g. 2.67}; shift ;;
    [0-9]*.[0-9]*) selected+=("$1") ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
  shift
done
if [ ${#selected[@]} -gt 0 ]; then RELEASES=("${selected[@]}"); fi

repo_root=$(git rev-parse --show-toplevel)
cd "$repo_root"

if [ "$mode" = push ]; then
  gh auth status >/dev/null
fi

echo "fetching ${#RELEASES[@]} release branches..."
git fetch --quiet origin "${RELEASES[@]/#/release/}"

scratch=$(mktemp -d)
trap 'git worktree prune; rm -rf "$scratch"' EXIT

pr_body() {
  local base=$1 release=$2 template body
  # the template can differ per branch, so use the target branch's own
  template=$(git show "origin/$base:$TEMPLATE")
  local placeholder='_Add a brief description of the changes in this PR to help give the reviewer context._'
  if [[ "$template" != *"$placeholder"* ]]; then
    echo "$base: PR template has no Changes placeholder" >&2
    return 1
  fi
  body=${template/"$placeholder"/"$PR_SUMMARY"}
  if [ "$release" = "$deploy_release" ]; then
    body=${body/'- [ ] **Deploy** <!-- #deploy -->'/'- [x] **Deploy** <!-- #deploy -->'}
  fi
  printf '%s' "$body"
}

failed=()
for release in "${RELEASES[@]}"; do
  base="release/$release"
  branch="ci/S10/infra-checkout-$release"
  tree="$scratch/$release"

  # already merged into the release branch (or done by hand): nothing to do
  if git show "origin/$base:$ACTION" | grep -q '^        repository: beyondessential/infra$'; then
    echo "done  $base already checks out infra"
    continue
  fi

  # an open, merged or closed PR from our branch means this release has been handled; don't push again
  if [ "$mode" = push ]; then
    existing=$(gh pr list --base "$base" --head "$branch" --state all --json url,state --jq '.[0] | select(.) | "\(.state) \(.url)"')
    if [ -n "$existing" ]; then
      echo "pr    $base already has a PR: $existing"
      continue
    fi
  fi

  if [ "$mode" != check ] && git rev-parse --verify --quiet "refs/heads/$branch" >/dev/null; then
    echo "have  $branch already exists locally, not recreating it"
  else
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
  fi

  [ "$mode" = push ] || continue

  git push --quiet origin "$branch"
  echo "push  $branch"

  url=$(gh pr create --base "$base" --head "$branch" --title "$PR_TITLE" --body "$(pr_body "$base" "$release")") \
    || { echo "FAIL  $base: could not open PR"; failed+=("$release"); continue; }
  echo "pr    $url"
done

if [ ${#failed[@]} -gt 0 ]; then
  echo "failed: ${failed[*]}" >&2
  exit 1
fi
