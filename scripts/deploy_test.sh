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

echo "Test Environment Deployment and Validation Complete."
