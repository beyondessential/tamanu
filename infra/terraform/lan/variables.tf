variable "key_name" {}
variable "public_ip" {}
variable "private_key_path" {
  default = "private_key.pem"
}
variable "ssh_authorized_keys" {
  default = ""
}
