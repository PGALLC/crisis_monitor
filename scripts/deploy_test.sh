#!/bin/bash
set -e
# C3P Stage: Deploy to Test Environment (Hostinger VPS via SSH+Docker)
# Executed strictly by the CI/CD pipeline (Deployer Role)

echo "--- C3P Deploy to TEST ---"
echo "Validating Evidence Pack (Commit SHA, Image Tag)..."

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

echo "Deploying image ${IMAGE_TAG} to Test environment on ${VPS_HOST}..."

echo "Pulling image on VPS..."
$SSH_CMD "docker pull ${IMAGE_TAG}"

echo "Stopping existing test container (if any)..."
$SSH_CMD "docker stop crisis-monitor-test && docker rm crisis-monitor-test" || true

echo "Starting new test container..."
$SSH_CMD "docker run -d \
  --name crisis-monitor-test \
  --restart unless-stopped \
  -p 3001:3000 \
  -e NODE_ENV=test \
  -e FRED_API_KEY=${FRED_API_KEY} \
  -e GIT_SHA=${GITHUB_SHA} \
  ${IMAGE_TAG}"

echo "Waiting for container to become healthy..."
TIMEOUT=60
ELAPSED=0
until curl -sf "http://${VPS_HOST}:3001/health" > /dev/null 2>&1; do
  if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
    echo "Error: Test container did not become healthy within ${TIMEOUT}s."
    $SSH_CMD "docker logs crisis-monitor-test" || true
    exit 1
  fi
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  echo "  waiting... (${ELAPSED}s / ${TIMEOUT}s)"
done

echo "Test container is healthy."

export BASE_URL="http://${VPS_HOST}:3001"
export EXPECTED_GIT_SHA="${GITHUB_SHA}"

echo "Running Functional Tests against ${BASE_URL}..."
npm run test:functional

echo "Running Smoke Tests against ${BASE_URL} (expecting SHA ${EXPECTED_GIT_SHA})..."
npm run test:smoke

echo "Test Environment Deployment and Validation Complete."
