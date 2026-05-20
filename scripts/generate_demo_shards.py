"""
Generate demo JSON shards for local testing.
Usage:
  python scripts/generate_demo_shards.py --shards 3 --per-shard 200 --out data/shards/

This will create numbered shard files with synthetic product entries.
"""
import os
import json
import argparse
from random import choice, randint

BRANDS = ['RB Medical', 'RB Luxe', 'Comfort Line', 'MediLux', 'Acme Medical']
CATEGORIES = ['Hospital Beds','Oxygen Concentrators','Surgical Sets','Hotel Linen','Kitchen Equipment']
MATERIALS = ['316L Stainless Steel','Top-grain Leather','Long-staple Cotton','Powder-coated Steel']
GRADES = ['Commercial','Medical','Industrial','Premium']

def make_item(global_index):
    pid = f'P{global_index:07d}'
    title = f"{choice(CATEGORIES)} Model {randint(100,999)}"
    brand = choice(BRANDS)
    category = choice(CATEGORIES)
    material = choice(MATERIALS)
    grade = choice(GRADES)
    durability = choice(['High','Medium','Very High'])
    return {
        'id': pid,
        'title': title,
        'brand': brand,
        'category': category,
        'material': material,
        'grade': grade,
        'durability': durability,
        'image': '/public/assets/brands/placeholder.jpg'
    }

def main(shards, per_shard, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    global_index = 1000000
    created = []
    for s in range(shards):
        items = []
        for i in range(per_shard):
            global_index += 1
            items.append(make_item(global_index))
        fname = os.path.join(out_dir, f'demo-shard-{s:03d}.json')
        shard = { 'shard': f'demo-{s:03d}', 'items': items }
        with open(fname, 'w', encoding='utf-8') as f:
            json.dump(shard, f, ensure_ascii=False)
        created.append(fname)
    print('Wrote', len(created), 'shards to', out_dir)

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--shards', type=int, default=3)
    p.add_argument('--per-shard', type=int, default=200)
    p.add_argument('--out', dest='out_dir', default='data/shards')
    ns = p.parse_args()
    main(ns.shards, ns.per_shard, ns.out_dir)
