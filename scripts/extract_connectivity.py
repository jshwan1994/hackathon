#!/usr/bin/env python3
"""
DXF 파일에서 밸브 연결 정보를 추출하는 스크립트
- 밸브 태그 및 위치 추출
- 배관 라인 추출
- 연결 관계 분석
"""

import ezdxf
import json
import re
from pathlib import Path
from collections import defaultdict
import math

# 밸브 태그 패턴 (VG, VC, VL, VB, FCV, LCV, TCV, PCV, PSV, PRV, HV, XV 등)
VALVE_PATTERN = re.compile(
    r'^(VG|VC|VL|VB|VF|VN|FV|HV|XV|CV|FCV|LCV|TCV|PCV|PSV|PRV)-?\d+',
    re.IGNORECASE
)

# 계기 패턴 (PI, TI, FI, LI 등)
INSTRUMENT_PATTERN = re.compile(
    r'^(PI|TI|FI|LI|PT|TT|FT|LT|PS|TS|FS|LS|PIT|TIT|FIT|LIT)-?\d+',
    re.IGNORECASE
)

def extract_text_entities(dxf_path):
    """DXF 파일에서 텍스트 엔티티 추출"""
    doc = ezdxf.readfile(dxf_path)
    msp = doc.modelspace()

    text_entities = []

    # TEXT 엔티티
    for entity in msp.query('TEXT'):
        text = entity.dxf.text.strip()
        pos = entity.dxf.insert
        text_entities.append({
            'text': text,
            'x': pos.x,
            'y': pos.y,
            'type': 'TEXT'
        })

    # MTEXT 엔티티
    for entity in msp.query('MTEXT'):
        text = entity.text.strip()
        # MTEXT 포맷팅 제거
        text = re.sub(r'\\[A-Za-z]+;', '', text)
        text = re.sub(r'\{|\}', '', text)
        pos = entity.dxf.insert
        text_entities.append({
            'text': text,
            'x': pos.x,
            'y': pos.y,
            'type': 'MTEXT'
        })

    return text_entities

def extract_lines(dxf_path):
    """DXF 파일에서 라인 엔티티 추출"""
    doc = ezdxf.readfile(dxf_path)
    msp = doc.modelspace()

    lines = []

    # LINE 엔티티
    for entity in msp.query('LINE'):
        lines.append({
            'start': (entity.dxf.start.x, entity.dxf.start.y),
            'end': (entity.dxf.end.x, entity.dxf.end.y),
            'layer': entity.dxf.layer,
            'type': 'LINE'
        })

    # LWPOLYLINE 엔티티 (배관 라인에 자주 사용)
    for entity in msp.query('LWPOLYLINE'):
        points = list(entity.get_points())
        for i in range(len(points) - 1):
            lines.append({
                'start': (points[i][0], points[i][1]),
                'end': (points[i+1][0], points[i+1][1]),
                'layer': entity.dxf.layer,
                'type': 'POLYLINE'
            })

    # POLYLINE 엔티티
    for entity in msp.query('POLYLINE'):
        points = list(entity.points())
        for i in range(len(points) - 1):
            lines.append({
                'start': (points[i][0], points[i][1]),
                'end': (points[i+1][0], points[i+1][1]),
                'layer': entity.dxf.layer,
                'type': 'POLYLINE'
            })

    return lines

def extract_valve_tags(text_entities):
    """텍스트 엔티티에서 밸브/계기 태그 추출"""
    valves = []
    instruments = []

    for entity in text_entities:
        text = entity['text'].upper().replace(' ', '')

        # 밸브 패턴 매칭
        if VALVE_PATTERN.match(text):
            valves.append({
                'tag': text,
                'x': entity['x'],
                'y': entity['y']
            })
        # 계기 패턴 매칭
        elif INSTRUMENT_PATTERN.match(text):
            instruments.append({
                'tag': text,
                'x': entity['x'],
                'y': entity['y']
            })

    return valves, instruments

def distance(p1, p2):
    """두 점 사이의 거리 계산"""
    return math.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def find_nearby_components(target, components, threshold=50):
    """특정 컴포넌트 주변의 다른 컴포넌트 찾기"""
    nearby = []
    target_pos = (target['x'], target['y'])

    for comp in components:
        if comp['tag'] == target['tag']:
            continue
        comp_pos = (comp['x'], comp['y'])
        dist = distance(target_pos, comp_pos)
        if dist < threshold:
            nearby.append({
                'tag': comp['tag'],
                'distance': dist
            })

    return sorted(nearby, key=lambda x: x['distance'])

def find_connected_valves(target_valve, all_valves, lines, threshold=100):
    """
    라인을 따라 연결된 밸브 찾기
    - target_valve: 대상 밸브
    - all_valves: 모든 밸브 목록
    - lines: 모든 라인 목록
    - threshold: 연결 판정 거리 임계값
    """
    target_pos = (target_valve['x'], target_valve['y'])

    # 대상 밸브 근처의 라인 찾기
    connected_lines = []
    for line in lines:
        start_dist = distance(target_pos, line['start'])
        end_dist = distance(target_pos, line['end'])
        if start_dist < threshold or end_dist < threshold:
            connected_lines.append(line)

    # 연결된 라인의 끝점 근처에 있는 다른 밸브 찾기
    connected_valves = []
    for line in connected_lines:
        for valve in all_valves:
            if valve['tag'] == target_valve['tag']:
                continue
            valve_pos = (valve['x'], valve['y'])

            # 라인의 시작점이나 끝점 근처에 있는지 확인
            if distance(valve_pos, line['start']) < threshold or \
               distance(valve_pos, line['end']) < threshold:
                # 중복 체크
                if not any(v['tag'] == valve['tag'] for v in connected_valves):
                    connected_valves.append({
                        'tag': valve['tag'],
                        'x': valve['x'],
                        'y': valve['y'],
                        'layer': line['layer']
                    })

    return connected_valves

def analyze_connectivity(dxf_path):
    """DXF 파일 분석 및 연결 관계 추출"""
    print(f"\n{'='*60}")
    print(f"분석 중: {Path(dxf_path).name}")
    print(f"{'='*60}")

    # 엔티티 추출
    text_entities = extract_text_entities(dxf_path)
    lines = extract_lines(dxf_path)

    print(f"텍스트 엔티티: {len(text_entities)}개")
    print(f"라인 엔티티: {len(lines)}개")

    # 밸브/계기 태그 추출
    valves, instruments = extract_valve_tags(text_entities)

    print(f"\n발견된 밸브: {len(valves)}개")
    for v in sorted(valves, key=lambda x: x['tag'])[:20]:
        print(f"  {v['tag']} at ({v['x']:.1f}, {v['y']:.1f})")
    if len(valves) > 20:
        print(f"  ... 외 {len(valves) - 20}개")

    print(f"\n발견된 계기: {len(instruments)}개")
    for i in sorted(instruments, key=lambda x: x['tag'])[:10]:
        print(f"  {i['tag']} at ({i['x']:.1f}, {i['y']:.1f})")
    if len(instruments) > 10:
        print(f"  ... 외 {len(instruments) - 10}개")

    # 레이어 분석
    layers = defaultdict(int)
    for line in lines:
        layers[line['layer']] += 1

    print(f"\n레이어별 라인 수:")
    for layer, count in sorted(layers.items(), key=lambda x: -x[1])[:10]:
        print(f"  {layer}: {count}개")

    return {
        'valves': valves,
        'instruments': instruments,
        'lines': lines,
        'text_entities': text_entities
    }

def find_isolation_valves(target_tag, valves, lines, threshold=150):
    """
    특정 밸브의 격리를 위한 전/후단 밸브 찾기
    """
    # 대상 밸브 찾기
    target = None
    for v in valves:
        if v['tag'].upper() == target_tag.upper():
            target = v
            break

    if not target:
        print(f"밸브 {target_tag}를 찾을 수 없습니다.")
        return None

    print(f"\n{'='*60}")
    print(f"격리 분석: {target_tag}")
    print(f"위치: ({target['x']:.1f}, {target['y']:.1f})")
    print(f"{'='*60}")

    # 연결된 밸브 찾기
    connected = find_connected_valves(target, valves, lines, threshold)

    # Y 좌표 기준으로 상류/하류 구분 (일반적으로 위쪽이 상류)
    upstream = []
    downstream = []

    for valve in connected:
        if valve['y'] > target['y']:
            upstream.append(valve)
        else:
            downstream.append(valve)

    # 거리순 정렬
    upstream.sort(key=lambda v: distance((target['x'], target['y']), (v['x'], v['y'])))
    downstream.sort(key=lambda v: distance((target['x'], target['y']), (v['x'], v['y'])))

    result = {
        'target': target_tag,
        'position': {'x': target['x'], 'y': target['y']},
        'upstream': [v['tag'] for v in upstream[:3]],  # 가장 가까운 3개
        'downstream': [v['tag'] for v in downstream[:3]],
        'all_connected': [v['tag'] for v in connected]
    }

    print(f"\n상류 (전단) 밸브:")
    for v in upstream[:3]:
        print(f"  {v['tag']} - 레이어: {v.get('layer', 'N/A')}")

    print(f"\n하류 (후단) 밸브:")
    for v in downstream[:3]:
        print(f"  {v['tag']} - 레이어: {v.get('layer', 'N/A')}")

    return result

def main():
    # DXF 파일 경로
    dxf_folder = Path(r"C:\Users\USER\OneDrive - GS에너지\바탕 화면\GS 곤 자료\2025년\도면\새 폴더")

    # DH HE Condensate System 도면 분석
    dxf_files = list(dxf_folder.glob("*DH HE Condensate*.dxf"))

    if not dxf_files:
        print("DXF 파일을 찾을 수 없습니다.")
        print(f"검색 경로: {dxf_folder}")
        return

    all_results = {}

    for dxf_path in dxf_files:
        result = analyze_connectivity(str(dxf_path))
        all_results[dxf_path.name] = result

        # VC-4307 격리 분석 (해당 도면에 있는 경우)
        vc4307 = [v for v in result['valves'] if 'VC-4307' in v['tag'].upper() or 'VC4307' in v['tag'].upper()]
        if vc4307:
            isolation = find_isolation_valves('VC-4307', result['valves'], result['lines'])
            if isolation:
                all_results[dxf_path.name]['isolation_VC-4307'] = isolation

    # 결과 저장
    output_path = Path(r"C:\Users\USER\Downloads\pid-viewer\public\data\connectivity_analysis.json")

    # JSON 직렬화를 위해 변환
    json_results = {}
    for filename, data in all_results.items():
        json_results[filename] = {
            'valves': data['valves'],
            'instruments': data['instruments'],
            'valve_count': len(data['valves']),
            'instrument_count': len(data['instruments']),
            'line_count': len(data['lines'])
        }
        if 'isolation_VC-4307' in data:
            json_results[filename]['isolation_VC-4307'] = data['isolation_VC-4307']

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(json_results, f, ensure_ascii=False, indent=2)

    print(f"\n결과 저장: {output_path}")

if __name__ == "__main__":
    main()
