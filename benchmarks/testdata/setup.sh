#!/bin/bash
# Sample shell script for testing

export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export STRIPE_KEY="sk_live_51HdY8eZvKYlo2Cw3jHGmXj"
export DATABASE_URL="postgresql://admin:password123@localhost:5432/mydb"

echo "Setting up application..."

# Database connection
DB_HOST="localhost"
DB_USER="admin"
DB_PASS="secretpassword123"

echo "Connecting to database at $DB_HOST..."

# API configuration
API_KEY="AKIAIOSFODNN7EXAMPLE"
API_SECRET="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

echo "API Key: ${API_KEY:0:8}..."

# Deploy command
aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY

echo "Setup complete!"
