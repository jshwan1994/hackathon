#!/usr/bin/env python3
"""
밸브 데이터, 계기류 데이터, 장비류 데이터를 통합하는 스크립트
"""

import json
from pathlib import Path

DATA_PATH = Path(r"C:\Users\USER\Downloads\pid-viewer\public\data")

def main():
    # 기존 밸브 데이터 로드
    with open(DATA_PATH / "all_valves.json", 'r', encoding='utf-8') as f:
        valves = json.load(f)

    # 계기류 데이터 로드
    with open(DATA_PATH / "all_instruments.json", 'r', encoding='utf-8') as f:
        instruments = json.load(f)

    print(f"밸브 개수: {len(valves)}")
    print(f"계기류 개수: {len(instruments)}")

    # 밸브 데이터에 category 추가 (PSV/PRV는 Safety Valve로 분류)
    for valve in valves:
        tag = valve.get('tag', '')
        if tag.startswith('PSV') or tag.startswith('PRV'):
            valve['category'] = 'Safety Valve'
            valve['type'] = 'PSV' if tag.startswith('PSV') else 'PRV'
        else:
            valve['category'] = 'Valve'

    # 통합 데이터 생성 (밸브 + 계기류만)
    all_components = valves + instruments

    # 중복 제거 (tag + drawing 기준)
    seen = set()
    unique_components = []
    for comp in all_components:
        key = (comp['tag'], comp.get('drawing', ''))
        if key not in seen:
            seen.add(key)
            unique_components.append(comp)

    print(f"통합 후 (중복 제거): {len(unique_components)}")

    # 태그 기준 정렬
    unique_components.sort(key=lambda x: x['tag'])

    # 저장
    output_path = DATA_PATH / "all_components.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(unique_components, f, ensure_ascii=False, indent=2)

    print(f"\n저장 완료: {output_path}")

    # 통계
    categories = {}
    for comp in unique_components:
        cat = comp.get('category', 'Unknown')
        categories[cat] = categories.get(cat, 0) + 1

    print("\n카테고리별 개수:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")

if __name__ == "__main__":
    main()
