
import re

with open('c:/Users/ASUS/Downloads/lev-echad---shidduch-connect/components/ShadchanDashboard.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def count_in_range(start, end):
    stack = 0
    for i in range(start-1, end):
        line = lines[i]
        line = re.sub(r'\{/\*.*?\*/\}', '', line)
        opens = len(re.findall(r'<div[\s>]', line))
        closes = len(re.findall(r'</div[\s>]', line))
        stack += opens - closes
    return stack

print(f"Total range 1-1986: {count_in_range(1, 1986)}")
print(f"Range 1-958 (Before Profiles): {count_in_range(1, 958)}")
print(f"Range 959-1801 (Profiles view): {count_in_range(959, 1801)}")
print(f"Range 1802-1869 (Manual Match): {count_in_range(1802, 1869)}")
print(f"Range 1870-1986 (Messages and end): {count_in_range(1870, 1986)}")
