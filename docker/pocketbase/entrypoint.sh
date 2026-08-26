#!/bin/sh
set -e

DATA_DIR=/pb/pb_data

mkdir -p "$DATA_DIR"
chown -R pbuser:pbuser "$DATA_DIR"

exec su-exec pbuser /pb/pocketbase serve --http=0.0.0.0:8090 --dir=/pb/pb_data