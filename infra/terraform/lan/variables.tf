variable "region" {
  default = "ap-southeast-2"
}
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
  default = "vpc-03938bc0217ce4d3b" # tamanu-vpc
}
variable "subnet_name" {
  default = "tamanu-dev-subnet"
}
variable "security_group_name" {
  default = "Tamanu Cloud Server - Demo"
}
variable "key_name" {}
variable "public_ip" {}
variable "private_key_path" {
  default = "private_key.pem"
}
variable "ssh_authorized_keys" {
  default = ""
}
