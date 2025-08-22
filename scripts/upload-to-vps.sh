#!/bin/bash

# Upload and Setup Script for Classora.in VPS
# This script uploads the project to the VPS and sets up the initial deployment

set -e

# VPS Configuration
VPS_HOST="173.249.24.112"
VPS_USER="root"
VPS_PASSWORD="Mainong5567"
PROJECT_NAME="classora.in"
DEPLOY_PATH="/var/www/classora.in"

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

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v ssh &> /dev/null; then
        print_error "SSH is not installed"
        exit 1
    fi
    
    if ! command -v scp &> /dev/null; then
        print_error "SCP is not installed"
        exit 1
    fi
    
    if ! command -v tar &> /dev/null; then
        print_error "tar is not installed"
        exit 1
    fi
    
    print_success "All requirements are met"
}

# Test SSH connection
test_connection() {
    print_status "Testing SSH connection to VPS..."
    
    if sshpass -p "$VPS_PASSWORD" ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "echo 'SSH connection successful'"; then
        print_success "SSH connection established"
    else
        print_error "Failed to connect to VPS"
        exit 1
    fi
}

# Create deployment package
create_package() {
    print_status "Creating deployment package..."
    
    # Remove existing package
    rm -f deployment.tar.gz
    
    # Create package excluding unnecessary files
    tar -czf deployment.tar.gz \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='*.log' \
        --exclude='.env*' \
        --exclude='deployment.tar.gz' \
        --exclude='.DS_Store' \
        --exclude='*.tmp' \
        .
    
    print_success "Deployment package created: deployment.tar.gz"
}

# Upload to VPS
upload_to_vps() {
    print_status "Uploading project to VPS..."
    
    # Create deployment directory on VPS
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "mkdir -p $DEPLOY_PATH"
    
    # Upload deployment package
    if sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no deployment.tar.gz "$VPS_USER@$VPS_HOST:$DEPLOY_PATH/"; then
        print_success "Project uploaded to VPS"
    else
        print_error "Failed to upload project to VPS"
        exit 1
    fi
}

# Setup VPS
setup_vps() {
    print_status "Setting up VPS..."
    
    # Run VPS setup script
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "bash -s" < scripts/setup-vps.sh
    
    print_success "VPS setup completed"
}

# Extract and deploy
deploy_project() {
    print_status "Deploying project on VPS..."
    
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'EOF'
        cd /var/www/classora.in
        
        # Extract deployment package
        tar -xzf deployment.tar.gz
        rm deployment.tar.gz
        
        # Create initial deployment directory
        DEPLOY_DIR="deployment-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$DEPLOY_DIR"
        
        # Move extracted files to deployment directory
        mv * "$DEPLOY_DIR/" 2>/dev/null || true
        
        # Create current symlink
        ln -sf "$DEPLOY_DIR" current
        
        # Set proper permissions
        chown -R www-data:www-data "$DEPLOY_DIR"
        chmod -R 755 "$DEPLOY_DIR"
        
        # Install dependencies
        cd "$DEPLOY_DIR"
        npm ci --only=production
        
        # Generate Prisma client
        npx prisma generate
        
        # Create environment file from template
        if [ -f ".env.template" ]; then
            cp .env.template .env
            chmod 600 .env
        fi
        
        # Build the application
        npm run build
        
        echo "Project deployed successfully!"
EOF
    
    print_success "Project deployed on VPS"
}

# Start services
start_services() {
    print_status "Starting services..."
    
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" << 'EOF'
        cd /var/www/classora.in/current
        
        # Start Docker services
        docker-compose up -d
        
        # Wait for services to start
        sleep 10
        
        # Check service status
        docker-compose ps
        
        echo "Services started successfully!"
EOF
    
    print_success "Services started"
}

# Test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Wait for services to be ready
    sleep 30
    
    # Test HTTP response
    if curl -f -s "http://$VPS_HOST" > /dev/null; then
        print_success "HTTP test passed"
    else
        print_warning "HTTP test failed (this might be expected if SSL is required)"
    fi
    
    # Test health endpoint
    if curl -f -s "http://$VPS_HOST/health" > /dev/null; then
        print_success "Health check passed"
    else
        print_warning "Health check failed"
    fi
}

# Cleanup
cleanup() {
    print_status "Cleaning up..."
    
    # Remove local deployment package
    rm -f deployment.tar.gz
    
    print_success "Cleanup completed"
}

# Main execution
main() {
    echo "🚀 Starting Classora.in VPS deployment..."
    
    check_requirements
    test_connection
    create_package
    upload_to_vps
    setup_vps
    deploy_project
    start_services
    test_deployment
    cleanup
    
    print_success "VPS deployment completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "1. Configure GitHub secrets for CI/CD:"
    echo "   - VPS_PASSWORD: $VPS_PASSWORD"
    echo "   - DATABASE_URL: mysql://classora_user:classora_password_change_this@mysql:3306/classora_db"
    echo "   - NEXTAUTH_SECRET: (generate a secure secret)"
    echo "   - NEXTAUTH_URL: https://classora.in"
    echo "   - EMAIL_PASSWORD: (your email password)"
    echo ""
    echo "2. Update environment variables on VPS:"
    echo "   - Edit /var/www/classora.in/current/.env"
    echo "   - Set proper database and email credentials"
    echo ""
    echo "3. Access your application:"
    echo "   - Website: https://classora.in"
    echo "   - Webmin: https://$VPS_HOST:10000"
    echo ""
    echo "4. Push to GitHub main/master branch to trigger CI/CD"
    echo ""
    print_warning "Security reminders:"
    echo "- Change default passwords"
    echo "- Set up proper SSL certificates"
    echo "- Configure backup procedures"
    echo "- Monitor system logs"
}

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    print_error "sshpass is not installed. Please install it first:"
    echo "  Ubuntu/Debian: sudo apt-get install sshpass"
    echo "  macOS: brew install hudochenkov/sshpass/sshpass"
    echo "  CentOS/RHEL: sudo yum install sshpass"
    exit 1
fi

# Run main function
main "$@"
