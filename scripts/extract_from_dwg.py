"""
DWG/DXF CAD 파일에서 밸브 태그를 추출하는 스크립트
"""
import ezdxf
from ezdxf import recover
import json
import csv
import re
from pathlib import Path
from collections import defaultdict

def is_valve_tag(text):
    """밸브/계기 태그인지 확인"""
    text = text.strip().upper()

    if len(text) < 3 or len(text) > 25:
        return False

    # P&ID 도면의 일반적인 태그 패턴
    patterns = [
        r'^[A-Z]{1,3}-\d{3,5}[A-Z]?$',       # V-001, HV-6003, FV-7013A
        r'^[A-Z]{2,3}\d{3,5}$',               # HV6003, FV7013
        r'^\d{3}-[A-Z]-[A-Z]{2}-\d{3}(/\d+)?$',  # 111-M-PP-001, 111-M-PP-001/002
        r'^[A-Z]{2}-\d{4}[A-Z]?$',           # VC-0001, VC-0SM1
        r'^[A-Z]-\d{3,4}[A-Z]?$',            # V-102, K-0001A
        r'^[A-Z]{2,3}-[A-Z]+-\d{3,5}$',      # VC-OSM-001
    ]

    for pattern in patterns:
        if re.match(pattern, text):
            return True

    # 일반적인 밸브/계기 접두사 확인
    prefixes = [
        'V-', 'HV-', 'FV-', 'LV-', 'PV-', 'TV-', 'CV-', 'VC-', 'XV-', 'SV-',
        'PT-', 'FT-', 'LT-', 'TT-', 'AT-',  # 압력, 유량, 레벨, 온도 transmitter
        'PI-', 'FI-', 'LI-', 'TI-',          # Indicator
        'PSV-', 'PRV-', 'BDV-',              # Safety, Relief, Blowdown valve
        'K-', 'M-', 'PP-', 'P-',             # 기타 장비
    ]

    for prefix in prefixes:
        if text.startswith(prefix):
            return True

    return False

def get_valve_type(tag):
    """태그에서 밸브/계기 타입 추출"""
    tag = tag.upper()

    # '-' 기준으로 분리
    if '-' in tag:
        parts = tag.split('-')
        return parts[0]

    # 숫자 전까지의 문자
    match = re.match(r'^([A-Z]+)', tag)
    if match:
        return match.group(1)

    return 'UNKNOWN'

def extract_tags_from_dwg(dwg_path, output_dir):
    """DWG/DXF 파일에서 태그 추출"""
    print(f"Processing file: {dwg_path}")

    try:
        # DXF/DWG 파일 읽기
        if str(dwg_path).lower().endswith('.dxf'):
            doc = ezdxf.readfile(str(dwg_path))
        else:
            doc, auditor = recover.readfile(str(dwg_path))

        print(f"DXF version: {doc.dxfversion}")
        print(f"Entities found: {len(list(doc.modelspace()))}")
    except Exception as e:
        print(f"Error reading file: {e}")
        return []

    valve_tags = []
    found_tags = set()

    # 모델스페이스의 모든 엔티티 검사
    msp = doc.modelspace()

    # TEXT 엔티티
    text_entities = msp.query('TEXT')
    print(f"\nFound {len(text_entities)} TEXT entities")

    for entity in text_entities:
        text = entity.dxf.text.strip()

        if is_valve_tag(text):
            text_upper = text.upper()

            if text_upper in found_tags:
                continue

            found_tags.add(text_upper)

            # 위치 정보
            insert_point = entity.dxf.insert

            valve_info = {
                'tag': text_upper,
                'type': get_valve_type(text_upper),
                'source': 'TEXT',
                'layer': entity.dxf.layer,
                'position': {
                    'x': round(insert_point.x, 2),
                    'y': round(insert_point.y, 2),
                    'z': round(insert_point.z, 2) if hasattr(insert_point, 'z') else 0
                },
                'height': round(entity.dxf.height, 2) if hasattr(entity.dxf, 'height') else 0
            }

            valve_tags.append(valve_info)
            print(f"  Found: {text_upper} at ({insert_point.x:.2f}, {insert_point.y:.2f})")

    # MTEXT 엔티티
    mtext_entities = msp.query('MTEXT')
    print(f"\nFound {len(mtext_entities)} MTEXT entities")

    for entity in mtext_entities:
        text = entity.text.strip()

        if is_valve_tag(text):
            text_upper = text.upper()

            if text_upper in found_tags:
                continue

            found_tags.add(text_upper)

            # 위치 정보
            insert_point = entity.dxf.insert

            valve_info = {
                'tag': text_upper,
                'type': get_valve_type(text_upper),
                'source': 'MTEXT',
                'layer': entity.dxf.layer,
                'position': {
                    'x': round(insert_point.x, 2),
                    'y': round(insert_point.y, 2),
                    'z': round(insert_point.z, 2) if hasattr(insert_point, 'z') else 0
                },
                'height': 0
            }

            valve_tags.append(valve_info)
            print(f"  Found: {text_upper} at ({insert_point.x:.2f}, {insert_point.y:.2f})")

    # 통계
    type_counts = defaultdict(int)
    for tag in valve_tags:
        type_counts[tag['type']] += 1

    print(f"\n{'='*60}")
    print(f"Total tags found: {len(valve_tags)}")
    print(f"\nBreakdown by type:")
    for valve_type, count in sorted(type_counts.items()):
        print(f"  {valve_type}: {count}")

    # JSON 저장
    json_path = output_dir / f"{Path(dwg_path).stem}_tags.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(valve_tags, f, indent=2, ensure_ascii=False)

    # CSV 저장
    csv_path = output_dir / f"{Path(dwg_path).stem}_tags.csv"
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        if valve_tags:
            fieldnames = ['tag', 'type', 'source', 'layer', 'x', 'y', 'z', 'height']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()

            for tag in valve_tags:
                row = {
                    'tag': tag['tag'],
                    'type': tag['type'],
                    'source': tag['source'],
                    'layer': tag['layer'],
                    'x': tag['position']['x'],
                    'y': tag['position']['y'],
                    'z': tag['position']['z'],
                    'height': tag['height']
                }
                writer.writerow(row)

    print(f"\nJSON saved: {json_path}")
    print(f"CSV saved: {csv_path}")

    return valve_tags

def main():
    dwg_path = Path(r"C:\Users\USER\Downloads\1M-PI-111-002  DH HE Condensate System-2rev2.dxf")
    output_dir = Path(r"C:\Users\USER\Downloads\pid-viewer\scripts\output")
    output_dir.mkdir(exist_ok=True)

    if not dwg_path.exists():
        print(f"[ERROR] File not found: {dwg_path}")
        return

    valve_tags = extract_tags_from_dwg(dwg_path, output_dir)

    # 결과 출력
    print(f"\n{'='*60}")
    print("Extracted Tags (sorted by tag name):")
    print(f"{'='*60}")
    for tag in sorted(valve_tags, key=lambda x: x['tag']):
        print(f"{tag['tag']:20} | Type: {tag['type']:10} | Position: ({tag['position']['x']:8.2f}, {tag['position']['y']:8.2f})")

if __name__ == "__main__":
    main()
