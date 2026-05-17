from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
src = root / "data" / "brands.js"
lines = src.read_text(encoding="utf-8").splitlines()
start = next(i for i, l in enumerate(lines) if l.strip() == "const PRODUCTS = [")
end = next(i for i in range(start, len(lines)) if lines[i].strip() == "];")
block = "\n".join(lines[start:end + 1])
# Strip const PRODUCTS = and trailing ;
inner = block.replace("const PRODUCTS = ", "", 1).strip()
if inner.endswith(";"):
    inner = inner[:-1]
products = json.loads(inner)
out = root / "data" / "products-appliances.js"
out.write_text(
    "/** RB Store — Home & kitchen appliance catalog */\nconst PRODUCTS_APPLIANCES = "
    + json.dumps(products, indent=2, ensure_ascii=False)
    + ";\n",
    encoding="utf-8",
)
print(f"Exported {len(products)} appliance products")
