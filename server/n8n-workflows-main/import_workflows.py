#!/usr/bin/env python3
"""
N8N Workflow Importer
Python replacement for import-workflows.sh with better error handling and progress tracking.
"""

import json
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Any
import argparse


class WorkflowImporter:
    """Import n8n workflows with progress tracking and error handling."""
    
    def __init__(self, workflows_dir: str = "workflows", use_docker: bool = False):
        self.workflows_dir = Path(workflows_dir)
        self.use_docker = use_docker
        self.imported_count = 0
        self.failed_count = 0
        self.errors = []

    def validate_workflow(self, file_path: Path) -> bool:
        """Validate workflow JSON before import."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Basic validation
            if not isinstance(data, dict):
                return False
            
            # Check required fields
            required_fields = ['nodes', 'connections']
            for field in required_fields:
                if field not in data:
                    return False
            
            return True
        except (json.JSONDecodeError, FileNotFoundError, PermissionError):
            return False

    def import_workflow(self, file_path: Path) -> bool:
        """Import a single workflow file."""
        try:
            # Step 1: Read the file
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except (json.JSONDecodeError, FileNotFoundError, PermissionError) as e:
                self.errors.append(f"Could not read or parse {file_path.name}: {e}")
                return False

            # Step 2: Fix the data - ensure 'name' field exists
            if 'name' not in data or not data['name']:
                # Use the filename (without .json) as the workflow name
                data['name'] = file_path.stem
                print(f"🔧 Fixed missing name for: {file_path.name}")

            # Basic validation after potential fix
            if not isinstance(data, dict) or 'nodes' not in data or 'connections' not in data:
                self.errors.append(f"Missing required fields in {file_path.name}")
                return False

            # Convert fixed data back to a JSON string
            workflow_content_fixed = json.dumps(data, indent=2)

            # Step 3: Import the fixed workflow
            if self.use_docker:
                # Pipe the fixed content to a shell command in the container.
                # The shell command writes the content to a temp file and then imports it.
                shell_cmd = "cat > /tmp/workflow_to_import.json && n8n import:workflow --input /tmp/workflow_to_import.json"
                command = [
                    'docker-compose', 'exec', '-T', 'n8n',
                    'bash', '-c', shell_cmd
                ]
                result = subprocess.run(
                    command,
                    input=workflow_content_fixed,
                    capture_output=True, text=True, timeout=30
                )
            else:
                # This path is for non-docker execution and would need a different logic
                # (e.g., saving to a local temp file). We focus on the docker path.
                command = ['npx', 'n8n', 'import:workflow', f'--input={file_path}']
                result = subprocess.run(command, capture_output=True, text=True, timeout=30)

            # Check for success message in stdout, as exit code can be unreliable.
            # "successfully" for single import, "workflows imported" for potential multiple imports in one go.
            if "successfully" in result.stdout or "workflows imported" in result.stdout:
                print(f"✅ Imported: {file_path.name}")
                return True
            else:
                error_msg = result.stderr.strip() or result.stdout.strip()
                self.errors.append(f"Import failed for {file_path.name}: {error_msg}")
                print(f"❌ Failed: {file_path.name}")
                return False
                
        except subprocess.TimeoutExpired:
            self.errors.append(f"Timeout importing {file_path.name}")
            print(f"⏰ Timeout: {file_path.name}")
            return False
        except Exception as e:
            self.errors.append(f"Error importing {file_path.name}: {str(e)}")
            print(f"❌ Error: {file_path.name} - {str(e)}")
            return False

    def get_workflow_files(self) -> List[Path]:
        """Get all workflow JSON files."""
        if not self.workflows_dir.exists():
            print(f"❌ Workflows directory not found: {self.workflows_dir}")
            return []
        
        json_files = list(self.workflows_dir.glob("*.json"))
        if not json_files:
            print(f"❌ No JSON files found in: {self.workflows_dir}")
            return []
        
        return sorted(json_files)

    def import_all(self) -> Dict[str, Any]:
        """Import all workflow files."""
        workflow_files = self.get_workflow_files()
        total_files = len(workflow_files)
        
        if total_files == 0:
            return {"success": False, "message": "No workflow files found"}
        
        print(f"🚀 Starting import of {total_files} workflows...")
        print("-" * 50)
        
        for i, file_path in enumerate(workflow_files, 1):
            print(f"[{i}/{total_files}] Processing {file_path.name}...")
            
            if self.import_workflow(file_path):
                self.imported_count += 1
            else:
                self.failed_count += 1
        
        # Summary
        print("\n" + "=" * 50)
        print(f"📊 Import Summary:")
        print(f"✅ Successfully imported: {self.imported_count}")
        print(f"❌ Failed imports: {self.failed_count}")
        print(f"📁 Total files: {total_files}")
        
        if self.errors:
            print(f"\n❌ Errors encountered:")
            for error in self.errors[:10]:  # Show first 10 errors
                print(f"   • {error}")
            if len(self.errors) > 10:
                print(f"   ... and {len(self.errors) - 10} more errors")
        
        return {
            "success": self.failed_count == 0,
            "imported": self.imported_count,
            "failed": self.failed_count,
            "total": total_files,
            "errors": self.errors
        }


def check_n8n_available(use_docker: bool = False) -> bool:
    """Check if n8n CLI is available."""
    if use_docker:
        command = ['docker-compose', 'exec', '-T', 'n8n', 'n8n', '--version']
    else:
        command = ['npx', 'n8n', '--version']
    try:
        result = subprocess.run(
            command,
            capture_output=True, text=True, timeout=10
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description="N8N Workflow Importer")
    parser.add_argument('--docker', action='store_true', help='Use Docker to run n8n commands')
    args = parser.parse_args()

    # The workflows_dir needs to point to the host path for the script to find the files
    host_workflows_dir = "server/n8n-workflows-main/workflows"

    print("🔧 N8N Workflow Importer")
    print("=" * 40)
    
    # Check if n8n is available
    if not check_n8n_available(use_docker=args.docker):
        print("❌ n8n command failed. Please ensure n8n is running and accessible.")
        if args.docker:
            print("   Ensure 'docker-compose' is in your PATH and the 'n8n' service is running in your docker-compose.yml.")
        else:
            print("   n8n CLI not found. Please install n8n first:")
            print("   npm install -g n8n")
        sys.exit(1)
    
    # Create importer and run
    importer = WorkflowImporter(workflows_dir=host_workflows_dir, use_docker=args.docker)
    result = importer.import_all()
    
    # Exit with appropriate code
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main() 