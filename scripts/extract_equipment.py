#!/usr/bin/env python3
"""
PDF P&ID 도면에서 장비류(Equipment) 태그를 추출하는 스크립트
- PP (Pump): 펌프
- TK (Tank): 탱크
- HE (Heat Exchanger): 열교환기
- M (Motor): 모터
- B (Blower): 블로워
- E (Equipment): 일반 장비
- C (Compressor): 압축기
- FN (Fan): 팬
"""

import fitz  # PyMuPDF
import re
import json
import os
from pathlib import Path
from collections import defaultdict

# PDF 폴더 경로
PDF_FOLDER = r"C:\Users\USER\OneDrive - GS에너지\바탕 화면\GS 곤 자료\2025년\도면\2026.01.22 이상윤 캐드변환 (지역난방,미래엔)"

# 출력 경로
OUTPUT_PATH = r"C:\Users\USER\Downloads\pid-viewer\public\data\all_equipment.json"

# 장비 타입 정의 (긴 것부터 매칭)
EQUIPMENT_TYPES = [
    # 펌프 관련
    'PP',   # Pump
    # 탱크 관련
    'TK',   # Tank
    # 열교환기 관련
    'HE',   # Heat Exchanger
    # 모터 관련
    'M',    # Motor
    # 블로워 관련
    'B',    # Blower
    # 압축기 관련
    'C',    # Compressor
    # 팬 관련
    'FN',   # Fan
    # 일반 장비
    'E',    # Equipment
]

# 장비 타입별 카테고리 매핑
EQUIPMENT_CATEGORIES = {
    'PP': 'Pump',
    'TK': 'Tank',
    'HE': 'Heat Exchanger',
    'M': 'Motor',
    'B': 'Blower',
    'C': 'Compressor',
    'FN': 'Fan',
    'E': 'Equipment',
}


def extract_tags_from_pdf(pdf_path):
    """PDF에서 모든 장비 태그를 추출 (위치 정보 포함)"""
    tags = []

    try:
        doc = fitz.open(pdf_path)

        for page_num in range(len(doc)):
            page = doc[page_num]
            page_rect = page.rect  # 페이지 크기 (좌표 -> 퍼센트 변환용)
            text = page.get_text()

            # 줄바꿈을 공백으로 치환해서 연속된 태그도 찾을 수 있게
            text_normalized = re.sub(r'\s+', ' ', text)

            for equip_type in EQUIPMENT_TYPES:
                # 장비 태그 패턴: PP-1234, PP 1234, PP1234, PP-1234A, PP-1234/1 등
                patterns = [
                    rf'\b({equip_type})[-\s]?(\d{{3,5}}[A-Z]?(?:[-/]\d{{1,2}})?)\b',
                    rf'\b({equip_type})\s+(\d{{3,5}}[A-Z]?)\b',
                ]

                for pattern in patterns:
                    matches = re.findall(pattern, text_normalized, re.IGNORECASE)

                    for match in matches:
                        tag_type = match[0].upper()
                        tag_num = match[1].upper()

                        # 태그 번호가 너무 짧으면 제외
                        if len(tag_num) < 3:
                            continue

                        # 도면 번호 패턴 제외 (예: M-PI-111 등)
                        if tag_num.startswith('0') and len(tag_num) == 3:
                            continue
                        # 일반적인 도면 번호 제외
                        if tag_num in ['111', '054', '116', '228', '251', '253', '262', '263', '264', '313', '321', '323', '335', '342', '351', '359', '391', '611']:
                            continue

                        full_tag = f"{tag_type}-{tag_num}"

                        # 중복 체크
                        if full_tag not in [t['tag'] for t in tags]:
                            # 위치 정보 검색 - 태그 텍스트의 위치 찾기
                            position = None

                            # 여러 검색 패턴 시도
                            search_patterns = [
                                f"{tag_type}-{tag_num}",  # PP-1234
                                f"{tag_type} {tag_num}",  # PP 1234
                                f"{tag_type}{tag_num}",   # PP1234
                            ]

                            for search_text in search_patterns:
                                rects = page.search_for(search_text)
                                if rects:
                                    # 첫 번째 매칭 위치 사용
                                    rect = rects[0]
                                    # 중심점을 퍼센트로 변환
                                    x_percent = round(((rect.x0 + rect.x1) / 2) / page_rect.width * 100, 1)
                                    y_percent = round(((rect.y0 + rect.y1) / 2) / page_rect.height * 100, 1)
                                    position = {
                                        'x_percent': x_percent,
                                        'y_percent': y_percent
                                    }
                                    break

                            tag_data = {
                                'tag': full_tag,
                                'type': tag_type,
                                'category': EQUIPMENT_CATEGORIES.get(tag_type, 'Equipment')
                            }

                            if position:
                                tag_data['position'] = position

                            tags.append(tag_data)

        doc.close()

    except Exception as e:
        print(f"Error processing {pdf_path}: {e}")

    return tags


def get_drawing_name(pdf_filename):
    """PDF 파일명에서 도면명 추출"""
    name = pdf_filename.replace('.pdf', '')
    png_name = name.replace('  ', '-').replace(' ', '-') + '.png'
    return png_name


def get_location_from_filename(filename):
    """파일명에서 위치/시스템명 추출"""
    name = filename.replace('.pdf', '').replace('.png', '')

    # 숫자-문자 패턴 이후의 텍스트를 위치로 사용
    match = re.search(r'\d[M-]-PI-\d+-\d+\s*(.+)', name)
    if match:
        return match.group(1).strip()

    return name


def main():
    print("=" * 60)
    print("P&ID PDF에서 장비류 태그 추출 시작")
    print("=" * 60)

    all_equipment = []
    pdf_folder = Path(PDF_FOLDER)

    # PDF 파일 목록
    pdf_files = list(pdf_folder.glob("*.pdf"))
    print(f"\n총 {len(pdf_files)}개 PDF 파일 발견\n")

    # 각 PDF에서 태그 추출
    for i, pdf_path in enumerate(pdf_files):
        print(f"[{i+1}/{len(pdf_files)}] {pdf_path.name} 처리 중...")

        tags = extract_tags_from_pdf(pdf_path)

        # 도면 정보 추가
        drawing_name = get_drawing_name(pdf_path.name)
        location = get_location_from_filename(pdf_path.name)

        for tag in tags:
            tag['drawing'] = drawing_name
            tag['location'] = location

            # 중복 체크 후 추가 (같은 태그가 여러 도면에 있을 수 있음)
            existing = next((t for t in all_equipment if t['tag'] == tag['tag'] and t['drawing'] == tag['drawing']), None)
            if not existing:
                all_equipment.append(tag)

        if tags:
            print(f"   -> {len(tags)}개 태그 추출됨")

    # 태그별로 정렬
    all_equipment.sort(key=lambda x: (x['category'], x['tag']))

    # 통계 출력
    print("\n" + "=" * 60)
    print("추출 완료! 통계:")
    print("=" * 60)

    category_counts = defaultdict(int)
    type_counts = defaultdict(int)
    position_count = 0

    for equip in all_equipment:
        category_counts[equip['category']] += 1
        type_counts[equip['type']] += 1
        if 'position' in equip:
            position_count += 1

    print("\n카테고리별 개수:")
    for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")

    print("\n타입별 개수:")
    for typ, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {typ}: {count}")

    print(f"\n총 장비 태그: {len(all_equipment)}개")
    print(f"위치 정보 있는 태그: {position_count}개 ({position_count/len(all_equipment)*100:.1f}%)")

    # JSON 파일로 저장
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(all_equipment, f, ensure_ascii=False, indent=2)

    print(f"\n저장 완료: {OUTPUT_PATH}")

    return all_equipment


if __name__ == "__main__":
    main()
