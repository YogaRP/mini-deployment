output "vpc_id" { value = aws_vpc.main.id }
output "public_subnet_ids" { value = aws_subnet.public[*].id }
output "app_sg_id" { value = aws_security_group.app.id }
output "ec2_instance_profile" { value = aws_iam_instance_profile.ec2.name }
output "instance_id" { value = aws_instance.app.id }
output "public_ip" { value = aws_instance.app.public_ip }
