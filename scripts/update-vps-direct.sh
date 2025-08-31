#!/usr/bin/expect -f

# VPS connection details
set VPS_HOST "173.249.24.112"
set VPS_USER "root"
set VPS_PASSWORD "Mainong5567"
set DEPLOY_PATH "/var/www/classora.in"

puts "🔄 Connecting to VPS and updating files..."

# Function to execute SSH command
proc ssh_exec {command} {
    global VPS_HOST VPS_USER VPS_PASSWORD
    spawn ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST $command
    expect {
        "password:" {
            send "$VPS_PASSWORD\r"
            expect eof
        }
        eof
    }
}

# Function to copy file via SCP
proc scp_file {local_file remote_path} {
    global VPS_HOST VPS_USER VPS_PASSWORD
    spawn scp -o StrictHostKeyChecking=no $local_file $VPS_USER@$VPS_HOST:$remote_path
    expect {
        "password:" {
            send "$VPS_PASSWORD\r"
            expect eof
        }
        eof
    }
}

puts "📁 Copying favicon files..."
scp_file "public/favicon-16x16.png" "$DEPLOY_PATH/current/public/"
scp_file "public/favicon-32x32.png" "$DEPLOY_PATH/current/public/"
scp_file "public/favicon-48x48.png" "$DEPLOY_PATH/current/public/"
scp_file "public/apple-touch-icon.png" "$DEPLOY_PATH/current/public/"
scp_file "public/android-chrome-192x192.png" "$DEPLOY_PATH/current/public/"
scp_file "public/android-chrome-512x512.png" "$DEPLOY_PATH/current/public/"

puts "⚙️ Copying configuration files..."
scp_file "app/layout.tsx" "$DEPLOY_PATH/current/app/"
scp_file "next.config.js" "$DEPLOY_PATH/current/"
scp_file "nginx/nginx.conf" "$DEPLOY_PATH/current/nginx/"

puts "🔨 Rebuilding application..."
ssh_exec "cd $DEPLOY_PATH/current && npm run build"

puts "🔄 Restarting services..."
ssh_exec "cd $DEPLOY_PATH/current && docker-compose down && docker-compose up -d"

puts "✅ VPS update completed!"
puts "🌐 Check the website at: https://classora.in"
