output "Administrator_Password" {
  value = rsadecrypt(aws_instance.lan.password_data, file(var.private_key_path))
}
