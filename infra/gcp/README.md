# Infrastructure Setup Instructions (GCP & Kubernetes)

This guide walks you through provisioning the Google Cloud Platform (GCP) resources required for the Crisis Monitor project using the provided Terraform script. 

The script will automatically create:
1.  A **GKE Autopilot Cluster** (Google Kubernetes Engine). Autopilot is highly recommended because Google manages the worker nodes automatically, and you only pay for the exact CPU/RAM your pods use.
2.  A **Dedicated Service Account** (`github-actions-deployer`) specifically scoped so GitHub can deploy to the cluster safely.

## Prerequisites
Before running these commands on your terminal, ensure you have the `gcloud` CLI and `terraform` installed. 

## Step 1: Authenticate with Google Cloud
Open your terminal and run:
```bash
gcloud auth login
gcloud config set project paulgresham-com
```
*(This will open a browser window for you to log into your Google account).*

We also need to provide Terraform with Application Default Credentials so it can execute the script:
```bash
gcloud auth application-default login
```

## Step 2: Run the Terraform Script
Navigate to the infrastructure directory and apply the configuration:

```bash
cd ~/hacking/crisis_monitor/infra/gcp

# Initialize terraform (downloads the Google provider plugins)
terraform init

# Review the proposed changes
terraform plan

# Apply the changes (type 'yes' when prompted)
terraform apply
```
*Note: Creating a Kubernetes cluster usually takes about 10-15 minutes. Let it run.*

## Step 3: Create the Kubernetes Namespaces
Once the cluster is up, we need to create the logical boundaries for our "Test" and "Production" environments inside that single cluster. 

First, get your local `kubectl` command to point to the new cluster:
```bash
gcloud container clusters get-credentials crisis-monitor-cluster --region us-east1 --project paulgresham-com
```

Now, create the two namespaces:
```bash
kubectl create namespace crisis-test
kubectl create namespace crisis-prod
```

## Step 4: Extract the Service Account Key for GitHub
Now that the infrastructure exists, we need to give the key to our "Deployer" (GitHub Actions).

1. Generate the JSON key file for the service account Terraform just created:
```bash
gcloud iam service-accounts keys create ~/github-actions-key.json \
  --iam-account=github-actions-deployer@paulgresham-com.iam.gserviceaccount.com
```

2. Copy the contents of that key:
```bash
cat ~/github-actions-key.json
```
*(Copy the entire JSON output block).*

3. **Delete the file from your local machine** (security best practice—it should only live in GitHub now):
```bash
rm ~/github-actions-key.json
```

## Step 5: Configure GitHub Secrets
Go to your `crisis_monitor` repository on the GitHub website.

Navigate to **Settings > Secrets and variables > Actions**.

Add the following **Repository Secrets**:
*   `GCP_CREDENTIALS`: Paste the JSON block you copied in Step 4.
*   `GCP_PROJECT_ID`: `paulgresham-com`
*   `GKE_CLUSTER_NAME`: `crisis-monitor-cluster`
*   `GKE_ZONE`: `us-east1`

---
*You are now completely done with the cloud infrastructure setup! Your coding agent can take over from here and write the deployment pipelines.*
