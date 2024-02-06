import argparse
import os
from gql import gql, Client
from gql.transport.httpx import HTTPXTransport
import boto3

parser = argparse.ArgumentParser()
parser.add_argument("--github-token", required=True)
parser.add_argument("--branch", required=True)
args = parser.parse_args()

aws_client = boto3.client("s3")
dumped_iter = iter(
    aws_client.get_paginator("list_objects_v2").paginate(
        Bucket="bes-tamanu-test-data-snapshots", Delimiter="/"
    )
)

transport = HTTPXTransport(
    url="https://api.github.com/graphql",
    headers={"authorization": f"Bearer {args.github_token}"},
)
gql_client = Client(transport=transport, fetch_schema_from_transport=True)
query_string = """
query($endCursor: String) {
  repository(owner: "beyondessential", name: "tamanu") {
    ref(qualifiedName: "{{branch}}") {
      target {
        ...on Commit {
          history(after: $endCursor) {
            nodes { oid }
              pageInfo {
                  hasNextPage
                  endCursor
              }
          }
        }
      }
    }
  }
}
""".replace(
    "{{branch}}", args.branch
)
gh_query = gql(query_string)

dumped = next(dumped_iter)
commits = gql_client.execute(gh_query)["repository"]["ref"]["target"]["history"]

commits_iter = iter(commits["nodes"])
while True:
    try:
        # Return if this commit hash is in the dumped list.
        commit = next(commits_iter)["oid"]
        hashes = map(lambda d: d["Prefix"][:-1], dumped["CommonPrefixes"])
        if any([hash == commit for hash in hashes]):
            print(commit)
            exit(0)
    except StopIteration:
        # Fetch more commits if any.
        if commits["pageInfo"]["hasNextPage"]:
            new_commits = gql_client.execute(
                gh_query, {"endCursor": commits["pageInfo"]["endCursor"]}
            )["repository"]["ref"]["target"]["history"]
            commits["nodes"].extend(new_commits["nodes"])
            commits = {"nodes": commits["nodes"], "pageInfo": new_commits["pageInfo"]}
            commits_iter = iter(new_commits["nodes"])
            continue
        # With all commits fetched, retry with the next page of the dumped list until the end.
        # Fetching the commits first ensures we check the latest commit from the branch.
        commits_iter = iter(commits["nodes"])
        try:
            dumped = next(dumped_iter)
        except StopIteration:
            print(f"No commit found from {args.branch} in the bucket")
            exit(1)
