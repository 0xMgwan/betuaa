#!/bin/bash
export DEPLOY_KEY=f050f5fc09623dbd6a4868b379ec6cdc
echo "v0.0.6" | npx graph deploy betuaa-ctf --node https://api.studio.thegraph.com/deploy/ --deploy-key $DEPLOY_KEY
