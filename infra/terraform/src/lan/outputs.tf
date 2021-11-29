data "aws_secretsmanager_secret_version" "ec2_key_pair" {
  secret_id = "ec2/key-pairs/${var.key_name}"
}
output "Administrator_Password" {
  value = nonsensitive(rsadecrypt(aws_instance.lan.password_data, data.aws_secretsmanager_secret_version.ec2_key_pair.secret_string))
}
