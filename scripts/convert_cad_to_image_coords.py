"""
CAD 좌표를 이미지 좌표(퍼센트)로 변환하는 스크립트
"""
import json
from pathlib import Path
from PIL import Image
import ezdxf

def get_dwg_bounds(dwg_path):
    """DXF 파일의 실제 도면 경계 계산"""
    doc = ezdxf.readfile(str(dwg_path))
    msp = doc.modelspace()

    all_x = []
    all_y = []

    # 모든 엔티티의 좌표 수집
    for entity in msp:
        try:
            if entity.dxftype() == 'LINE':
                all_x.extend([entity.dxf.start.x, entity.dxf.end.x])
                all_y.extend([entity.dxf.start.y, entity.dxf.end.y])
            elif entity.dxftype() in ['TEXT', 'MTEXT']:
                all_x.append(entity.dxf.insert.x)
                all_y.append(entity.dxf.insert.y)
            elif entity.dxftype() == 'CIRCLE':
                cx, cy, r = entity.dxf.center.x, entity.dxf.center.y, entity.dxf.radius
                all_x.extend([cx - r, cx + r])
                all_y.extend([cy - r, cy + r])
            elif entity.dxftype() == 'ARC':
                cx, cy, r = entity.dxf.center.x, entity.dxf.center.y, entity.dxf.radius
                all_x.extend([cx - r, cx + r])
                all_y.extend([cy - r, cy + r])
            elif entity.dxftype() == 'LWPOLYLINE':
                for point in entity.get_points():
                    all_x.append(point[0])
                    all_y.append(point[1])
        except:
            continue

    return {
        'min_x': min(all_x),
        'max_x': max(all_x),
        'min_y': min(all_y),
        'max_y': max(all_y)
    }

def convert_cad_to_image_percent(cad_x, cad_y, bounds, image_width, image_height):
    """CAD 좌표를 이미지 퍼센트 좌표로 변환 (90도 회전 고려)"""
    # CAD 좌표 범위
    cad_width = bounds['max_x'] - bounds['min_x']
    cad_height = bounds['max_y'] - bounds['min_y']

    # 정규화 (0-1 범위)
    norm_x = (cad_x - bounds['min_x']) / cad_width if cad_width > 0 else 0
    norm_y = (cad_y - bounds['min_y']) / cad_height if cad_height > 0 else 0

    # CAD Y를 이미지 X로, CAD X를 이미지 Y로 매핑 (좌우반전 포함)
    rotated_x = norm_y
    rotated_y = 1 - norm_x  # X축 반전

    # 퍼센트로 변환
    x_percent = rotated_x * 100
    y_percent = rotated_y * 100

    return round(x_percent, 2), round(y_percent, 2)

def main():
    # 입력 파일
    dxf_path = Path(r"C:\Users\USER\Downloads\1M-PI-111-002  DH HE Condensate System-2rev2.dxf")
    json_path = Path(r"C:\Users\USER\Downloads\pid-viewer\scripts\output\1M-PI-111-002  DH HE Condensate System-2rev2_tags.json")
    image_path = Path(r"C:\Users\USER\Downloads\pid-viewer\public\drawings\DH-Live-Condensate-System.png")
    output_path = Path(r"C:\Users\USER\Downloads\pid-viewer\public\data\valve_data_new.json")

    # JSON 파일 읽기
    with open(json_path, 'r', encoding='utf-8') as f:
        valve_tags = json.load(f)

    print(f"Loaded {len(valve_tags)} valve tags from CAD file")

    # DXF 파일에서 전체 도면 경계 계산
    bounds = get_dwg_bounds(dxf_path)
    print(f"\nFull drawing bounds from DXF:")
    print(f"  X: {bounds['min_x']:.2f} to {bounds['max_x']:.2f}")
    print(f"  Y: {bounds['min_y']:.2f} to {bounds['max_y']:.2f}")

    # 이미지 크기 확인
    img = Image.open(image_path)
    img_width, img_height = img.size
    print(f"\nImage size: {img_width} x {img_height}")

    # 변환된 데이터 생성
    converted_data = []

    for tag in valve_tags:
        cad_x = tag['position']['x']
        cad_y = tag['position']['y']

        # 이미지 퍼센트 좌표로 변환
        x_percent, y_percent = convert_cad_to_image_percent(
            cad_x, cad_y, bounds, img_width, img_height
        )

        converted_tag = {
            'tag': tag['tag'],
            'type': tag['type'],
            'drawing': 'DH-Live-Condensate-System.png',
            'location': 'DH Live Condensate System',
            'position': {
                'x_percent': x_percent,
                'y_percent': y_percent
            },
            'cad_position': {
                'x': cad_x,
                'y': cad_y,
                'z': tag['position']['z']
            },
            'layer': tag['layer']
        }

        converted_data.append(converted_tag)
        print(f"  {tag['tag']:20} | CAD: ({cad_x:7.2f}, {cad_y:7.2f}) -> Image: ({x_percent:6.2f}%, {y_percent:6.2f}%)")

    # 출력 폴더 생성
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # JSON으로 저장
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(converted_data, f, indent=2, ensure_ascii=False)

    print(f"\n{'='*60}")
    print(f"Converted data saved to: {output_path}")
    print(f"Total tags: {len(converted_data)}")

    # 기존 valve_data.json 형식으로도 저장
    legacy_format = {}
    for tag in converted_data:
        location = tag['location']
        if location not in legacy_format:
            legacy_format[location] = []
        legacy_format[location].append(tag['tag'])

    legacy_path = Path(r"C:\Users\USER\Downloads\pid-viewer\public\data\valve_data_legacy.json")
    with open(legacy_path, 'w', encoding='utf-8') as f:
        json.dump(legacy_format, f, indent=2, ensure_ascii=False)

    print(f"Legacy format saved to: {legacy_path}")

if __name__ == "__main__":
    main()
