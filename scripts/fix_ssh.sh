#!/bin/bash
echo "Reinstate SSH Private key"
echo -e $PRIVATE_SSH_KEY >> /root/.ssh/id_rsa
chmod 600 /root/.ssh/id_rsa