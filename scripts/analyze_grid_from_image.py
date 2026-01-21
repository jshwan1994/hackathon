"""
PNG 이미지에서 그리드 라인 검출 및 라벨 위치 추정
"""
from PIL import Image
import cv2
import numpy as np
from pathlib import Path

def detect_grid_lines(image_path):
    """이미지에서 그리드 라인 검출"""
    # 이미지 로드
    img = Image.open(image_path)
    img_cv = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)

    height, width = gray.shape
    print(f"이미지 크기: {width} x {height}")

    # 에지 검출
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)

    # 모든 선 검출
    lines = cv2.HoughLinesP(
        edges,
        rho=1,
        theta=np.pi/180,
        threshold=100,
        minLineLength=min(width, height) * 0.5,
        maxLineGap=50
    )

    horizontal_lines = []
    vertical_lines = []

    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]

            # 수평선 판별 (기울기가 작음)
            if abs(y2 - y1) < 10 and abs(x2 - x1) > width * 0.6:
                horizontal_lines.append(line)

            # 수직선 판별 (기울기가 큼)
            elif abs(x2 - x1) < 10 and abs(y2 - y1) > height * 0.6:
                vertical_lines.append(line)

    print(f"\n검출된 수평선: {len(horizontal_lines)}개")
    print(f"검출된 수직선: {len(vertical_lines)}개")

    # 수평선 Y좌표 수집
    h_positions = []
    for line in horizontal_lines:
        x1, y1, x2, y2 = line[0]
        y_avg = (y1 + y2) / 2
        h_positions.append(y_avg)

    # 수직선 X좌표 수집
    v_positions = []
    for line in vertical_lines:
        x1, y1, x2, y2 = line[0]
        x_avg = (x1 + x2) / 2
        v_positions.append(x_avg)

    # 정렬 및 중복 제거 (비슷한 위치는 합침)
    def merge_positions(positions, threshold=20):
        if not positions:
            return []
        positions = sorted(positions)
        merged = [positions[0]]
        for pos in positions[1:]:
            if pos - merged[-1] > threshold:
                merged.append(pos)
        return merged

    h_positions = merge_positions(h_positions)
    v_positions = merge_positions(v_positions)

    print(f"\n병합 후 수평선: {len(h_positions)}개")
    print(f"병합 후 수직선: {len(v_positions)}개")

    # 퍼센트로 변환
    h_percents = [(y / height) * 100 for y in h_positions]
    v_percents = [(x / width) * 100 for x in v_positions]

    print("\n수평선 위치 (Y%, 행 A-F 구분):")
    for i, pct in enumerate(h_percents):
        print(f"  {i+1}: {pct:.2f}%")

    print("\n수직선 위치 (X%, 열 1-8 구분):")
    for i, pct in enumerate(v_percents):
        print(f"  {i+1}: {pct:.2f}%")

    return {
        'horizontal': h_percents,
        'vertical': v_percents,
        'image_size': {'width': width, 'height': height}
    }

def main():
    image_path = Path(r"C:\Users\USER\Downloads\pid-viewer\public\drawings\DH-Live-Condensate-System.png")

    if not image_path.exists():
        print(f"이미지 파일을 찾을 수 없습니다: {image_path}")
        return

    print("이미지에서 그리드 라인 검출 중...\n")
    grid_data = detect_grid_lines(image_path)

    # VG-4307 테스트
    print("\n" + "=" * 60)
    print("VG-4307 위치 확인")
    print("=" * 60)
    print("좌표: 19.4%, 20.67%")
    print("\n위 그리드 정보를 보고 어느 셀에 있는지 확인하세요!")

if __name__ == "__main__":
    main()
