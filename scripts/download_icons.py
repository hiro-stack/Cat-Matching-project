import os
import requests
import re

def pascal_to_kebab(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1-\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1-\2', s1).lower()

icons = [
    "ArrowLeft", "ArrowRight", "Send", "User", "Home", "Phone", "Mail", "MapPin",
    "CheckCircle2", "XCircle", "MessageCircle", "MessageSquare", "Clock", "ExternalLink",
    "ChevronRight", "Trash2", "FileText", "Save", "Globe", "Heart", "Twitter", "Upload",
    "X", "Info", "Lock", "Eye", "Camera", "Package", "Search", "Filter", "Play", "Image",
    "Activity", "Stethoscope", "Calendar", "AlertCircle", "AlertTriangle", "CheckCircle",
    "ShieldCheck", "ShieldAlert", "Users", "Plus", "Edit", "Edit2", "Crown", "Briefcase",
    "ClipboardList", "Bell"
]

base_url = "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/"
output_dir = "docs/assets/icons"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

print(f"Downloading {len(icons)} icons...")

for icon in icons:
    # Lucide handles 2, 3, etc at the end differently in some cases, but mostly it's name-2
    kebab_name = pascal_to_kebab(icon)
    
    # Special cases for Lucide repo naming if any (usually PascalCase to kebab-case works)
    # Check if icon has a number at the end and it's handled differently
    # e.g., CheckCircle2 -> check-circle-2
    
    url = f"{base_url}{kebab_name}.svg"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            with open(os.path.join(output_dir, f"{kebab_name}.svg"), 'wb') as f:
                f.write(response.content)
            print(f"Success: {icon} -> {kebab_name}.svg")
        else:
            print(f"Failed: {icon} (Status: {response.status_code}) URL: {url}")
    except Exception as e:
        print(f"Error downloading {icon}: {e}")

print("Download complete.")
