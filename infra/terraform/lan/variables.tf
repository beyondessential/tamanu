variable "region" {
  default = "ap-southeast-2"
}
variable "instance_name" {}
variable "instance_type" {
  default = "t2.micro"
}
variable "ami_name" {
  default = "Windows_Server-2022-English-Full-Base-2021.09.15"
}
variable "ami_owner" {
  default = "801119661308"
}
variable "vpc_id" {
  default = "vpc-4cb80b28" # meditrak-vpc
}
variable "subnet_name" {
  default = "meditrak-subnet-1"
}
variable "security_group_name" {
  default = "tamanu-lan-server-staging"
}
variable "key_name" {
  default = "tamanu-lan-server"
}
variable "private_key_path" {
  default = "private_key.pem"
}
variable "ssh_authorized_keys" {
  default = ""
}
