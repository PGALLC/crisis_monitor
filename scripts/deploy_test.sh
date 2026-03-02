#!/bin/bash
set -e
# C3P Stage: Deploy to Test Environment
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

echo "Deploying image ${IMAGE_TAG} to Test environment..."

# Apply namespace and deployment manifests using envsubst to inject IMAGE_TAG
envsubst '${IMAGE_TAG}' < k8s/test/namespace.yaml | kubectl apply -f -
envsubst '${IMAGE_TAG}' < k8s/test/deployment.yaml | kubectl apply -f -

echo "Waiting for rollout to complete..."
kubectl rollout status deployment/crisis-monitor -n crisis-monitor-test --timeout=300s

echo "Running Functional / Regression Tests..."
npm run test:functional

echo "Getting Test LoadBalancer IP..."
TEST_IP=$(kubectl get service crisis-monitor -n crisis-monitor-test \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

if [ -z "$TEST_IP" ]; then
  echo "Error: Could not retrieve Test LoadBalancer IP. Aborting smoke tests."
  exit 1
fi

export BASE_URL="http://${TEST_IP}"
export EXPECTED_GIT_SHA="${GITHUB_SHA}"
echo "Running Smoke Tests against ${BASE_URL} (expecting SHA ${EXPECTED_GIT_SHA})..."
npm run test:smoke

echo "Test Environment Deployment and Validation Complete."
