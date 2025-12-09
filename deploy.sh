#!/usr/bin/env bash

################################################################################
# Learning App Deployment Script
################################################################################
# This script automates the deployment of the Learning App to AWS using
# Terragrunt and OpenTofu
################################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${SCRIPT_DIR}/infrastructure"

# Default values
ENVIRONMENT=""
ACTION=""
MODULE=""
AUTO_APPROVE=false
DRY_RUN=false

################################################################################
# Helper Functions
################################################################################

print_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║         Learning App - AWS Deployment Manager                ║
║                    Powered by Terragrunt                      ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

print_info() {
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

print_step() {
    echo -e "${CYAN}==>${NC} $1"
}

print_usage() {
    cat << EOF
Usage: $(basename "$0") [OPTIONS] ACTION

Deploy and manage Learning App infrastructure on AWS

ACTIONS:
    init        Initialize Terragrunt modules
    plan        Generate execution plan
    apply       Apply infrastructure changes
    destroy     Destroy infrastructure
    output      Show output values
    validate    Validate configuration
    graph       Generate dependency graph
    status      Show deployment status

OPTIONS:
    -e, --environment ENV   Environment (dev/prod) [REQUIRED]
    -m, --module MODULE     Specific module (vpc/cognito/rds/alb/ecs)
    -y, --auto-approve      Auto approve changes
    --dry-run              Show what would be executed
    -h, --help             Show this help message

EXAMPLES:
    # Deploy entire dev environment
    $(basename "$0") -e dev apply

    # Plan changes for specific module
    $(basename "$0") -e dev -m vpc plan

    # Destroy with auto-approve
    $(basename "$0") -e dev -y destroy

    # Check deployment status
    $(basename "$0") -e dev status

    # Generate dependency graph
    $(basename "$0") -e dev graph

EOF
}

check_prerequisites() {
    print_step "Checking prerequisites..."
    
    local missing_tools=()
    
    if ! command -v terragrunt &> /dev/null; then
        missing_tools+=("terragrunt")
    fi
    
    if ! command -v tofu &> /dev/null; then
        missing_tools+=("tofu")
    fi
    
    if ! command -v aws &> /dev/null; then
        missing_tools+=("aws")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        echo ""
        print_info "Install missing tools:"
        for tool in "${missing_tools[@]}"; do
            case $tool in
                terragrunt)
                    echo "  brew install terragrunt"
                    ;;
                tofu)
                    echo "  brew install opentofu"
                    ;;
                aws)
                    echo "  brew install awscli"
                    ;;
            esac
        done
        exit 1
    fi
    
    print_success "All prerequisites satisfied"
}

check_aws_credentials() {
    print_step "Verifying AWS credentials..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured"
        print_info "Configure credentials with: aws configure"
        exit 1
    fi
    
    local aws_account=$(aws sts get-caller-identity --query Account --output text)
    local aws_user=$(aws sts get-caller-identity --query Arn --output text)
    
    print_success "AWS credentials verified"
    print_info "Account: $aws_account"
    print_info "Identity: $aws_user"
}

validate_environment() {
    if [[ -z "$ENVIRONMENT" ]]; then
        print_error "Environment not specified"
        print_usage
        exit 1
    fi
    
    if [[ ! "$ENVIRONMENT" =~ ^(dev|prod)$ ]]; then
        print_error "Invalid environment: $ENVIRONMENT"
        print_info "Valid environments: dev, prod"
        exit 1
    fi
    
    print_info "Environment: $ENVIRONMENT"
}

get_working_directory() {
    if [[ -n "$MODULE" ]]; then
        echo "${INFRA_DIR}/environments/${ENVIRONMENT}/${MODULE}"
    else
        echo "${INFRA_DIR}/environments/${ENVIRONMENT}"
    fi
}

################################################################################
# Action Functions
################################################################################

action_init() {
    print_step "Initializing Terragrunt..."
    
    local work_dir=$(get_working_directory)
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "Would execute: cd $work_dir && terragrunt run-all init"
        return
    fi
    
    cd "$work_dir"
    
    if [[ -n "$MODULE" ]]; then
        terragrunt init
    else
        terragrunt run-all init
    fi
    
    print_success "Initialization complete"
}

action_plan() {
    print_step "Generating execution plan..."
    
    local work_dir=$(get_working_directory)
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "Would execute: cd $work_dir && terragrunt plan"
        return
    fi
    
    cd "$work_dir"
    
    if [[ -n "$MODULE" ]]; then
        terragrunt plan
    else
        terragrunt run-all plan
    fi
    
    print_success "Plan generated successfully"
}

action_apply() {
    print_step "Applying infrastructure changes..."
    
    if [[ "$AUTO_APPROVE" == "false" ]] && [[ -z "$MODULE" ]]; then
        print_warning "This will deploy the entire $ENVIRONMENT environment"
        read -p "Are you sure you want to continue? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            print_info "Operation cancelled"
            exit 0
        fi
    fi
    
    local work_dir=$(get_working_directory)
    local tf_args=""
    
    if [[ "$AUTO_APPROVE" == "true" ]]; then
        tf_args="-auto-approve"
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "Would execute: cd $work_dir && terragrunt apply $tf_args"
        return
    fi
    
    cd "$work_dir"
    
    if [[ -n "$MODULE" ]]; then
        terragrunt apply $tf_args
    else
        terragrunt run-all apply $tf_args
    fi
    
    print_success "Infrastructure deployed successfully!"
    
    # Show important outputs
    if [[ -z "$MODULE" ]]; then
        echo ""
        print_step "Deployment Information:"
        action_output
    fi
}

action_destroy() {
    print_warning "DESTRUCTIVE OPERATION!"
    
    if [[ "$AUTO_APPROVE" == "false" ]]; then
        echo ""
        print_error "This will destroy infrastructure in: $ENVIRONMENT"
        if [[ -n "$MODULE" ]]; then
            print_info "Module: $MODULE"
        else
            print_warning "ALL MODULES will be destroyed!"
        fi
        echo ""
        read -p "Type 'destroy' to confirm: " -r
        if [[ ! $REPLY == "destroy" ]]; then
            print_info "Operation cancelled"
            exit 0
        fi
    fi
    
    local work_dir=$(get_working_directory)
    local tf_args=""
    
    if [[ "$AUTO_APPROVE" == "true" ]]; then
        tf_args="-auto-approve"
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_info "Would execute: cd $work_dir && terragrunt destroy $tf_args"
        return
    fi
    
    cd "$work_dir"
    
    if [[ -n "$MODULE" ]]; then
        terragrunt destroy $tf_args
    else
        terragrunt run-all destroy $tf_args
    fi
    
    print_success "Infrastructure destroyed"
}

action_output() {
    local work_dir=$(get_working_directory)
    
    cd "$work_dir"
    
    if [[ -n "$MODULE" ]]; then
        terragrunt output
    else
        # Show outputs from each module
        print_info "ALB URL:"
        cd "$work_dir/alb"
        terragrunt output alb_url 2>/dev/null || echo "  Not available"
        
        echo ""
        print_info "Cognito Configuration:"
        cd "$work_dir/cognito"
        terragrunt output cognito_login_url 2>/dev/null || echo "  Not available"
        terragrunt output user_pool_id 2>/dev/null || echo "  Not available"
        terragrunt output user_pool_client_id 2>/dev/null || echo "  Not available"
        
        echo ""
        print_info "Database:"
        cd "$work_dir/rds"
        terragrunt output db_instance_endpoint 2>/dev/null || echo "  Not available"
    fi
}

action_validate() {
    print_step "Validating configuration..."
    
    local work_dir=$(get_working_directory)
    
    cd "$work_dir"
    
    if [[ -n "$MODULE" ]]; then
        terragrunt validate
    else
        terragrunt run-all validate
    fi
    
    print_success "Configuration is valid"
}

action_graph() {
    print_step "Generating dependency graph..."
    
    local work_dir="${INFRA_DIR}/environments/${ENVIRONMENT}"
    
    cd "$work_dir"
    
    local output_file="dependency-graph-${ENVIRONMENT}.dot"
    terragrunt graph-dependencies > "$output_file"
    
    print_success "Dependency graph generated: $output_file"
    print_info "View with: dot -Tpng $output_file -o graph.png"
}

action_status() {
    print_step "Checking deployment status..."
    
    local work_dir="${INFRA_DIR}/environments/${ENVIRONMENT}"
    
    echo ""
    print_info "VPC Status:"
    cd "$work_dir/vpc"
    if [ -f ".terraform/terraform.tfstate" ] || terragrunt state list &>/dev/null; then
        echo "  ✓ Deployed"
    else
        echo "  ✗ Not deployed"
    fi
    
    echo ""
    print_info "ALB Status:"
    cd "$work_dir/alb"
    if [ -f ".terraform/terraform.tfstate" ] || terragrunt state list &>/dev/null; then
        echo "  ✓ Deployed"
    else
        echo "  ✗ Not deployed"
    fi
    
    echo ""
    print_info "Cognito Status:"
    cd "$work_dir/cognito"
    if [ -f ".terraform/terraform.tfstate" ] || terragrunt state list &>/dev/null; then
        echo "  ✓ Deployed"
    else
        echo "  ✗ Not deployed"
    fi
    
    echo ""
    print_info "RDS Status:"
    cd "$work_dir/rds"
    if [ -f ".terraform/terraform.tfstate" ] || terragrunt state list &>/dev/null; then
        echo "  ✓ Deployed"
    else
        echo "  ✗ Not deployed"
    fi
    
    echo ""
    print_info "ECS Status:"
    cd "$work_dir/ecs"
    if [ -f ".terraform/terraform.tfstate" ] || terragrunt state list &>/dev/null; then
        echo "  ✓ Deployed"
    else
        echo "  ✗ Not deployed"
    fi
}

################################################################################
# Main Script
################################################################################

main() {
    print_banner
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -m|--module)
                MODULE="$2"
                shift 2
                ;;
            -y|--auto-approve)
                AUTO_APPROVE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                print_usage
                exit 0
                ;;
            init|plan|apply|destroy|output|validate|graph|status)
                ACTION="$1"
                shift
                break
                ;;
            *)
                print_error "Unknown option: $1"
                print_usage
                exit 1
                ;;
        esac
    done
    
    # Validate action
    if [[ -z "$ACTION" ]]; then
        print_error "No action specified"
        print_usage
        exit 1
    fi
    
    # Run checks
    check_prerequisites
    check_aws_credentials
    validate_environment
    
    # Execute action
    case "$ACTION" in
        init)
            action_init
            ;;
        plan)
            action_plan
            ;;
        apply)
            action_apply
            ;;
        destroy)
            action_destroy
            ;;
        output)
            action_output
            ;;
        validate)
            action_validate
            ;;
        graph)
            action_graph
            ;;
        status)
            action_status
            ;;
        *)
            print_error "Unknown action: $ACTION"
            print_usage
            exit 1
            ;;
    esac
    
    echo ""
    print_success "Operation completed successfully!"
}

# Run main function
main "$@"
