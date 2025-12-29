
import re

with open('c:/Users/ASUS/Downloads/lev-echad---shidduch-connect/components/ShadchanDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = 0
for i, line in enumerate(lines):
    # Match <div or <div with space or newline
    opens = len(re.findall(r'<div[\s>]', line))
    # Match </div with space or newline
    closes = len(re.findall(r'</div[\s>]', line))
    stack += opens - closes
    if stack < 0:
        print(f"Stack underflow at line {i+1}: {line.strip()}")
        break
print(f"Final stack: {stack}")
