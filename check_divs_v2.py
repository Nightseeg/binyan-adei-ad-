
import re

with open('c:/Users/ASUS/Downloads/lev-echad---shidduch-connect/components/ShadchanDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = 0
for i, line in enumerate(lines):
    # Ignore comments
    line = re.sub(r'\{/\*.*?\*/\}', '', line)
    opens = len(re.findall(r'<div[\s>]', line))
    closes = len(re.findall(r'</div[\s>]', line))
    new_stack = stack + opens - closes
    if new_stack != stack:
        print(f"Line {i+1}: {stack} -> {new_stack} | {line.strip()[:100]}")
    stack = new_stack
    if stack < 0:
        print(f"!!! Underflow at line {i+1}")
        # stack = 0 # reset to continue finding more 
print(f"Final stack: {stack}")
