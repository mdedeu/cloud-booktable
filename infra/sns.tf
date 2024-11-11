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