# Learning App - Quick Start Guide

Get your Learning App running on AWS in under 30 minutes!

## ⚡ Prerequisites (5 minutes)

```bash
# 1. Install required tools
brew install terragrunt opentofu awscli

# 2. Configure AWS credentials
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter default region: us-west-2
# Enter default output format: json

# 3. Verify configuration
aws sts get-caller-identity
```

## 🚀 Deploy to AWS (15 minutes)

```bash
# 1. Navigate to the learning app directory
cd /Users/rradhakrishnan/git/learning

# 2. Make deployment script executable
chmod +x deploy.sh

# 3. Initialize infrastructure
./deploy.sh -e dev init
# This prepares all Terragrunt modules

# 4. Preview what will be created
./deploy.sh -e dev plan
# Review the planned changes

# 5. Deploy the infrastructure
./deploy.sh -e dev apply
# Type 'yes' when prompted
# ☕ This takes ~10-15 minutes
```

## 📱 Access Your Application (5 minutes)

```bash
# 1. Get the application URL
./deploy.sh -e dev output

# You'll see output like:
# ALB URL: http://learning-app-alb-dev-1234567890.us-west-2.elb.amazonaws.com
# Cognito Login: https://learning-app-dev-abcd1234.auth.us-west-2.amazoncognito.com/login?...

# 2. Create a test user
aws cognito-idp admin-create-user \
  --user-pool-id us-west-2_XXXXXXXXX \
  --username your-email@example.com \
  --user-attributes Name=email,Value=your-email@example.com \
  --temporary-password TempPass123!

# 3. Open the ALB URL in your browser
# 4. Click "Sign in with Cognito" or go to the Cognito Login URL
# 5. Login with your email and temporary password
# 6. You'll be prompted to set a new password
```

## 🎯 What Was Created?

Your infrastructure now includes:

### Network Layer
- ✅ VPC with public and private subnets
- ✅ Internet Gateway
- ✅ 3 NAT Gateways (one per AZ)
- ✅ Security Groups

### Application Layer
- ✅ Application Load Balancer (ALB)
- ✅ ECS Fargate cluster
- ✅ Docker container running your app
- ✅ Auto-scaling configuration

### Data Layer
- ✅ RDS PostgreSQL database
- ✅ Automated backups
- ✅ Encrypted storage

### Security & Auth
- ✅ AWS Cognito user pool
- ✅ User authentication
- ✅ Secure credential storage

### Monitoring
- ✅ CloudWatch Logs
- ✅ Container Insights
- ✅ Database monitoring

## 🔍 Verify Deployment

```bash
# Check deployment status
./deploy.sh -e dev status

# View application logs
aws logs tail /ecs/learning-app-dev --follow

# Test health endpoint
curl http://YOUR-ALB-URL/health
# Should return: {"status":"ok"}
```

## 🛠️ Common Tasks

### Update Application Code

```bash
# 1. Build and push new Docker image
npm run docker:build-push

# 2. Force ECS to deploy new image
aws ecs update-service \
  --cluster learning-app-cluster-dev \
  --service learning-app-service-dev \
  --force-new-deployment

# 3. Monitor deployment
aws ecs describe-services \
  --cluster learning-app-cluster-dev \
  --services learning-app-service-dev
```

### View Application Logs

```bash
# Real-time logs
aws logs tail /ecs/learning-app-dev --follow

# Last 100 lines
aws logs tail /ecs/learning-app-dev --since 10m
```

### Scale Your Application

```bash
# Update desired count in env.hcl
# infrastructure/environments/dev/env.hcl
# Change: ecs_desired_count = 2

# Apply changes
./deploy.sh -e dev -m ecs apply
```

### Add a New User

```bash
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username newuser@example.com \
  --user-attributes Name=email,Value=newuser@example.com \
  --temporary-password TempPass123!
```

## 💾 Backup & Restore

### Create Database Snapshot

```bash
aws rds create-db-snapshot \
  --db-instance-identifier learning-app-db-dev \
  --db-snapshot-identifier learning-app-backup-$(date +%Y%m%d)
```

### Restore from Snapshot

```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier learning-app-db-dev-restored \
  --db-snapshot-identifier learning-app-backup-20240101
```

## 🧹 Cleanup (When Done Testing)

```bash
# Destroy all resources to avoid charges
./deploy.sh -e dev destroy
# Type 'destroy' when prompted

# This will remove:
# - All AWS resources
# - Database (with final snapshot in prod)
# - Load balancers
# - Everything created by Terragrunt
```

## 🆘 Troubleshooting

### Issue: "Cannot connect to database"

```bash
# 1. Check if database is available
aws rds describe-db-instances \
  --db-instance-identifier learning-app-db-dev

# 2. Verify security groups
# ECS tasks should be able to reach RDS on port 5432

# 3. Check database credentials
aws secretsmanager get-secret-value \
  --secret-id learning-app/dev/db-password
```

### Issue: "ECS tasks keep stopping"

```bash
# 1. Check task logs
aws logs tail /ecs/learning-app-dev --follow

# 2. Describe the task
aws ecs describe-tasks \
  --cluster learning-app-cluster-dev \
  --tasks TASK_ID

# 3. Common fixes:
# - Verify Docker image exists and is accessible
# - Check environment variables in ECS task definition
# - Ensure adequate CPU/Memory allocation
```

### Issue: "Terragrunt init fails"

```bash
# 1. Clear Terragrunt cache
find infrastructure -type d -name ".terragrunt-cache" -exec rm -rf {} +

# 2. Reinitialize
./deploy.sh -e dev init

# 3. If still failing, check AWS credentials
aws sts get-caller-identity
```

### Issue: "Cannot access application"

```bash
# 1. Get ALB URL
./deploy.sh -e dev output

# 2. Check ALB health
aws elbv2 describe-target-health \
  --target-group-arn YOUR_TARGET_GROUP_ARN

# 3. Verify security groups allow port 80/443

# 4. Check if tasks are running
aws ecs list-tasks \
  --cluster learning-app-cluster-dev \
  --service-name learning-app-service-dev
```

## 📊 Cost Information

### Development Environment (~$50-80/month)
- NAT Gateways: $32/month
- ALB: $16/month
- ECS: $15/month
- RDS: $15/month
- Data Transfer: $5-10/month

### 💡 Cost Saving Tips
```bash
# Stop dev environment when not in use
./deploy.sh -e dev destroy

# Reduce to 1 NAT Gateway (edit VPC module)
# Use smaller instance types
# Enable auto-scaling with min=0 for non-prod
```

## 🎓 Next Steps

1. **Customize Authentication**
   - Configure Cognito settings
   - Add social login (Google, Facebook)
   - Implement custom UI

2. **Add SSL Certificate**
   - Request ACM certificate
   - Update ALB to use HTTPS
   - Configure custom domain

3. **Set Up CI/CD**
   - GitHub Actions for automated deployment
   - Automated testing
   - Blue-green deployments

4. **Enable Monitoring**
   - Set up CloudWatch alarms
   - Configure SNS notifications
   - Add custom metrics

5. **Production Deployment**
   ```bash
   # Update prod configuration
   # vim infrastructure/environments/prod/env.hcl
   
   # Deploy to production
   ./deploy.sh -e prod apply
   ```

## 📚 Learn More

- [Full Infrastructure README](infrastructure/README.md)
- [Application Documentation](README.md)
- [Terragrunt Docs](https://terragrunt.gruntwork.io/)
- [AWS ECS Docs](https://docs.aws.amazon.com/ecs/)

## 🎉 You're All Set!

Your Learning App is now running on AWS with:
- ✅ Production-ready infrastructure
- ✅ Secure authentication
- ✅ Auto-scaling capabilities
- ✅ Automated backups
- ✅ Comprehensive monitoring

Happy learning! 🚀
