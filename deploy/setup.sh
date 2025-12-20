#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (Latest LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Install PM2
sudo npm install -g pm2

# Setup Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

echo "Server setup complete. Please configure Nginx and deploy the app."
