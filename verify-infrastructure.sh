#!/usr/bin/env bash

################################################################################
# Infrastructure Verification Script
################################################################################
# This script verifies that all infrastructure files are in place and
# prerequisites are met before deployment
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
WARNINGS=0

print_header() {
    echo -e "${CYAN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════╗
║     Infrastructure Verification                          ║
║     Learning App - AWS Deployment                        ║
╚═══════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

print_section() {
    echo -e "\n${BLUE}━━━ $1 ━━━${NC}\n"
}

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# Check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check if a file exists
file_exists() {
    [[ -f "$1" ]]
}

# Check if a directory exists
dir_exists() {
    [[ -d "$1" ]]
}

print_header

# 1. Check Prerequisites
print_section "Prerequisites"

if command_exists terragrunt; then
    version=$(terragrunt --version 2>&1 | head -n1 || echo "unknown")
    check_pass "Terragrunt is installed ($version)"
else
    check_fail "Terragrunt is not installed"
    echo "         Install with: brew install terragrunt"
fi

if command_exists tofu; then
    version=$(tofu --version 2>&1 | head -n1 || echo "unknown")
    check_pass "OpenTofu is installed ($version)"
else
    check_fail "OpenTofu is not installed"
    echo "         Install with: brew install opentofu"
fi

if command_exists aws; then
    version=$(aws --version 2>&1 || echo "unknown")
    check_pass "AWS CLI is installed ($version)"
else
    check_fail "AWS CLI is not installed"
    echo "         Install with: brew install awscli"
fi

if command_exists docker; then
    version=$(docker --version 2>&1 || echo "unknown")
    check_pass "Docker is installed ($version)"
else
    check_warn "Docker is not installed (optional but recommended)"
    echo "         Install with: brew install docker"
fi

# 2. Check AWS Credentials
print_section "AWS Configuration"

if aws sts get-caller-identity &> /dev/null; then
    account=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
    user=$(aws sts get-caller-identity --query Arn --output text 2>/dev/null)
    check_pass "AWS credentials are configured"
    echo "         Account: $account"
    echo "         Identity: $user"
else
    check_fail "AWS credentials are not configured"
    echo "         Configure with: aws configure"
fi

if aws sts get-caller-identity &> /dev/null; then
    region=$(aws configure get region 2>/dev/null || echo "not set")
    if [[ "$region" != "not set" ]]; then
        check_pass "AWS region is configured: $region"
    else
        check_warn "AWS region not set in configuration"
        echo "         Set with: aws configure set region us-west-2"
    fi
fi

# 3. Check Infrastructure Files
print_section "Infrastructure Files"

cd "$SCRIPT_DIR"

# Root files
if file_exists "infrastructure/terragrunt.hcl"; then
    check_pass "Root terragrunt.hcl exists"
else
    check_fail "Root terragrunt.hcl is missing"
fi

if file_exists "infrastructure/.gitignore"; then
    check_pass "Infrastructure .gitignore exists"
else
    check_warn "Infrastructure .gitignore is missing"
fi

if file_exists "deploy.sh"; then
    check_pass "Deployment script exists"
    if [[ -x "deploy.sh" ]]; then
        check_pass "Deployment script is executable"
    else
        check_warn "Deployment script is not executable"
        echo "         Fix with: chmod +x deploy.sh"
    fi
else
    check_fail "Deployment script is missing"
fi

# Modules
print_section "Terraform Modules"

modules=("vpc" "cognito" "rds" "alb" "ecs")
for module in "${modules[@]}"; do
    if dir_exists "infrastructure/modules/$module"; then
        if file_exists "infrastructure/modules/$module/main.tf" && \
           file_exists "infrastructure/modules/$module/outputs.tf"; then
            check_pass "Module '$module' is complete"
        else
            check_fail "Module '$module' is incomplete (missing files)"
        fi
    else
        check_fail "Module '$module' directory is missing"
    fi
done

# Environment Configurations
print_section "Environment Configurations"

environments=("dev" "prod")
for env in "${environments[@]}"; do
    if dir_exists "infrastructure/environments/$env"; then
        if file_exists "infrastructure/environments/$env/env.hcl"; then
            check_pass "Environment '$env' configuration exists"
        else
            check_fail "Environment '$env' env.hcl is missing"
        fi
        
        # Check module configs for dev (prod can be configured later)
        if [[ "$env" == "dev" ]]; then
            for module in "${modules[@]}"; do
                if file_exists "infrastructure/environments/$env/$module/terragrunt.hcl"; then
                    check_pass "Dev $module terragrunt.hcl exists"
                else
                    check_fail "Dev $module terragrunt.hcl is missing"
                fi
            done
        fi
    else
        check_fail "Environment '$env' directory is missing"
    fi
done

# Documentation
print_section "Documentation"

docs=(
    "QUICKSTART-AWS.md"
    "DEPLOYMENT-CHECKLIST.md"
    "AWS-INFRASTRUCTURE-SUMMARY.md"
    "infrastructure/README.md"
    "infrastructure/ARCHITECTURE.md"
)

for doc in "${docs[@]}"; do
    if file_exists "$doc"; then
        check_pass "$(basename "$doc") exists"
    else
        check_warn "$(basename "$doc") is missing"
    fi
done

# Application Files
print_section "Application Files"

if file_exists "package.json"; then
    check_pass "package.json exists"
else
    check_warn "package.json is missing"
fi

if file_exists "Dockerfile"; then
    check_pass "Dockerfile exists"
else
    check_warn "Dockerfile is missing (needed for container deployment)"
fi

if file_exists ".env.aws.example"; then
    check_pass "Environment variables example exists"
else
    check_warn "Environment variables example is missing"
fi

# Summary
print_section "Verification Summary"

total_checks=$((CHECKS_PASSED + CHECKS_FAILED))
echo ""
echo -e "  ${GREEN}✓ Passed:${NC}  $CHECKS_PASSED"
echo -e "  ${RED}✗ Failed:${NC}  $CHECKS_FAILED"
echo -e "  ${YELLOW}⚠ Warnings:${NC} $WARNINGS"
echo -e "  ────────────────"
echo -e "  Total checks: $total_checks"
echo ""

if [[ $CHECKS_FAILED -eq 0 ]]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "You're ready to deploy!"
    echo ""
    echo "Next steps:"
    echo "  1. Review configuration: vim infrastructure/environments/dev/env.hcl"
    echo "  2. Initialize: ./deploy.sh -e dev init"
    echo "  3. Plan: ./deploy.sh -e dev plan"
    echo "  4. Deploy: ./deploy.sh -e dev apply"
    echo ""
    echo "For detailed instructions, see: QUICKSTART-AWS.md"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}✗ Some checks failed!${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Please address the failed checks above before deploying."
    echo ""
    echo "Common fixes:"
    echo "  • Install missing tools (see commands above)"
    echo "  • Configure AWS credentials: aws configure"
    echo "  • Make scripts executable: chmod +x deploy.sh"
    echo ""
    exit 1
fi
