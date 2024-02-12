#!/usr/bin/env python3

import subprocess
import boto3

aws_client = boto3.client("s3")
dumped_iter = iter(
    aws_client.get_paginator("list_objects_v2").paginate(
        Bucket="bes-tamanu-test-data-snapshots", Delimiter="/"
    )
)

commits_bytes = subprocess.run(
    ["/usr/bin/git", "log", "--pretty=format:%H"], check=True, capture_output=True
).stdout.splitlines()
commits = map(lambda c: str(c, encoding="ascii"), commits_bytes)

dumped = next(dumped_iter)
commits_iter = iter(commits)
while True:
    try:
        # Return if this commit hash is in the dumped list.
        commit = next(commits_iter)
        hashes = map(lambda d: d["Prefix"][:-1], dumped["CommonPrefixes"])
        if any([hash == commit for hash in hashes]):
            print(commit)
            exit(0)
    except StopIteration:
        # Retry with the next page of the dumped list until the end.
        # Fetching the commits first ensures we check the latest commit from the branch.
        commits_iter = iter(commits)
        try:
            dumped = next(dumped_iter)
        except StopIteration:
            print(f"No commit found in the bucket")
            exit(1)
