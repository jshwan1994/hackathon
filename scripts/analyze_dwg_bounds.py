"""
DXF 파일의 실제 도면 경계를 분석하는 스크립트
"""
import ezdxf
from pathlib import Path

def analyze_dwg_bounds(dwg_path):
    """DXF 파일의 모든 엔티티 경계 분석"""
    print(f"Analyzing: {dwg_path}")

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

    if all_x and all_y:
        bounds = {
            'min_x': min(all_x),
            'max_x': max(all_x),
            'min_y': min(all_y),
            'max_y': max(all_y),
            'width': max(all_x) - min(all_x),
            'height': max(all_y) - min(all_y)
        }

        print(f"\nDrawing bounds:")
        print(f"  X: {bounds['min_x']:.2f} to {bounds['max_x']:.2f} (width: {bounds['width']:.2f})")
        print(f"  Y: {bounds['min_y']:.2f} to {bounds['max_y']:.2f} (height: {bounds['height']:.2f})")

        # VC-0581 위치 찾기
        for entity in msp.query('TEXT'):
            if 'VC-0581' in entity.dxf.text:
                pos = entity.dxf.insert
                print(f"\nVC-0581 found at:")
                print(f"  CAD coords: ({pos.x:.2f}, {pos.y:.2f})")
                print(f"  Relative X: {(pos.x - bounds['min_x']) / bounds['width'] * 100:.2f}%")
                print(f"  Relative Y: {(bounds['max_y'] - pos.y) / bounds['height'] * 100:.2f}%")

        return bounds

    return None

def main():
    dwg_path = Path(r"C:\Users\USER\Downloads\1M-PI-111-002  DH HE Condensate System-2rev2.dxf")
    analyze_dwg_bounds(dwg_path)

if __name__ == "__main__":
    main()
