locals {
  bucket_name = "frontend-cloudbooktable-${random_id.bucket_suffix.hex}"
}