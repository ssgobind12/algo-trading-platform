# Deployment Guide

This project is configured to be deployed on an Ubuntu VPS or Windows Server using Docker Compose. It serves via Nginx on port 80. (SSL termination is to be handled via Certbot).

## Requirements
- Docker & Docker Compose
- Domain name `ssgobind.space` pointing to your server's IP (A Record).
- Subdomains `api.ssgobind.space` and `admin.ssgobind.space` pointing to your server's IP.

## Ubuntu VPS Deployment
1. Clone the repository on your server.
2. Copy `.env.example` to `.env` and fill in your secrets:
   ```bash
   cp .env.example .env
   nano .env
   ```
3. Run docker-compose:
   ```bash
   docker-compose up -d --build
   ```
4. Secure with Let's Encrypt (Certbot):
   ```bash
   sudo apt install certbot python3-certbot-nginx
   # Note: you may need to map certbot to the nginx container or install nginx directly on the host for SSL.
   ```

## Windows Deployment
1. Install Docker Desktop.
2. Open PowerShell in the project directory.
3. Rename `.env.example` to `.env` and update it.
4. Run:
   ```powershell
   docker-compose up -d --build
   ```
