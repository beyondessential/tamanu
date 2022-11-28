#!/bin/bash
echo "Pushing to S3"
ls ./deploy
aws s3 cp ./deploy/ s3://${S3_BUCKET}/ --recursive --exclude "server-*" --no-progress
