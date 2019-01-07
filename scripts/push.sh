#!/bin/bash
echo "Pushing to S3"
aws s3 cp ./deploy/ s3://${S3_BUCKET}/ --recursive --exclude "server-*"