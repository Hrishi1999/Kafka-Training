# 



## Prerequisites

### System Requirements
- Python 3.8 or higher (Python 3.11+ recommended)
- pip (Python package manager)
- Text editor or IDE (VS Code will be used for the training sessions)
- Terminal/Command Prompt access
- Confluent Cloud account
## Setup Confluent Cloud
You can follow this guide for account creation: https://www.youtube.com/watch?v=miN4WLiJnRE

### Operating System Specific Requirements

#### macOS
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python 3.11+
brew install python@3.11

# Verify installation
python3 --version
```

#### Windows
1. Download Python from [python.org](https://www.python.org/downloads/)
2. During installation, check "Add Python to PATH"
3. Install Windows Terminal (recommended) from Microsoft Store

#### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install Python 3.11+
sudo apt install python3.11 python3.11-venv python3-pip

# Verify installation
python3.11 --version
```

## Step-by-Step Setup Instructions

### 1. Check Python Installation
```bash
python3 --version
```

### 2. Set Up Virtual Environment

#### Why Use Virtual Environments?
- Isolates project dependencies
- Prevents version conflicts
- Makes projects reproducible
- Allows different Python versions per project

#### Creating Virtual Environment
```bash
# Navigate to project directory
cd kafka-training

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate

# You should see (venv) in your terminal prompt
```

### 3. Install Required Packages

Install packages:
```bash
pip install -r requirements.txt

# Verify installation
pip list
```

### 4. IDE Configuration

#### VS Code Setup
1. Install Python extension
2. Create `.vscode/settings.json`:
```json
{
    "python.defaultInterpreterPath": "./venv/bin/python",
    "python.linting.enabled": true,
    "python.linting.flake8Enabled": true,
    "python.formatting.provider": "black",
    "editor.formatOnSave": true,
    "python.testing.pytestEnabled": true
}
```

#### PyCharm Setup
1. Open project directory
2. Configure interpreter: Settings → Project → Python Interpreter
3. Select virtual environment
4. Enable pytest as test runner
