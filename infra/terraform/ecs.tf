locals {
  socket_image = var.container_image != "" ? var.container_image : "${aws_ecr_repository.socket.repository_url}:latest"
}

resource "aws_cloudwatch_log_group" "socket" {
  name              = "/ecs/${local.name_prefix}-socket"
  retention_in_days = 30
}

resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-cluster"
}

data "aws_iam_policy_document" "ecs_task_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "ecs_task_execution" {
  name               = "${local.name_prefix}-ecs-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_assume_role.json
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_lb" "socket" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  idle_timeout       = 3600
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "socket" {
  name        = "${local.name_prefix}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id

  health_check {
    path                = "/socket.io/"
    matcher             = "200-499"
    healthy_threshold   = 2
    unhealthy_threshold = 4
    timeout             = 5
    interval            = 30
  }
}

resource "aws_lb_listener" "socket_http" {
  load_balancer_arn = aws_lb.socket.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.socket.arn
  }
}

resource "aws_ecs_task_definition" "socket" {
  family                   = "${local.name_prefix}-socket"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([
    {
      name      = "socket"
      image     = local.socket_image
      essential = true
      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name  = "PORT"
          value = tostring(var.container_port)
        },
        {
          name  = "CORS_ORIGIN"
          value = var.socket_allowed_origin
        },
        {
          name  = "BOARD_STORAGE_DIR"
          value = var.board_storage_dir
        },
        {
          name  = "REDIS_URL"
          value = "rediss://${aws_elasticache_replication_group.redis.configuration_endpoint_address}:6379"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.socket.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "socket"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "socket" {
  name            = "${local.name_prefix}-socket"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.socket.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 30

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_service.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.socket.arn
    container_name   = "socket"
    container_port   = var.container_port
  }

  depends_on = [aws_lb_listener.socket_http]
}

resource "aws_appautoscaling_target" "socket" {
  max_capacity       = 20
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.socket.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "socket_cpu" {
  name               = "${local.name_prefix}-socket-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.socket.resource_id
  scalable_dimension = aws_appautoscaling_target.socket.scalable_dimension
  service_namespace  = aws_appautoscaling_target.socket.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 55
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    scale_in_cooldown  = 60
    scale_out_cooldown = 30
  }
}
