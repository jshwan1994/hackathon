"""
이미지에서 VC-0581 위치를 수동으로 찾기 위한 스크립트
"""
from PIL import Image, ImageDraw, ImageFont

# 이미지 로드
img_path = r"C:\Users\USER\Downloads\pid-viewer\public\drawings\DH-Live-Condensate-System.png"
img = Image.open(img_path)
width, height = img.size

print(f"이미지 크기: {width} x {height}")
print()

# CAD 좌표
vc_x_cad = 504.59
vc_y_cad = 398.33

# CAD 범위
min_x = 62.56
max_x = 2711.69
min_y = 25.50
max_y = 577.31

# 다양한 변환 시도
print("여러 변환 방식으로 계산한 VC-0581 위치:")
print("=" * 60)

transformations = {
    "회전 없음 (X->X, Y 반전)": lambda nx, ny: (nx, 1-ny),
    "90도 시계 (Y->X, (1-X)->Y)": lambda nx, ny: (ny, 1-nx),
    "90도 반시계 ((1-Y)->X, X->Y)": lambda nx, ny: (1-ny, nx),
    "180도 ((1-X)->X, Y->Y)": lambda nx, ny: (1-nx, ny),
    "Y->X, X->Y": lambda nx, ny: (ny, nx),
    "Y->X, (1-X)->Y": lambda nx, ny: (ny, 1-nx),
    "(1-Y)->X, X->Y": lambda nx, ny: (1-ny, nx),
    "(1-Y)->X, (1-X)->Y": lambda nx, ny: (1-ny, 1-nx),
}

# 정규화
norm_x = (vc_x_cad - min_x) / (max_x - min_x)
norm_y = (vc_y_cad - min_y) / (max_y - min_y)

print(f"CAD 정규화 좌표: ({norm_x:.4f}, {norm_y:.4f})")
print()

for name, transform in transformations.items():
    tx, ty = transform(norm_x, norm_y)
    px = int(tx * width)
    py = int(ty * height)
    print(f"{name:30} -> ({tx*100:5.1f}%, {ty*100:5.1f}%) = 픽셀({px:4}, {py:4})")

# 시각화 이미지 생성
print("\n시각화 이미지 생성 중...")
viz_img = img.copy().convert('RGB')
draw = ImageDraw.Draw(viz_img)

colors = ['red', 'blue', 'green', 'yellow', 'cyan', 'magenta', 'orange', 'purple']

for (name, transform), color in zip(transformations.items(), colors):
    tx, ty = transform(norm_x, norm_y)
    px = int(tx * width)
    py = int(ty * height)

    # 원 그리기
    r = 30
    draw.ellipse([px-r, py-r, px+r, py+r], outline=color, width=3)

# 저장
output_path = r"C:\Users\USER\Downloads\pid-viewer\scripts\output\valve_positions_test.png"
viz_img.save(output_path)
print(f"저장됨: {output_path}")
print("\n이 이미지를 열어서 어떤 색깔 원이 VC-0581에 가장 가까운지 확인하세요!")
