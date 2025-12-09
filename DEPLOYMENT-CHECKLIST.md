# Learning App - Deployment Checklist

## Pre-Deployment Checklist

### 1. Prerequisites Installation
- [ ] Install Terragrunt (`brew install terragrunt`)
- [ ] Install OpenTofu (`brew install opentofu`)
- [ ] Install AWS CLI (`brew install awscli`)
- [ ] Verify versions:
  ```bash
  terragrunt --version  # Should be >= 0.54.0
  tofu --version        # Should be >= 1.6.0
  aws --version         # Should be >= 2.x
  ```

### 2. AWS Account Setup
- [ ] AWS account created
- [ ] IAM user with admin privileges created
- [ ] Access keys generated
- [ ] AWS CLI configured (`aws configure`)
- [ ] Test credentials: `aws sts get-caller-identity`

### 3. Docker Image
- [ ] Application Docker image built
- [ ] Image pushed to Docker Hub or ECR
- [ ] Image tag noted for deployment
- [ ] Verify image: `docker pull your-image:tag`

### 4. Configuration Review
- [ ] Review `infrastructure/environments/dev/env.hcl`
- [ ] Review `infrastructure/environments/prod/env.hcl`
- [ ] Update region if needed
- [ ] Update resource sizes for environment
- [ ] Review VPC CIDR blocks (no conflicts)

---

## Development Environment Deployment

### Phase 1: Initial Setup (5 minutes)
- [ ] Navigate to project: `cd /Users/rradhakrishnan/git/learning`
- [ ] Make deploy script executable: `chmod +x deploy.sh`
- [ ] Review deployment plan: `./deploy.sh -e dev plan`
- [ ] Verify AWS account and region in output

### Phase 2: Infrastructure Deployment (15-20 minutes)
- [ ] Initialize Terragrunt: `./deploy.sh -e dev init`
- [ ] Deploy VPC: `./deploy.sh -e dev -m vpc apply`
  - [ ] Wait for completion (~3 minutes)
  - [ ] Verify VPC created in AWS Console
- [ ] Deploy ALB: `./deploy.sh -e dev -m alb apply`
  - [ ] Wait for completion (~3 minutes)
  - [ ] Note ALB DNS name
- [ ] Deploy Cognito: `./deploy.sh -e dev -m cognito apply`
  - [ ] Wait for completion (~2 minutes)
  - [ ] Note User Pool ID and Client ID
- [ ] Deploy RDS: `./deploy.sh -e dev -m rds apply`
  - [ ] Wait for completion (~10 minutes)
  - [ ] Verify database endpoint
- [ ] Deploy ECS: `./deploy.sh -e dev -m ecs apply`
  - [ ] Wait for completion (~5 minutes)
  - [ ] Verify tasks are running

### Phase 3: Verification (5 minutes)
- [ ] Check deployment status: `./deploy.sh -e dev status`
- [ ] Get outputs: `./deploy.sh -e dev output`
- [ ] Test health endpoint:
  ```bash
  ALB_URL=$(cd infrastructure/environments/dev/alb && terragrunt output -raw alb_url)
  curl $ALB_URL/health
  ```
  Expected: `{"status":"ok"}`

### Phase 4: User Setup (5 minutes)
- [ ] Get Cognito User Pool ID:
  ```bash
  cd infrastructure/environments/dev/cognito
  USER_POOL_ID=$(terragrunt output -raw user_pool_id)
  ```
- [ ] Create test user:
  ```bash
  aws cognito-idp admin-create-user \
    --user-pool-id $USER_POOL_ID \
    --username test@example.com \
    --user-attributes Name=email,Value=test@example.com \
    --temporary-password TempPass123!
  ```
- [ ] Access application in browser
- [ ] Login with test credentials
- [ ] Set permanent password
- [ ] Verify application functionality

### Phase 5: Post-Deployment
- [ ] Document ALB URL
- [ ] Document Cognito endpoints
- [ ] Save User Pool ID and Client ID
- [ ] Test creating/reading tasks
- [ ] Review CloudWatch logs:
  ```bash
  aws logs tail /ecs/learning-app-dev --follow
  ```

---

## Production Environment Deployment

### Phase 1: Pre-Production Review
- [ ] All development testing completed
- [ ] Performance testing done
- [ ] Security review completed
- [ ] Backup strategy confirmed
- [ ] Monitoring configured
- [ ] Alert thresholds set

### Phase 2: Configuration Updates
- [ ] Review prod configuration: `vim infrastructure/environments/prod/env.hcl`
- [ ] Update these settings:
  - [ ] Increase ECS task count (min 2)
  - [ ] Increase RDS instance size
  - [ ] Enable Multi-AZ for RDS
  - [ ] Set deletion protection
  - [ ] Configure domain name (if applicable)
  - [ ] Enable SSL certificate
- [ ] Commit configuration changes

### Phase 3: Domain & SSL (If applicable)
- [ ] Domain registered
- [ ] DNS configured in Route 53
- [ ] SSL certificate requested in ACM
- [ ] Certificate validated
- [ ] Update ALB configuration with certificate

### Phase 4: Production Deployment (20-30 minutes)
- [ ] Final review: `./deploy.sh -e prod plan`
- [ ] Deploy infrastructure: `./deploy.sh -e prod apply`
- [ ] Monitor deployment progress
- [ ] Verify all resources created
- [ ] Check task health in ECS
- [ ] Verify RDS Multi-AZ status

### Phase 5: Production Verification
- [ ] Health check: `curl https://your-domain.com/health`
- [ ] Create production admin user
- [ ] Test authentication flow
- [ ] Test all application features
- [ ] Load testing (if required)
- [ ] Check all monitoring dashboards
- [ ] Verify backups are running
- [ ] Test auto-scaling (optional)

### Phase 6: Documentation
- [ ] Document production URLs
- [ ] Document access procedures
- [ ] Update runbooks
- [ ] Share credentials securely (AWS Secrets Manager)
- [ ] Document monitoring procedures
- [ ] Create incident response plan

---

## Post-Deployment Monitoring

### Daily Checks (First Week)
- [ ] Check ECS task health
- [ ] Review CloudWatch alarms
- [ ] Monitor error rates
- [ ] Check RDS performance
- [ ] Review application logs
- [ ] Verify backup completion

### Weekly Checks
- [ ] Review costs in AWS Cost Explorer
- [ ] Check security group rules
- [ ] Review IAM access
- [ ] Update dependencies (if needed)
- [ ] Test backup restore procedure
- [ ] Review scaling metrics

### Monthly Checks
- [ ] Security audit
- [ ] Cost optimization review
- [ ] Performance optimization
- [ ] Update infrastructure docs
- [ ] Review and test disaster recovery

---

## Rollback Procedures

### If Deployment Fails

1. **During VPC/Network deployment:**
   ```bash
   ./deploy.sh -e dev -m vpc destroy
   # Fix configuration
   ./deploy.sh -e dev -m vpc apply
   ```

2. **During Application deployment:**
   ```bash
   # Rollback to previous task definition
   aws ecs update-service \
     --cluster learning-app-cluster-dev \
     --service learning-app-service-dev \
     --task-definition learning-app-task-dev:PREVIOUS_VERSION
   ```

3. **Database issues:**
   ```bash
   # Restore from snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier learning-app-db-dev \
     --db-snapshot-identifier SNAPSHOT_ID
   ```

4. **Complete rollback:**
   ```bash
   ./deploy.sh -e dev destroy
   # Review issues, fix configuration
   ./deploy.sh -e dev apply
   ```

---

## Troubleshooting Checklist

### Issue: Tasks Not Starting
- [ ] Check CloudWatch logs: `/ecs/learning-app-{env}`
- [ ] Verify Docker image exists and is accessible
- [ ] Check ECS task definition environment variables
- [ ] Verify security groups allow ALB to ECS communication
- [ ] Check task CPU/Memory limits
- [ ] Verify IAM role permissions

### Issue: Can't Connect to Database
- [ ] Verify RDS instance is available
- [ ] Check security group allows ECS to RDS (port 5432)
- [ ] Verify database credentials in Secrets Manager
- [ ] Check connection string in task definition
- [ ] Test connectivity from ECS task:
  ```bash
  aws ecs execute-command \
    --cluster learning-app-cluster-dev \
    --task TASK_ID \
    --command "nc -zv DB_HOST 5432"
  ```

### Issue: Authentication Not Working
- [ ] Verify Cognito User Pool is created
- [ ] Check User Pool Client ID is correct
- [ ] Verify callback URLs are configured
- [ ] Check application has correct Cognito environment variables
- [ ] Test Cognito hosted UI directly

### Issue: High Costs
- [ ] Check NAT Gateway usage (consider single gateway for dev)
- [ ] Review ECS task count and sizing
- [ ] Check RDS instance size
- [ ] Review data transfer costs
- [ ] Look for unused resources
- [ ] Consider Fargate Spot for non-critical tasks

---

## Success Criteria

### Development Environment
- [ ] Application accessible via ALB URL
- [ ] Users can register and login
- [ ] Tasks can be created and retrieved
- [ ] Database connectivity working
- [ ] Logs visible in CloudWatch
- [ ] Health checks passing
- [ ] Response time < 1 second
- [ ] Total deployment cost < $100/month

### Production Environment
- [ ] Application accessible via custom domain (if applicable)
- [ ] SSL/TLS enabled
- [ ] Multi-AZ database running
- [ ] Auto-scaling configured
- [ ] Monitoring and alerting active
- [ ] Backups running daily
- [ ] Disaster recovery tested
- [ ] Security audit passed
- [ ] Load testing completed
- [ ] Documentation complete

---

## Emergency Contacts

- AWS Support: https://console.aws.amazon.com/support
- Terragrunt Issues: https://github.com/gruntwork-io/terragrunt/issues
- Application Support: [Your contact info]

---

## Sign-off

### Development Deployment
- [ ] Deployed by: _________________
- [ ] Date: _________________
- [ ] Verified by: _________________
- [ ] Date: _________________

### Production Deployment
- [ ] Deployed by: _________________
- [ ] Date: _________________
- [ ] Verified by: _________________
- [ ] Date: _________________
- [ ] Approved by: _________________
- [ ] Date: _________________

---

**Note:** Keep this checklist updated as your deployment process evolves!
