 # VPC Endpoint for SNS
resource "aws_vpc_endpoint" "sns" {
  vpc_id             = module.vpc.vpc_id
  service_name       = "com.amazonaws.${data.aws_region.current.name}.sns"
  vpc_endpoint_type  = "Interface"
  
  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.lambda_sg.id]

  private_dns_enabled = true

  tags = {
    Name = "SNS VPC Endpoint"
  }
}

# Update the security group to allow HTTPS traffic (needed for SNS)
resource "aws_security_group_rule" "sns_endpoint" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  security_group_id = aws_security_group.lambda_sg.id
  cidr_blocks       = [module.vpc.vpc_cidr_block]
}

variable "admin_email" {
  description = "Admin email address for restaurant notifications"
  type        = string
}

resource "aws_sns_topic" "restaurant_notifications" {
  name = "restaurant-creation-notifications"
}

resource "aws_sns_topic_policy" "restaurant_notifications" {
  arn = aws_sns_topic.restaurant_notifications.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_iam_role.labrole.arn
        }
        Action = [
          "SNS:Publish",
          "SNS:Subscribe"
        ]
        Resource = aws_sns_topic.restaurant_notifications.arn
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "admin_email" {
  topic_arn = aws_sns_topic.restaurant_notifications.arn
  protocol  = "email"
  endpoint  = var.admin_email
}