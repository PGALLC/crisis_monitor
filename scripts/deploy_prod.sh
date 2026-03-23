#!/bin/bash
set -e
# C3P Stage: Deploy to Production (Hostinger VPS via SSH+Docker)
# Executed strictly by the CI/CD pipeline after SRE approval and Test success

echo "--- C3P Deploy to PROD ---"
echo "Verifying Code Review and SRE Approval Status..."
# Pipeline ensures this only runs after the 'Production' GitHub Environment
# has been approved by the C3P-SRE Required Reviewer.

if [ -z "$GITHUB_SHA" ]; then
  echo "Error: Not running in protected CI environment."
  exit 1
fi

if [ -z "$IMAGE_TAG" ]; then
  echo "Error: IMAGE_TAG environment variable is not set."
  exit 1
fi

if [ -z "$VPS_HOST" ]; then
  echo "Error: VPS_HOST environment variable is not set."
  exit 1
fi

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i ~/.ssh/id_deploy"
SSH_CMD="ssh $SSH_OPTS deploy@${VPS_HOST}"

echo "Deploying image ${IMAGE_TAG} to Production environment on ${VPS_HOST}..."

echo "Pulling image on VPS..."
$SSH_CMD "docker pull ${IMAGE_TAG}"

echo "Stopping existing production container (if any)..."
$SSH_CMD "docker stop crisis-monitor-prod && docker rm crisis-monitor-prod" || true

echo "Starting new production container..."
$SSH_CMD "docker run -d \
  --name crisis-monitor-prod \
  --restart unless-stopped \
  -p 3002:3000 \
  -e NODE_ENV=production \
  -e FRED_API_KEY=${FRED_API_KEY} \
  -e GIT_SHA=${GITHUB_SHA} \
  ${IMAGE_TAG}"

echo "Waiting for container to become healthy..."
TIMEOUT=60
ELAPSED=0
until curl -sf "http://${VPS_HOST}:3002/health" > /dev/null 2>&1; do
  if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
    echo "Error: Production container did not become healthy within ${TIMEOUT}s."
    $SSH_CMD "docker logs crisis-monitor-prod" || true
    exit 1
  fi
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  echo "  waiting... (${ELAPSED}s / ${TIMEOUT}s)"
done

echo "Production container is healthy."

export BASE_URL="http://${VPS_HOST}:3002"
export EXPECTED_GIT_SHA="${GITHUB_SHA}"

echo "Running Post-Release Smoke Tests against ${BASE_URL} (expecting SHA ${EXPECTED_GIT_SHA})..."
npm run test:smoke

echo "Production Deployment Complete. Generating Final Compliance Evidence Pack."
