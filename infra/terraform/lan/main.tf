terraform {
  backend "s3" {
    bucket         = "tamanu-terraform"
    key            = "state/lan"
    region         = "ap-southeast-2"
    dynamodb_table = "tamanu-terraform"
  }
}

provider "aws" {
  region = "ap-southeast-2"
}

data "aws_vpc" "tamanu" {
  id = "vpc-03938bc0217ce4d3b" # tamanu-vpc
}

data "aws_ami" "windows_server" {
  most_recent = true
  filter {
    name   = "name"
    values = ["Windows_Server-2022-English-Full-Base-2021.09.15"]
  }
  owners = ["801119661308"]
}

data "aws_subnet" "default" {
  filter {
    name   = "tag:Name"
    values = ["tamanu-dev-subnet"]
  }
}

data "aws_security_group" "default" {
  vpc_id = data.aws_vpc.tamanu.id
  name   = "Tamanu Cloud Server - Demo"
}

data "template_file" "userdata" {
  template = "${file("${path.module}/userdata.tpl")}"
  vars = {
    authorized_keys = var.ssh_authorized_keys
  }
}

resource "aws_instance" "lan" {
  ami           = data.aws_ami.windows_server.id
  instance_type = "t2.micro"
  key_name = var.key_name
  subnet_id = data.aws_subnet.default.id

  vpc_security_group_ids = [data.aws_security_group.default.id]

  tags = {
    Name = terraform.workspace
  }

  user_data = data.template_file.userdata.rendered
  get_password_data = true
}

data "aws_eip" "public_ip" {
  public_ip = var.public_ip
}

resource "aws_eip_association" "public_ip" {
  instance_id = aws_instance.lan.id
  allocation_id = data.aws_eip.public_ip.id
}

