data "aws_caller_identity" "current" {}

locals {
  account_id    = data.aws_caller_identity.current.account_id
  backup_bucket = "mini-deployment-backup-yogarp"
}

data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2" {
  name               = "tf-mini-ec2-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

# SSM: akses Session Manager dan Run Command (dipakai CD)
resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy_document" "ec2_app" {
  # Pull image dari ECR
  statement {
    sid       = "EcrToken"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }
  statement {
    sid = "EcrPull"
    actions = [
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchCheckLayerAvailability",
    ]
    resources = ["arn:aws:ecr:${var.region}:${local.account_id}:repository/min-dep/*"]
  }

  # Baca secret/konfigurasi dari SSM Parameter Store
  statement {
    sid       = "ReadParams"
    actions   = ["ssm:GetParameter", "ssm:GetParametersByPath"]
    resources = ["arn:aws:ssm:${var.region}:${local.account_id}:parameter/mini/prod/*"]
  }

  # Backup database ke S3
  statement {
    sid       = "BackupList"
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::${local.backup_bucket}"]
  }
  statement {
    sid       = "BackupWrite"
    actions   = ["s3:PutObject"]
    resources = ["arn:aws:s3:::${local.backup_bucket}/*"]
  }

  statement {
    sid       = "BackupRead"
    actions   = ["s3:GetObject"]
    resources = ["arn:aws:s3:::${local.backup_bucket}/*"]
  }
}

resource "aws_iam_role_policy" "ec2_app" {
  name   = "app-access"
  role   = aws_iam_role.ec2.id
  policy = data.aws_iam_policy_document.ec2_app.json
}

resource "aws_iam_instance_profile" "ec2" {
  name = "tf-mini-ec2-profile"
  role = aws_iam_role.ec2.name
}
