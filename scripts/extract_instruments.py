#!/usr/bin/env python3
"""
PDF P&ID 도면에서 계기류(Instruments) 태그를 추출하는 스크립트
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
OUTPUT_PATH = r"C:\Users\USER\Downloads\pid-viewer\public\data\all_instruments.json"

# 계기류 타입 (순서 중요 - 긴 것부터 매칭해야 함)
INSTRUMENT_TYPES = [
    # 4글자 타입 먼저
    'TSHH', 'TSLL', 'PSHH', 'PSLL', 'LSHH', 'LSLL', 'PDIC',
    # 3글자 타입
    'TIC', 'TCV', 'TSH', 'TSL', 'TAH', 'TAL', 'TIT', 'TWT',
    'PIC', 'PCV', 'PSH', 'PSL', 'PAH', 'PAL', 'PDI', 'PDT', 'PIT', 'PSV', 'PRV',
    'FIC', 'FCV', 'FSH', 'FSL', 'FAH', 'FAL', 'FQI', 'FIT',
    'LIC', 'LCV', 'LSH', 'LSL', 'LAH', 'LAL', 'LIT',
    'AIC', 'ASH', 'ASL', 'AIT',
    'ZIC', 'ZSH', 'ZSL', 'ZSC', 'ZSO', 'ZIT', 'ZIF', 'ZTF',
    'SIC', 'SSH', 'SSL',
    'HIC',
    'YIC',
    # 2글자 타입
    'TI', 'TE', 'TT', 'TC', 'TR', 'TW', 'TS',
    'PI', 'PE', 'PT', 'PC', 'PR', 'PG', 'PS',
    'FI', 'FE', 'FT', 'FC', 'FR', 'FQ', 'FO', 'FY', 'FS',
    'LI', 'LE', 'LT', 'LC', 'LR', 'LG', 'LS',
    'AI', 'AE', 'AT', 'AC', 'AR', 'AS',
    'ZI', 'ZT',
    'VI', 'VT',
    'SI', 'ST', 'SC',
    'II', 'IT', 'JI', 'JT', 'WI', 'WT',
    'HI', 'HS',
    'XI', 'XT', 'XY', 'YI', 'YT',
    'UI', 'UT', 'NI', 'NT', 'QI', 'QT', 'RI', 'RT',
]

def extract_tags_from_pdf(pdf_path):
    """PDF에서 모든 계기류 태그를 추출 (위치 정보 포함)"""
    tags = []

    try:
        doc = fitz.open(pdf_path)

        for page_num in range(len(doc)):
            page = doc[page_num]
            page_rect = page.rect  # 페이지 크기 (좌표 -> 퍼센트 변환용)
            text = page.get_text()

            # 줄바꿈을 공백으로 치환해서 연속된 태그도 찾을 수 있게
            text_normalized = re.sub(r'\s+', ' ', text)

            for inst_type in INSTRUMENT_TYPES:
                # 패턴 1: TI-1234, TI 1234, TI1234 형식 (하이픈, 공백, 또는 직접 연결)
                patterns = [
                    rf'\b({inst_type})[-\s]?(\d{{3,5}}[A-Z]?(?:[-/]\d{{1,2}})?)\b',  # TI-1234, TI 1234, TI1234
                    rf'\b({inst_type})\s+(\d{{3,5}}[A-Z]?)\b',  # TI   1234 (여러 공백)
                ]

                for pattern in patterns:
                    matches = re.findall(pattern, text_normalized, re.IGNORECASE)

                    for match in matches:
                        tag_type = match[0].upper()
                        tag_num = match[1].upper()

                        # 태그 번호가 너무 짧거나 문서 번호 같은 것 제외
                        if len(tag_num) < 3:
                            continue

                        # 도면 번호 패턴 제외 (예: PI-111, PI-054 등)
                        if tag_num.startswith('0') and len(tag_num) == 3:
                            continue
                        if tag_num in ['111', '054', '116', '228', '251', '253', '262', '263', '264', '313', '321', '323', '335', '342', '351', '359', '391', '611']:
                            continue

                        full_tag = f"{tag_type}-{tag_num}"

                        # 중복 체크
                        if full_tag not in [t['tag'] for t in tags]:
                            # 위치 정보 검색 - 태그 텍스트의 위치 찾기
                            position = None

                            # 여러 검색 패턴 시도
                            search_patterns = [
                                f"{tag_type}-{tag_num}",  # TI-1234
                                f"{tag_type} {tag_num}",  # TI 1234
                                f"{tag_type}{tag_num}",   # TI1234
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
                                'category': get_category(tag_type)
                            }

                            if position:
                                tag_data['position'] = position

                            tags.append(tag_data)

        doc.close()

    except Exception as e:
        print(f"Error processing {pdf_path}: {e}")

    return tags

def get_category(inst_type):
    """계기 타입에 따른 카테고리 반환"""
    # 안전밸브 (PSV, PRV) - 별도 카테고리
    if inst_type in ['PSV', 'PRV']:
        return 'Safety Valve'
    elif inst_type.startswith('T') and inst_type not in ['TCV']:
        return 'Temperature'
    elif inst_type.startswith('P') and inst_type not in ['PCV']:
        return 'Pressure'
    elif inst_type.startswith('F') and inst_type not in ['FCV']:
        return 'Flow'
    elif inst_type.startswith('L') and inst_type not in ['LCV']:
        return 'Level'
    elif inst_type.startswith('A'):
        return 'Analysis'
    elif inst_type.startswith('Z'):
        return 'Position'
    elif inst_type.startswith('V'):
        return 'Vibration'
    elif inst_type.startswith('S'):
        return 'Speed'
    elif inst_type in ['II', 'IT', 'JI', 'JT', 'WI', 'WT']:
        return 'Electrical'
    elif inst_type.startswith('H'):
        return 'Hand/Manual'
    elif inst_type in ['TCV', 'FCV', 'PCV', 'LCV']:
        return 'Control Valve'
    else:
        return 'Other'

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
    print("P&ID PDF에서 계기류 태그 추출 시작")
    print("=" * 60)

    all_instruments = []
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
            existing = next((t for t in all_instruments if t['tag'] == tag['tag'] and t['drawing'] == tag['drawing']), None)
            if not existing:
                all_instruments.append(tag)

        if tags:
            print(f"   -> {len(tags)}개 태그 추출됨")

    # 태그별로 정렬
    all_instruments.sort(key=lambda x: (x['category'], x['tag']))

    # 통계 출력
    print("\n" + "=" * 60)
    print("추출 완료! 통계:")
    print("=" * 60)

    category_counts = defaultdict(int)
    type_counts = defaultdict(int)

    for inst in all_instruments:
        category_counts[inst['category']] += 1
        type_counts[inst['type']] += 1

    print("\n카테고리별 개수:")
    for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {count}")

    print("\n타입별 개수 (상위 30개):")
    for typ, count in sorted(type_counts.items(), key=lambda x: -x[1])[:30]:
        print(f"  {typ}: {count}")

    print(f"\n총 계기류 태그: {len(all_instruments)}개")

    # JSON 파일로 저장
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(all_instruments, f, ensure_ascii=False, indent=2)

    print(f"\n저장 완료: {OUTPUT_PATH}")

    return all_instruments

if __name__ == "__main__":
    main()
