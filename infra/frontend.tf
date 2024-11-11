#############################
# S3 Bucket
#############################
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "frontend_bucket" {
  bucket = local.bucket_name

  tags = {
    Name        = "Frontend Bucket"
    Environment = "Dev"
  }
}

resource "aws_s3_bucket_website_configuration" "frontend_bucket" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend_bucket_public_access" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend_bucket_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
      },
    ]
  })
  depends_on = [aws_s3_bucket_public_access_block.frontend_bucket_public_access]
}


resource "null_resource" "frontend_deployment" {
  triggers = {
    api_gateway_url = aws_api_gateway_deployment.my_api_deployment.invoke_url
    file_hash       = data.archive_file.frontend.output_base64sha256
    user_pool_id    = module.cognito.user_pool_id,
    client_id = module.cognito.client_id
    build_number    = timestamp() 
  }

  provisioner "local-exec" {
    command = <<EOT
      cd ${path.module}/../frontend
      echo "NEXT_PUBLIC_BACKEND_URL=${aws_api_gateway_deployment.my_api_deployment.invoke_url}" > .env
      echo "NEXT_PUBLIC_AWS_REGION=us-east-1" >> .env
      echo "NEXT_PUBLIC_COGNITO_USER_POOL_ID=${module.cognito.user_pool_id}" >> .env
      echo "NEXT_PUBLIC_COGNITO_CLIENT_ID=${module.cognito.client_id}" >> .env
      rm -rf out/
      npm run build
      aws s3 rm s3://${aws_s3_bucket.frontend_bucket.id} --recursive
      aws s3 sync out s3://${aws_s3_bucket.frontend_bucket.id}
    EOT
  }

  depends_on = [
    aws_api_gateway_deployment.my_api_deployment,
    aws_s3_bucket.frontend_bucket,
    aws_s3_bucket_policy.frontend_bucket_policy,
    module.cognito
  ]
}
