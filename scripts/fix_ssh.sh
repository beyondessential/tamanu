#!/bin/bash
echo "Reinstate SSH Private key"
echo -e $SSH_PRIVATE_KEY >> /root/.ssh/id_rsa
chmod 600 /root/.ssh/id_rsa