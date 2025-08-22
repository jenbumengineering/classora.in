#!/bin/bash

# Classora.in Mail Server Setup Script
# This script configures Webmin and Postfix for sending and receiving emails

set -e

echo "🚀 Starting Classora.in Mail Server Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
apt-get update && apt-get upgrade -y

# Install required packages
print_status "Installing required packages..."
apt-get install -y \
    openssl \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban \
    logwatch \
    mailutils \
    postfix \
    dovecot-core \
    dovecot-imapd \
    dovecot-pop3d \
    dovecot-lmtpd \
    dovecot-mysql \
    dovecot-sieve \
    dovecot-managesieved \
    spamassassin \
    clamav \
    clamav-daemon \
    amavisd-new \
    postgrey \
    opendkim \
    opendkim-tools

# Create vmail user and group
print_status "Creating vmail user and group..."
groupadd -g 5000 vmail
useradd -g vmail -u 5000 vmail -d /var/mail -m -s /sbin/nologin

# Create mail directories
print_status "Creating mail directories..."
mkdir -p /var/mail/classora.in/{noreply,support,admin,postmaster,abuse,webmaster,info}
chown -R vmail:vmail /var/mail
chmod -R 700 /var/mail

# Generate SSL certificates
print_status "Generating SSL certificates..."

# Create SSL directories
mkdir -p postfix/ssl dovecot/ssl

# Generate self-signed certificates for now (replace with Let's Encrypt later)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout postfix/ssl/smtpd.key \
    -out postfix/ssl/smtpd.crt \
    -subj "/C=US/ST=State/L=City/O=Classora/OU=IT/CN=mail.classora.in"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout dovecot/ssl/dovecot.key \
    -out dovecot/ssl/dovecot.crt \
    -subj "/C=US/ST=State/L=City/O=Classora/OU=IT/CN=mail.classora.in"

# Set proper permissions
chmod 600 postfix/ssl/* dovecot/ssl/*
chown -R root:root postfix/ssl dovecot/ssl

# Configure Postfix
print_status "Configuring Postfix..."

# Create Postfix hash files
postmap postfix/config/vmaps
postmap postfix/config/valias

# Set proper permissions
chown -R root:root postfix/config/
chmod 644 postfix/config/*

# Configure Dovecot
print_status "Configuring Dovecot..."

# Create Dovecot users file
cat > dovecot/config/users << EOF
noreply@classora.in:{SHA512-CRYPT}\$6\$rounds=5000\$salt\$hash:5000:5000::/var/mail/classora.in/noreply/::userdb_mail=maildir:/var/mail/classora.in/noreply/
support@classora.in:{SHA512-CRYPT}\$6\$rounds=5000\$salt\$hash:5000:5000::/var/mail/classora.in/support/::userdb_mail=maildir:/var/mail/classora.in/support/
admin@classora.in:{SHA512-CRYPT}\$6\$rounds=5000\$salt\$hash:5000:5000::/var/mail/classora.in/admin/::userdb_mail=maildir:/var/mail/classora.in/admin/
postmaster@classora.in:{SHA512-CRYPT}\$6\$rounds=5000\$salt\$hash:5000:5000::/var/mail/classora.in/postmaster/::userdb_mail=maildir:/var/mail/classora.in/postmaster/
abuse@classora.in:{SHA512-CRYPT}\$6\$rounds=5000\$salt\$hash:5000:5000::/var/mail/classora.in/abuse/::userdb_mail=maildir:/var/mail/classora.in/abuse/
webmaster@classora.in:{SHA512-CRYPT}\$6\$rounds=5000\$salt\$hash:5000:5000::/var/mail/classora.in/webmaster/::userdb_mail=maildir:/var/mail/classora.in/webmaster/
info@classora.in:{SHA512-CRYPT}\$6\$rounds=5000\$salt\$hash:5000:5000::/var/mail/classora.in/info/::userdb_mail=maildir:/var/mail/classora.in/info/
EOF

# Set proper permissions
chown root:root dovecot/config/users
chmod 600 dovecot/config/users

# Configure firewall
print_status "Configuring firewall..."
ufw allow 25/tcp   # SMTP
ufw allow 587/tcp  # SMTP Submission
ufw allow 465/tcp  # SMTPS
ufw allow 110/tcp  # POP3
ufw allow 143/tcp  # IMAP
ufw allow 993/tcp  # IMAPS
ufw allow 995/tcp  # POP3S
ufw allow 10000/tcp # Webmin

# Configure fail2ban
print_status "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[postfix]
enabled = true
port = smtp,465,submission
filter = postfix
logpath = /var/log/mail.log
maxretry = 3

[dovecot]
enabled = true
port = pop3,pop3s,imap,imaps
filter = dovecot
logpath = /var/log/mail.log
maxretry = 3

[webmin-auth]
enabled = true
port = 10000
filter = webmin-auth
logpath = /var/log/auth.log
maxretry = 3
EOF

# Restart services
print_status "Restarting services..."
systemctl restart postfix
systemctl restart dovecot
systemctl restart fail2ban
systemctl enable postfix
systemctl enable dovecot
systemctl enable fail2ban

# Test configuration
print_status "Testing mail server configuration..."

# Test Postfix configuration
if postfix check; then
    print_success "Postfix configuration is valid"
else
    print_error "Postfix configuration has errors"
    exit 1
fi

# Test Dovecot configuration
if doveconf -n; then
    print_success "Dovecot configuration is valid"
else
    print_error "Dovecot configuration has errors"
    exit 1
fi

# Create DNS records template
print_status "Creating DNS records template..."
cat > dns-records.txt << EOF
# DNS Records for Classora.in Mail Server
# Add these records to your DNS provider

# A Records
mail.classora.in.    A    YOUR_SERVER_IP

# MX Records
classora.in.         MX    10 mail.classora.in.

# SPF Record
classora.in.         TXT   "v=spf1 mx a ip4:YOUR_SERVER_IP ~all"

# DKIM Record (will be generated after setup)
# mail._domainkey.classora.in. TXT "v=DKIM1; k=rsa; p=YOUR_DKIM_PUBLIC_KEY"

# DMARC Record
_dmarc.classora.in.  TXT   "v=DMARC1; p=quarantine; rua=mailto:dmarc@classora.in; ruf=mailto:dmarc@classora.in; sp=quarantine; adkim=r; aspf=r;"

# PTR Record (Reverse DNS)
# Contact your hosting provider to set up reverse DNS for YOUR_SERVER_IP to mail.classora.in
EOF

# Create email configuration update script
print_status "Creating email configuration update script..."
cat > update-email-config.js << EOF
// Update email configuration for Classora.in
const emailConfig = {
  host: 'mail.classora.in',
  port: 587,
  secure: false,
  auth: {
    user: 'noreply@classora.in',
    pass: 'YOUR_EMAIL_PASSWORD'
  },
  tls: {
    rejectUnauthorized: false
  }
};

// Update lib/email.ts with this configuration
console.log('Update lib/email.ts with the following configuration:');
console.log(JSON.stringify(emailConfig, null, 2));
EOF

# Create Webmin setup instructions
print_status "Creating Webmin setup instructions..."
cat > webmin-setup.md << EOF
# Webmin Setup Instructions

## Access Webmin
1. Open your browser and go to: https://YOUR_SERVER_IP:10000
2. Login with:
   - Username: root
   - Password: admin_password_change_this

## Configure Mail Server in Webmin
1. Go to "Servers" → "Postfix Mail Server"
2. Click "Edit Config Files"
3. Update the following files:
   - main.cf: Use the configuration in postfix/config/main.cf
   - master.cf: Use the configuration in postfix/config/master.cf

4. Go to "Servers" → "Dovecot IMAP/POP3 Server"
5. Click "Edit Config Files"
6. Update dovecot.conf with the configuration in dovecot/config/dovecot.conf

## Create Email Accounts
1. Go to "Servers" → "Postfix Mail Server"
2. Click "Virtual Domains"
3. Add domain: classora.in
4. Click "Virtual Mailboxes"
5. Add the following accounts:
   - noreply@classora.in
   - support@classora.in
   - admin@classora.in
   - postmaster@classora.in
   - abuse@classora.in
   - webmaster@classora.in
   - info@classora.in

## SSL Certificate Setup
1. Go to "Webmin" → "Webmin Configuration" → "SSL Encryption"
2. Upload your SSL certificates or use Let's Encrypt
3. Update certificate paths in Postfix and Dovecot configurations

## Security Settings
1. Go to "Webmin" → "Webmin Configuration" → "IP Access Control"
2. Restrict access to your IP addresses
3. Enable two-factor authentication
4. Change default passwords

## Monitoring
1. Go to "System" → "System Logs"
2. Monitor mail.log for any issues
3. Set up log rotation
4. Configure email alerts for system issues
EOF

print_success "Mail server setup completed!"
print_status "Next steps:"
echo "1. Update DNS records (see dns-records.txt)"
echo "2. Access Webmin at https://YOUR_SERVER_IP:10000"
echo "3. Follow the setup instructions in webmin-setup.md"
echo "4. Update email configuration in lib/email.ts"
echo "5. Test email functionality"

print_warning "Remember to:"
echo "- Change default passwords"
echo "- Set up proper SSL certificates"
echo "- Configure backup procedures"
echo "- Monitor system logs"
echo "- Set up DKIM and DMARC records"

print_success "Setup script completed successfully!"
