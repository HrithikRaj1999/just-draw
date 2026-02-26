resource "aws_ecr_repository" "socket" {
  name                 = "${local.name_prefix}-socket"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}
