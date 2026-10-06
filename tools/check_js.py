import os
import re

print("Checking imports in assets/js...")
errors = 0
for root, dirs, files in os.walk('assets/js'):
    for f in files:
        if f.endswith('.js'):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as fp:
                content = fp.read()
            imports = re.findall(r'from\s+[\'"]([^\'"]+)[\'"]', content)
            for imp in imports:
                rel_dir = os.path.dirname(p)
                imp_clean = imp.split('?')[0]
                target = os.path.normpath(os.path.join(rel_dir, imp_clean))
                if not os.path.exists(target):
                    print(f"MISSING IMPORT in {p}: {imp} -> {target}")
                    errors += 1

print(f"Import check finished with {errors} missing imports.")
