function rebrandEngine(item) {
  // Replace original brand with RB-branded enterprise names.
  const out = Object.assign({}, item);
  if (!out.original_brand) out.original_brand = "RB Supplier";
  // Simple deterministic rule: hospital -> RB Imperial, hotel -> RB Elite
  if (out.industry === "hospital") out.original_brand = "RB Imperial";
  else if (out.industry === "hotel") out.original_brand = "RB Elite";
  else out.original_brand = "RB Imperial";
  return out;
}

export { rebrandEngine };
