data "http" "cloudflare_ipv4" {
  url = "https://www.cloudflare.com/ips-v4"
}

locals {
  cloudflare_cidrs = compact(split("\n", trimspace(data.http.cloudflare_ipv4.response_body)))
}

resource "aws_ec2_managed_prefix_list" "cloudflare" {
  name           = "tf-cloudflare-ipv4"
  address_family = "IPv4"
  max_entries    = 30

  dynamic "entry" {
    for_each = toset(local.cloudflare_cidrs)
    content {
      cidr        = entry.value
      description = "Cloudflare"
    }
  }
}

resource "aws_security_group" "app" {
  name        = "tf-mini-app-sg"
  description = "App server: HTTPS from Cloudflare only"
  vpc_id      = aws_vpc.main.id
  tags        = { Name = "tf-mini-app-sg" }
}

resource "aws_vpc_security_group_ingress_rule" "https_cloudflare" {
  security_group_id = aws_security_group.app.id
  prefix_list_id    = aws_ec2_managed_prefix_list.cloudflare.id
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
  description       = "HTTPS from Cloudflare"
}

resource "aws_vpc_security_group_egress_rule" "all_out" {
  security_group_id = aws_security_group.app.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
  description       = "Allow all outbound"
}
