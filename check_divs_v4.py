
import re

with open('c:/Users/ASUS/Downloads/lev-echad---shidduch-connect/components/ShadchanDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def clean_line(line):
    line = re.sub(r'\{/\*.*?\*/\}', '', line)
    return line

stack = 0
for i, line in enumerate(lines):
    cleaned = clean_line(line)
    opens = len(re.findall(r'<div[\s>]', cleaned))
    closes = len(re.findall(r'</div[\s>]', cleaned))
    if opens != closes:
        stack += opens - closes
    if stack < 0:
        print(f"!!! Underflow at line {i+1}")
    
    # Check for unclosed fragments or other tags if needed
    # but let's stick to divs for now.

print(f"Final stack: {stack}")
