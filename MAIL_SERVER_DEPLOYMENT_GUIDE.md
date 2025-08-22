# Classora.in Mail Server Deployment Guide

This guide will help you set up a complete mail server solution using Webmin, Postfix, and Dovecot for the Classora.in domain.

## 🚀 Quick Start

### 1. Prerequisites
- Ubuntu 20.04+ or Debian 11+ server
- Root access to the server
- Domain name (classora.in) with DNS access
- Static IP address

### 2. Initial Setup

```bash
# Clone or download the project files
cd /path/to/classora.in

# Make the setup script executable
chmod +x setup-mail-server.sh

# Run the setup script as root
sudo ./setup-mail-server.sh
```

### 3. Docker Deployment

```bash
# Start the mail server services
docker-compose up -d webmin postfix dovecot

# Check service status
docker-compose ps

# View logs
docker-compose logs postfix
docker-compose logs dovecot
docker-compose logs webmin
```

## 📧 Mail Server Configuration

### Postfix Configuration

The main Postfix configuration is in `postfix/config/main.cf`:

- **Hostname**: mail.classora.in
- **Domain**: classora.in
- **Virtual Mailboxes**: Configured for multiple email accounts
- **TLS/SSL**: Enabled for secure communication
- **Spam Protection**: Basic filtering enabled

### Dovecot Configuration

The Dovecot configuration is in `dovecot/config/dovecot.conf`:

- **Protocols**: IMAP, POP3, LMTP
- **Authentication**: SASL with virtual users
- **Mail Storage**: Maildir format
- **SSL/TLS**: Required for all connections

### Email Accounts

The following email accounts are configured:

- `noreply@classora.in` - System notifications
- `support@classora.in` - Customer support
- `admin@classora.in` - Administrative tasks
- `postmaster@classora.in` - Mail server administration
- `abuse@classora.in` - Abuse reports
- `webmaster@classora.in` - Website administration
- `info@classora.in` - General information

## 🌐 DNS Configuration

Add the following DNS records to your domain provider:

### A Records
```
mail.classora.in.    A    YOUR_SERVER_IP
```

### MX Records
```
classora.in.         MX    10 mail.classora.in.
```

### SPF Record
```
classora.in.         TXT   "v=spf1 mx a ip4:YOUR_SERVER_IP ~all"
```

### DMARC Record
```
_dmarc.classora.in.  TXT   "v=DMARC1; p=quarantine; rua=mailto:dmarc@classora.in; ruf=mailto:dmarc@classora.in; sp=quarantine; adkim=r; aspf=r;"
```

### PTR Record (Reverse DNS)
Contact your hosting provider to set up reverse DNS for your server IP to point to `mail.classora.in`.

## 🔐 SSL Certificate Setup

### Option 1: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificates
sudo certbot certonly --standalone -d mail.classora.in

# Copy certificates to Postfix and Dovecot
sudo cp /etc/letsencrypt/live/mail.classora.in/fullchain.pem postfix/ssl/smtpd.crt
sudo cp /etc/letsencrypt/live/mail.classora.in/privkey.pem postfix/ssl/smtpd.key
sudo cp /etc/letsencrypt/live/mail.classora.in/fullchain.pem dovecot/ssl/dovecot.crt
sudo cp /etc/letsencrypt/live/mail.classora.in/privkey.pem dovecot/ssl/dovecot.key

# Set proper permissions
sudo chmod 600 postfix/ssl/* dovecot/ssl/*
sudo chown root:root postfix/ssl/* dovecot/ssl/*

# Restart services
sudo systemctl restart postfix dovecot
```

### Option 2: Self-Signed Certificates

The setup script generates self-signed certificates. For production, replace with proper certificates.

## 🛠️ Webmin Configuration

### Access Webmin
1. Open browser: `https://YOUR_SERVER_IP:10000`
2. Login with root credentials
3. Accept SSL certificate warning

### Configure Mail Server
1. Go to **Servers** → **Postfix Mail Server**
2. Click **Edit Config Files**
3. Update configuration files with the provided templates
4. Go to **Servers** → **Dovecot IMAP/POP3 Server**
5. Update Dovecot configuration

### Create Email Accounts
1. Go to **Servers** → **Postfix Mail Server**
2. Click **Virtual Domains**
3. Add domain: `classora.in`
4. Click **Virtual Mailboxes**
5. Add all required email accounts

### Security Settings
1. Go to **Webmin** → **Webmin Configuration** → **IP Access Control**
2. Restrict access to your IP addresses
3. Enable two-factor authentication
4. Change default passwords

## 📱 Email Client Configuration

### SMTP Settings (Outgoing)
- **Server**: mail.classora.in
- **Port**: 587 (STARTTLS) or 465 (SSL)
- **Security**: STARTTLS or SSL
- **Authentication**: Required
- **Username**: your-email@classora.in
- **Password**: your-email-password

### IMAP Settings (Incoming)
- **Server**: mail.classora.in
- **Port**: 143 (STARTTLS) or 993 (SSL)
- **Security**: STARTTLS or SSL
- **Authentication**: Required
- **Username**: your-email@classora.in
- **Password**: your-email-password

### POP3 Settings (Alternative)
- **Server**: mail.classora.in
- **Port**: 110 (STARTTLS) or 995 (SSL)
- **Security**: STARTTLS or SSL
- **Authentication**: Required
- **Username**: your-email@classora.in
- **Password**: your-email-password

## 🔒 Security Hardening

### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 25/tcp   # SMTP
sudo ufw allow 587/tcp  # SMTP Submission
sudo ufw allow 465/tcp  # SMTPS
sudo ufw allow 110/tcp  # POP3
sudo ufw allow 143/tcp  # IMAP
sudo ufw allow 993/tcp  # IMAPS
sudo ufw allow 995/tcp  # POP3S
sudo ufw allow 10000/tcp # Webmin

# Enable firewall
sudo ufw enable
```

### Fail2ban Configuration
The setup script configures Fail2ban for:
- Postfix (SMTP attacks)
- Dovecot (IMAP/POP3 attacks)
- Webmin (authentication attacks)

### Spam Protection
- **SpamAssassin**: Basic spam filtering
- **Postgrey**: Greylisting for spam prevention
- **OpenDKIM**: Email authentication
- **ClamAV**: Virus scanning

## 📊 Monitoring and Maintenance

### Log Monitoring
```bash
# Monitor mail logs
sudo tail -f /var/log/mail.log

# Monitor Postfix logs
sudo tail -f /var/log/postfix.log

# Monitor Dovecot logs
sudo tail -f /var/log/dovecot.log
```

### Backup Procedures
```bash
# Backup mail data
sudo tar -czf mail-backup-$(date +%Y%m%d).tar.gz /var/mail

# Backup configuration
sudo tar -czf config-backup-$(date +%Y%m%d).tar.gz postfix/config dovecot/config

# Backup SSL certificates
sudo tar -czf ssl-backup-$(date +%Y%m%d).tar.gz postfix/ssl dovecot/ssl
```

### Performance Tuning
- Monitor disk space usage
- Set up log rotation
- Configure mail quotas
- Monitor system resources

## 🧪 Testing

### Test Email Sending
```bash
# Test SMTP connection
telnet mail.classora.in 587

# Test with authentication
openssl s_client -connect mail.classora.in:587 -starttls smtp
```

### Test Email Receiving
```bash
# Test IMAP connection
telnet mail.classora.in 143

# Test with SSL
openssl s_client -connect mail.classora.in:993
```

### Test from Application
```bash
# Test email sending from the application
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","message":"Test email"}'
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Email Not Sending
- Check Postfix service status: `sudo systemctl status postfix`
- Check mail logs: `sudo tail -f /var/log/mail.log`
- Verify DNS records
- Check firewall settings

#### 2. Email Not Receiving
- Check Dovecot service status: `sudo systemctl status dovecot`
- Verify MX records
- Check mail directory permissions
- Verify virtual mailbox configuration

#### 3. SSL Certificate Issues
- Check certificate validity: `openssl x509 -in postfix/ssl/smtpd.crt -text -noout`
- Verify certificate paths in configuration
- Check certificate permissions

#### 4. Authentication Issues
- Verify user credentials in Dovecot
- Check SASL configuration
- Verify virtual user setup

### Useful Commands
```bash
# Check Postfix configuration
sudo postfix check

# Check Dovecot configuration
sudo doveconf -n

# Test mail delivery
sudo postmap -q user@classora.in hash:/etc/postfix/vmaps

# Check mail queue
sudo mailq

# Flush mail queue
sudo postqueue -f

# Check service status
sudo systemctl status postfix dovecot webmin
```

## 📞 Support

For issues related to:
- **Mail Server Configuration**: Check logs and configuration files
- **DNS Issues**: Contact your domain provider
- **SSL Certificates**: Verify certificate generation and installation
- **Application Integration**: Check email configuration in `lib/email.ts`

## 🔄 Updates and Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Check logs for errors
2. **Monthly**: Update system packages
3. **Quarterly**: Renew SSL certificates
4. **Annually**: Review security settings

### Update Procedures
```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade

# Update Docker containers
docker-compose pull
docker-compose up -d

# Update SSL certificates
sudo certbot renew
```

This guide provides a complete setup for a production-ready mail server. Follow each section carefully and test thoroughly before going live.
