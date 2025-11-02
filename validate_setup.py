#!/usr/bin/env python3
"""
Setup Validation Script for AI Proposal Assistant

Run this to verify all components are properly installed and configured.
"""

import sys
from pathlib import Path
import importlib.util


def check_python_version():
    """Check Python version."""
    print("🐍 Checking Python version...")
    version = sys.version_info
    if version >= (3, 11):
        print(f"   ✅ Python {version.major}.{version.minor}.{version.micro} (Good!)")
        return True
    else:
        print(f"   ⚠️  Python {version.major}.{version.minor}.{version.micro} (Recommended: 3.11+)")
        return False


def check_dependencies():
    """Check required Python packages."""
    print("\n📦 Checking dependencies...")
    
    required = {
        'fastapi': 'FastAPI web framework',
        'uvicorn': 'ASGI server',
        'pydantic': 'Data validation',
        'jinja2': 'Template engine',
        'pytest': 'Testing framework'
    }
    
    all_installed = True
    for package, description in required.items():
        spec = importlib.util.find_spec(package)
        if spec is not None:
            print(f"   ✅ {package:15} - {description}")
        else:
            print(f"   ❌ {package:15} - {description} (NOT INSTALLED)")
            all_installed = False
    
    if not all_installed:
        print("\n   💡 Install missing packages: pip install -r requirements.txt")
    
    return all_installed


def check_files():
    """Check required files exist."""
    print("\n📁 Checking required files...")
    
    required_files = {
        'data/service_catalog.csv': 'Service catalog',
        'data/sla_templates.csv': 'SLA templates',
        'data/pricing_tiers.csv': 'Pricing tiers',
        'templates/proposal_template.md': 'Proposal template',
        'ai_proposal/__init__.py': 'Main package',
        'ai_proposal/server.py': 'Server module',
        'requirements.txt': 'Dependencies file'
    }
    
    all_exist = True
    for file_path, description in required_files.items():
        path = Path(file_path)
        if path.exists():
            size = path.stat().st_size
            print(f"   ✅ {file_path:35} ({size:,} bytes)")
        else:
            print(f"   ❌ {file_path:35} (MISSING)")
            all_exist = False
    
    return all_exist


def check_directories():
    """Check required directories exist."""
    print("\n📂 Checking directories...")
    
    required_dirs = [
        'ai_proposal',
        'data',
        'templates',
        'tests',
        'output/proposals'
    ]
    
    all_exist = True
    for dir_path in required_dirs:
        path = Path(dir_path)
        if path.exists() and path.is_dir():
            print(f"   ✅ {dir_path}")
        else:
            print(f"   ❌ {dir_path} (MISSING)")
            all_exist = False
            if not path.exists():
                print(f"      Creating directory: {dir_path}")
                path.mkdir(parents=True, exist_ok=True)
    
    return all_exist


def check_data_files():
    """Check data file contents."""
    print("\n📊 Checking data file contents...")
    
    try:
        # Check service catalog
        import csv
        with open('data/service_catalog.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            services = list(reader)
            print(f"   ✅ Service catalog: {len(services)} services loaded")
        
        # Check SLAs
        with open('data/sla_templates.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            slas = list(reader)
            print(f"   ✅ SLA templates: {len(slas)} levels loaded")
        
        # Check tiers
        with open('data/pricing_tiers.csv', 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            tiers = list(reader)
            print(f"   ✅ Pricing tiers: {len(tiers)} tiers loaded")
        
        return True
    except Exception as e:
        print(f"   ❌ Error reading data files: {e}")
        return False


def check_import():
    """Try importing the main module."""
    print("\n🔧 Testing module import...")
    
    try:
        import ai_proposal
        print(f"   ✅ ai_proposal module imported successfully")
        print(f"      Version: {ai_proposal.__version__}")
        return True
    except ImportError as e:
        print(f"   ❌ Failed to import ai_proposal: {e}")
        return False


def check_env_file():
    """Check if .env file exists."""
    print("\n🔐 Checking environment configuration...")
    
    env_path = Path('.env')
    example_path = Path('.env.example')
    
    if env_path.exists():
        print(f"   ✅ .env file exists")
        return True
    elif example_path.exists():
        print(f"   ⚠️  .env file not found (optional)")
        print(f"      Copy from .env.example if needed:")
        print(f"      cp .env.example .env")
        return True
    else:
        print(f"   ℹ️  No .env file (optional - uses defaults)")
        return True


def print_next_steps():
    """Print next steps."""
    print("\n" + "="*60)
    print("✅ Setup Validation Complete!")
    print("="*60)
    print("\n📋 Next Steps:\n")
    print("1. Start the server:")
    print("   uvicorn ai_proposal.server:app --reload\n")
    print("2. Visit API docs:")
    print("   http://localhost:8000/docs\n")
    print("3. Run tests:")
    print("   pytest tests/ -v\n")
    print("4. Test API:")
    print("   python test_proposal_api.py\n")
    print("5. Read documentation:")
    print("   - QUICKSTART_PROPOSAL.md (Quick start)")
    print("   - AI_PROPOSAL_README.md (Full docs)")
    print("   - AI_PROPOSAL_INTEGRATION.md (Integration guide)")
    print("\n🎉 Ready to generate proposals!")


def print_issues(checks):
    """Print any issues found."""
    issues = [name for name, passed in checks.items() if not passed]
    
    if issues:
        print("\n" + "="*60)
        print("⚠️  Issues Found")
        print("="*60)
        print("\nThe following checks failed:")
        for issue in issues:
            print(f"  - {issue}")
        print("\nPlease fix these issues before proceeding.")
        print("\nQuick fixes:")
        print("  - Install dependencies: pip install -r requirements.txt")
        print("  - Ensure you're in the project root directory")
        print("  - Check that all files were created correctly")
        return False
    return True


def main():
    """Run all validation checks."""
    print("="*60)
    print("🤖 AI Proposal Assistant - Setup Validation")
    print("="*60)
    print()
    
    checks = {
        'Python Version': check_python_version(),
        'Dependencies': check_dependencies(),
        'Files': check_files(),
        'Directories': check_directories(),
        'Data Files': check_data_files(),
        'Module Import': check_import(),
        'Environment': check_env_file()
    }
    
    print("\n" + "="*60)
    print("📊 Validation Summary")
    print("="*60)
    
    for check_name, passed in checks.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {status:10} - {check_name}")
    
    all_passed = all(checks.values())
    
    if all_passed:
        print_next_steps()
        return 0
    else:
        print_issues(checks)
        return 1


if __name__ == "__main__":
    sys.exit(main())

