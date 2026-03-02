#!/bin/bash
set -e
# C3P Stage: Deploy to Production
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

echo "Deploying image ${IMAGE_TAG} to Production environment..."

# Apply namespace and deployment manifests using envsubst to inject IMAGE_TAG
envsubst '${IMAGE_TAG}' < k8s/prod/namespace.yaml | kubectl apply -f -
envsubst '${IMAGE_TAG}' < k8s/prod/deployment.yaml | kubectl apply -f -

echo "Waiting for rollout to complete..."
kubectl rollout status deployment/crisis-monitor -n crisis-monitor-prod --timeout=300s

echo "Getting Production LoadBalancer IP..."
PROD_IP=$(kubectl get service crisis-monitor -n crisis-monitor-prod \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

if [ -z "$PROD_IP" ]; then
  echo "Error: Could not retrieve Production LoadBalancer IP. Aborting smoke tests."
  exit 1
fi

export BASE_URL="http://${PROD_IP}"
export EXPECTED_GIT_SHA="${GITHUB_SHA}"
echo "Running Post-Release Smoke Tests against ${BASE_URL} (expecting SHA ${EXPECTED_GIT_SHA})..."
npm run test:smoke

echo "Production Deployment Complete. Generating Final Compliance Evidence Pack."
