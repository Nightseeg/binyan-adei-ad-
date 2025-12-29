
import re

with open('c:/Users/ASUS/Downloads/lev-echad---shidduch-connect/components/ShadchanDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def clean_line(line):
    line = re.sub(r'\{/\*.*?\*/\}', '', line)
    return line

stack = 0
for i, line in enumerate(lines):
    cleaned = clean_line(line)
    # Match <div (excluding <div> in strings if any)
    opens = len(re.findall(r'<div[\s>]', cleaned))
    # Match </div
    closes = len(re.findall(r'</div[\s>]', cleaned))
    
    stack += opens - closes
    if stack < 0:
        print(f"Line {i+1:4}: Stack dropped below 0! Current: {stack} | {line.strip()[:60]}")
        # Reset just to see if it happens again
        stack = 0

print(f"Final stack: {stack}")
