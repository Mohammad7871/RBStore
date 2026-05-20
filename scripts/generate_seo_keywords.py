"""
Generate SEO keyword phrases for a large product catalog (1,000,000 items).
This is a scalable skeleton that reads product metadata (CSV/JSON), applies templates,
and writes keyword bundles per item. Designed to run with multiprocessing.

Usage:
  python generate_seo_keywords.py --input data/shards/ --output data/meta/keywords/
"""
import os
import json
import argparse
from multiprocessing import Pool, cpu_count

TEMPLATES = [
    "{brand} {title} for hospitals in {city}",
    "Wholesale {title} bulk supplier - {brand}",
    "B2B {category} for hotels and hospitals - {brand}",
    "{title} {material} grade {grade} - enterprise procurement",
]

def generate_for_product(product, cities=None):
    cities = cities or ["Pakistan"]
    keywords = set()
    for tpl in TEMPLATES:
        for city in cities:
            kw = tpl.format(
                brand=product.get('brand','RB Premium'),
                title=product.get('title','').replace('\n',' ').strip(),
                category=product.get('category','Product'),
                material=product.get('material',''),
                grade=product.get('grade','Commercial'),
                city=city
            )
            keywords.add(kw)
    return list(keywords)

def process_shard(path_tuple):
    shard_path, out_dir = path_tuple
    out_path = os.path.join(out_dir, os.path.basename(shard_path) + '.keywords.json')
    keywords_map = {}
    with open(shard_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        items = data.get('items', [])
        for item in items:
            keywords_map[item.get('id')] = generate_for_product(item, cities=['Karachi','Lahore','Islamabad','Multan'])
    with open(out_path, 'w', encoding='utf-8') as of:
        json.dump(keywords_map, of, ensure_ascii=False)
    return out_path

def main(input_dir, output_dir, workers=None):
    if not os.path.exists(output_dir): os.makedirs(output_dir, exist_ok=True)
    shards = [os.path.join(input_dir, f) for f in os.listdir(input_dir) if f.endswith('.json')]
    args = [(s, output_dir) for s in shards]
    workers = workers or max(1, cpu_count() - 1)
    with Pool(workers) as p:
        results = p.map(process_shard, args)
    print('Wrote keyword files:', results)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True, help='Input shards directory')
    parser.add_argument('--output', required=True, help='Output keywords directory')
    parser.add_argument('--workers', type=int, default=4)
    ns = parser.parse_args()
    main(ns.input, ns.output, ns.workers)
