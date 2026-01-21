"""
PDF에서 추출한 좌표를 PNG 이미지 좌표로 변환
"""
import json
from pathlib import Path

def main():
    # PDF 위치 데이터 로드
    pdf_data_path = Path(r"C:\Users\USER\Downloads\pid-viewer\scripts\output\valve_positions_from_pdf.json")
    with open(pdf_data_path, 'r', encoding='utf-8') as f:
        pdf_data = json.load(f)

    # DXF 추출 데이터 로드 (타입, 레이어 정보)
    dxf_data_path = Path(r"C:\Users\USER\Downloads\pid-viewer\scripts\output\1M-PI-111-002  DH HE Condensate System-2rev2_tags.json")
    with open(dxf_data_path, 'r', encoding='utf-8') as f:
        dxf_data = json.load(f)

    # DXF 데이터를 태그별로 인덱싱
    dxf_by_tag = {item['tag']: item for item in dxf_data}

    # 변환된 데이터 생성
    converted_data = []

    for valve in pdf_data['valves']:
        tag = valve['tag']

        # 불완전한 태그 스킵 (VL- 같은 것)
        if len(tag) < 4:
            continue

        # DXF 데이터에서 추가 정보 가져오기
        dxf_info = dxf_by_tag.get(tag, {})

        # PDF Y축 반전 (PDF는 아래->위, 이미지는 위->아래)
        x_percent = round(valve['percent'][0], 2)
        y_percent = round(100 - valve['percent'][1], 2)  # Y축 반전

        converted_valve = {
            'tag': tag,
            'type': dxf_info.get('type', tag.split('-')[0] if '-' in tag else 'UNKNOWN'),
            'drawing': 'DH-Live-Condensate-System.png',
            'location': 'DH Live Condensate System',
            'position': {
                'x_percent': x_percent,
                'y_percent': y_percent
            },
            'pdf_position': {
                'x': valve['center'][0],
                'y': valve['center'][1]
            },
            'layer': dxf_info.get('layer', 'TEXT')
        }

        # CAD 위치도 포함 (있으면)
        if 'position' in dxf_info:
            converted_valve['cad_position'] = dxf_info['position']

        converted_data.append(converted_valve)
        print(f"  {tag:20} | PDF: ({valve['percent'][0]:6.2f}%, {valve['percent'][1]:6.2f}%) -> PNG: ({x_percent:6.2f}%, {y_percent:6.2f}%)")

    # 출력 경로
    output_path = Path(r"C:\Users\USER\Downloads\pid-viewer\public\data\valve_data_new.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # JSON으로 저장
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(converted_data, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*60}")
    print(f"변환 완료!")
    print(f"총 밸브: {len(converted_data)}개")
    print(f"저장됨: {output_path}")

    # VC-0581 확인
    vc_0581 = [v for v in converted_data if v['tag'] == 'VC-0581']
    if vc_0581:
        v = vc_0581[0]
        print(f"\nVC-0581 최종 위치: ({v['position']['x_percent']}%, {v['position']['y_percent']}%)")

if __name__ == "__main__":
    main()
