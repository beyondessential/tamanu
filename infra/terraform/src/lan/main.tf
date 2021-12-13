provider "aws" {
  region = var.region
}

data "aws_vpc" "tamanu" {
  id = var.vpc_id
}

data "aws_ami" "windows_server" {
  most_recent = true
  filter {
    name   = "name"
    values = [var.ami_name]
  }
  owners = [var.ami_owner]
}

data "aws_subnet" "default" {
  filter {
    name   = "tag:Name"
    values = [var.subnet_name]
  }
}

data "aws_security_group" "default" {
  vpc_id = data.aws_vpc.tamanu.id
  name   = var.security_group_name
}

data "template_file" "userdata" {
  template = file("${path.module}/userdata.tpl")
  vars = {
    authorized_keys = var.ssh_authorized_keys
  }
}

resource "aws_instance" "lan" {
  ami           = data.aws_ami.windows_server.id
  instance_type = var.instance_type
  key_name      = var.key_name
  subnet_id     = data.aws_subnet.default.id

  iam_instance_profile = "Tamanu-Instance-Role"

  vpc_security_group_ids = [data.aws_security_group.default.id]

  tags = {
    Name = var.instance_name
  }

  user_data         = data.template_file.userdata.rendered
  get_password_data = true
}

resource "aws_eip" "lan" {
  instance = aws_instance.lan.id
  vpc      = true
}
