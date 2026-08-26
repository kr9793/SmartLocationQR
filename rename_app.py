import os
import glob

files = glob.glob('*.html') + ['manifest.json']

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the text
    new_content = content.replace('Smart Location QR', 'iSmartComp Connect')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

print(f"Updated {len(files)} files.")
