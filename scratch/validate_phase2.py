import re
import os

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

with open('script.js', 'r', encoding='utf-8') as f:
    js = f.read()

critical_ids = [
    'nav-tab-series', 'nav-tab-animes', 'view-series', 'view-animes',
    'series-hero-backdrop', 'series-hero-title', 'series-hero-dots',
    'animes-hero-backdrop', 'animes-hero-title', 'animes-hero-dots',
    'series-modal', 'btn-close-series-modal', 'series-modal-iframe',
    'series-player-view', 'series-player-current-ep',
    'btn-series-prev-ep', 'btn-series-next-ep', 'btn-toggle-drawer',
    'series-player-drawer', 'series-drawer-list', 'series-season-select',
    'series-episodes-grid', 'btn-mode-arcs', 'btn-mode-continuous',
    'series-arcs-panel', 'series-continuous-panel', 'series-quick-ep-search',
    'series-chunks-container', 'series-continuous-grid',
    'home-continue-watching-section', 'home-continue-watching-track'
]

missing = [cid for cid in critical_ids if f'id="{cid}"' not in html and f"id='{cid}'" not in html]

print(f"Total critical IDs checked: {len(critical_ids)}")
if missing:
    print(f"MISSING IDs: {missing}")
else:
    print("SUCCESS: All 31 critical IDs are present in index.html!")

# Verify CSS active colors
assert '[data-view="series"]' in css, "CSS missing [data-view='series']"
assert '[data-view="animes"]' in css, "CSS missing [data-view='animes']"
assert '.series-modal-card' in css, "CSS missing .series-modal-card"
assert '.series-ep-card' in css, "CSS missing .series-ep-card"
assert '.continue-card' in css, "CSS missing .continue-card"
print("SUCCESS: All CSS rules and theme variables verified!")

# Verify script navigation
assert "initSeriesView" in js, "JS missing initSeriesView"
assert "initAnimesView" in js, "JS missing initAnimesView"
assert "openSeriesModal" in js, "JS missing openSeriesModal"
assert "playSeriesEpisode" in js, "JS missing playSeriesEpisode"
assert "renderHomeContinueWatching" in js, "JS missing renderHomeContinueWatching"
print("SUCCESS: All JavaScript lifecycle handlers verified!")
