"""Offline content and release-integrity checks; no browser or external network needed."""
import hashlib
import json
from pathlib import Path

H5 = Path(__file__).resolve().parents[2] / 'h5'


def test_offline_manifest_matches_all_delivered_bytes():
    manifest = json.loads((H5 / 'offline-assets.json').read_text())
    assert manifest['schema'] == 1
    paths = set()
    for asset in manifest['assets']:
        path = H5 / asset['path']
        assert H5 in path.resolve().parents
        assert asset['path'] not in paths
        paths.add(asset['path'])
        content = path.read_bytes()
        assert len(content) == asset['bytes'], asset['path']
        assert hashlib.sha256(content).hexdigest() == asset['sha256'], 'Run python h5/build_offline.py: ' + asset['path']
    assert {'index.html', 'app.js', 'offline.js', 'offline.css', 'offline-db.js', 'data/offline-pvg-t2.json', 'stamp.js', 'stamp-renderer.js', 'stamp.css', 'data/first-stamp.json', 'img/stamp/shanghai-dusk.jpg', 'img/stamp/discover-qr.png', 'fonts/cormorant-garamond.woff2'} <= paths
    assert not any(path.startswith(('backend/', 'api/')) for path in paths)


def test_guide_has_valid_links_and_a_route_to_help_and_completion():
    data = json.loads((H5 / 'data/offline-pvg-t2.json').read_text())
    steps = data['guide']['steps']
    phrases = {item['id'] for item in data['phrases']}
    assert len(phrases) == len(data['phrases'])
    places = {item['id'] for item in data['places']}
    sources = {item['id'] for item in data['sources']}
    for key, step in steps.items():
        assert step['phrase'] in phrases
        if step.get('place'):
            assert step['place'] in places
        for option in step['options']:
            assert option['next'] in steps
            if option.get('request'):
                assert option['request'] in phrases
            if option.get('request_place'):
                assert option['request_place'] in places
        if key != 'complete':
            reachable, pending = set(), [key]
            while pending:
                current = pending.pop()
                if current not in reachable:
                    reachable.add(current)
                    pending.extend(option['next'] for option in steps[current]['options'])
            assert {'complete', 'fallback'} <= reachable, key
    for place in data['places']:
        assert set(place['sources']) <= sources
        assert (H5 / place['image']).is_file()
        assert place['checked_at']
    assert data['demo_hotel']['demo'] is True


def test_build_template_keeps_offline_integration():
    template = (H5 / 'build_h5.py').read_text()
    for asset in ('offline.css', 'offline-db.js', 'offline.js', 'stamp.css', 'stamp-renderer.js', 'stamp.js'):
        assert asset in template
    assert "'offline-help'" in template



def test_service_tasks_have_staff_requests_and_real_fallbacks():
    data = json.loads((H5 / 'data/offline-pvg-t2.json').read_text())
    places = {p['id']: p for p in data['places']}
    for place in places.values():
        guidance = place['guidance']
        assert guidance['title'] and guidance['summary'] and guidance['location_hint']
        assert guidance['request']['zh'] and guidance['request']['en']
        assert guidance['staff_location']['zh'] and guidance['staff_location']['en']
        assert guidance['at_counter']['zh'] and guidance['at_counter']['en']
        assert guidance['steps'] and guidance['fallback']
        target = guidance['fallback_place']
        assert target is None or (target in places and target != place['id'])
    assert places['exchange']['guidance']['fallback_place'] == 'service'
