# Terraform Configuration for Crisis Monitor GKE Environments
# Target Project: paulgresham-com

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = "paulgresham-com"
  region  = "us-east1" # Change if you prefer another region
}

# -----------------------------------------------------------------------------
# 1. Enable Required APIs
# -----------------------------------------------------------------------------
resource "google_project_service" "compute" {
  service = "compute.googleapis.com"
  disable_dependent_services = true
}

resource "google_project_service" "container" {
  service = "container.googleapis.com"
  disable_dependent_services = true
}

# -----------------------------------------------------------------------------
# 2. GKE Autopilot Cluster
# Using a single Autopilot cluster to save costs, separated by Namespaces
# -----------------------------------------------------------------------------
resource "google_container_cluster" "primary" {
  name     = "crisis-monitor-cluster"
  location = "us-east1"
  
  # Enable Autopilot (Google manages nodes, pay per pod)
  enable_autopilot = true

  depends_on = [
    google_project_service.compute,
    google_project_service.container
  ]
}

# -----------------------------------------------------------------------------
# 3. Dedicated Service Account for GitHub Actions
# -----------------------------------------------------------------------------
resource "google_service_account" "github_actions" {
  account_id   = "github-actions-deployer"
  display_name = "GitHub Actions CI/CD Deployer"
}

# Grant the Service Account permissions to deploy to GKE
resource "google_project_iam_member" "gke_developer" {
  project = "paulgresham-com"
  role    = "roles/container.developer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# (Optional but recommended) Grant permission to view cluster info
resource "google_project_iam_member" "gke_viewer" {
  project = "paulgresham-com"
  role    = "roles/container.clusterViewer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

# -----------------------------------------------------------------------------
# Outputs (Useful for setting up GitHub Secrets)
# -----------------------------------------------------------------------------
output "gke_cluster_name" {
  value = google_container_cluster.primary.name
}

output "gke_cluster_location" {
  value = google_container_cluster.primary.location
}

output "github_service_account_email" {
  value = google_service_account.github_actions.email
}
