#!/bin/bash
echo "Deploying..."
aws s3 cp ./deploy/ s3://${S3_BUCKET}/ --recursive --exclude "server-*"