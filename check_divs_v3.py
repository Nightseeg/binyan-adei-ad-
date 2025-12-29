
import re

with open('c:/Users/ASUS/Downloads/lev-echad---shidduch-connect/components/ShadchanDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def clean_line(line):
    # Remove strings
    line = re.sub(r'".*?"', '""', line)
    line = re.sub(r"'.*?'", "''", line)
    # Remove comments
    line = re.sub(r'\{/\*.*?\*/\}', '', line)
    return line

stack = 0
for i, line in enumerate(lines):
    cleaned = clean_line(line)
    opens = len(re.findall(r'<div[\s>]', cleaned))
    closes = len(re.findall(r'</div[\s>]', cleaned))
    if opens != closes:
        stack += opens - closes
        print(f"Line {i+1:4}: Stack {stack:2} | {line.strip()[:60]}")

print(f"Final stack: {stack}")
