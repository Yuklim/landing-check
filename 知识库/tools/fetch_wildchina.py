#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""抓取 WildChina 实操指南正文并转成 Markdown，供知识库整理用。

用法：python3 fetch_wildchina.py            # 抓取 URLS 列表
      python3 fetch_wildchina.py <url>...    # 只抓指定链接
输出：知识库/raw/wildchina/<slug>.md，并刷新 index.json
"""
import os, re, sys, json, time, datetime, subprocess
from bs4 import BeautifulSoup, NavigableString, Tag

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', 'raw', 'wildchina'))
os.makedirs(OUT, exist_ok=True)

URLS = [
    'https://wildchina.com/2026/05/guide-to-using-alipay-2026/',
    'https://wildchina.com/2026/05/wechat-pay-in-2026/',
    'https://wildchina.com/2025/10/a-guide-to-using-didi-in-china-2025/',
    'https://wildchina.com/trip-to-china-pre-departure-guide/',
    'https://wildchina.com/2026/02/planning-a-first-trip-to-china/',
    'https://wildchina.com/2026/04/how-to-visit-china-in-2026/',
    'https://wildchina.com/2025/02/a-guide-to-china-transit-visas/',
    'https://wildchina.com/2023/11/chinas-trains-a-comprehensive-guide/',
    'https://wildchina.com/2025/05/chinese-airlines/',
    'https://wildchina.com/2025/09/high-tech-travel-in-china/',
    'https://wildchina.com/2025/09/solo-travel-in-china/',
    'https://wildchina.com/2026/06/etiquette-in-china/',
    'https://wildchina.com/faq/',
    'https://wildchina.com/2024/07/accessible-travel-in-china/',
    'https://wildchina.com/2023/09/fastest-way-to-enter-china-with-wildchina/',
    'https://wildchina.com/trip-to-china-city-guide/',
    'https://wildchina.com/2024/12/halal-food-in-china/',
    'https://wildchina.com/2025/08/vegetarian-and-vegan-dining-in-china/',
    'https://wildchina.com/2026/04/how-to-visit-the-great-wall-of-china/',
    'https://wildchina.com/2026/03/whats-trending-in-travel-in-china/',
    'https://wildchina.com/2025/06/lgbtq-travel-in-china/',
]

STOP_HEADINGS = ('related tours', 'explore more', 'travel advisors', 'you may also like', 'related posts', 'share this')


def fetch(url):
    r = subprocess.run(['curl', '-sL', '-m', '40', '-A', 'Mozilla/5.0', url], capture_output=True)
    return r.stdout.decode('utf-8', 'ignore')


def inline(node):
    """把一个元素内部转成 markdown 行内文本"""
    out = []
    for c in node.children:
        if isinstance(c, NavigableString):
            out.append(str(c))
        elif isinstance(c, Tag):
            if c.name == 'a' and c.get('href'):
                out.append('[%s](%s)' % (inline(c).strip() or c['href'], c['href']))
            elif c.name in ('strong', 'b'):
                t = inline(c).strip()
                out.append('**%s**' % t if t else '')
            elif c.name in ('em', 'i'):
                t = inline(c).strip()
                out.append('*%s*' % t if t else '')
            elif c.name == 'br':
                out.append('\n')
            elif c.name == 'img':
                src = c.get('data-lazy-src') or c.get('data-src') or c.get('src', '')
                if src and not src.startswith('data:'):
                    out.append('![%s](%s)' % (c.get('alt', ''), src))
            elif c.name in ('script', 'style', 'noscript', 'svg', 'button', 'form'):
                continue
            else:
                out.append(inline(c))
    return re.sub(r'[ \t]+', ' ', ''.join(out))


def to_md(root):
    lines = []
    stop = False

    def walk(node, depth=0):
        nonlocal stop
        for c in node.children:
            if stop:
                return
            if isinstance(c, NavigableString):
                continue
            if not isinstance(c, Tag):
                continue
            n = c.name
            if n in ('script', 'style', 'noscript', 'svg', 'nav', 'aside', 'footer', 'form', 'button', 'iframe'):
                continue
            if n in ('h1', 'h2', 'h3', 'h4', 'h5'):
                t = inline(c).strip()
                if t.lower().startswith(STOP_HEADINGS):
                    stop = True; return
                lines.append('\n' + '#' * (int(n[1]) + 0) + ' ' + t + '\n')
            elif n == 'p':
                t = inline(c).strip()
                if t:
                    lines.append(t + '\n')
            elif n in ('ul', 'ol'):
                for i, li in enumerate(c.find_all('li', recursive=False)):
                    sub = li.find(['ul', 'ol'])
                    t = inline(li).strip() if not sub else ''.join(str(x) for x in li.children if not (isinstance(x, Tag) and x.name in ('ul', 'ol')))
                    t = BeautifulSoup(t, 'lxml').get_text(' ', strip=True) if sub else t
                    mark = ('%d.' % (i + 1)) if n == 'ol' else '-'
                    lines.append('%s%s %s' % ('  ' * depth, mark, t))
                    if sub:
                        walk(li, depth + 1)
                lines.append('')
            elif n == 'table':
                rows = c.find_all('tr')
                for ri, tr in enumerate(rows):
                    cells = [inline(td).strip().replace('\n', ' ') for td in tr.find_all(['td', 'th'])]
                    lines.append('| ' + ' | '.join(cells) + ' |')
                    if ri == 0:
                        lines.append('|' + '---|' * len(cells))
                lines.append('')
            elif n == 'blockquote':
                lines.append('> ' + inline(c).strip() + '\n')
            elif n == 'img':
                src = c.get('data-lazy-src') or c.get('data-src') or c.get('src', '')
                if src and not src.startswith('data:'):
                    lines.append('![%s](%s)\n' % (c.get('alt', ''), src))
            else:
                walk(c, depth)
    walk(root)
    md = '\n'.join(lines)
    md = re.sub(r'\n{3,}', '\n\n', md)
    return md.strip()


def meta(soup, prop):
    m = soup.find('meta', attrs={'property': prop}) or soup.find('meta', attrs={'name': prop})
    return m.get('content', '') if m else ''


def slug(url):
    return re.sub(r'[^a-z0-9]+', '-', url.rstrip('/').split('/')[-1].lower()).strip('-')[:80]


def run(urls):
    index = {}
    ip = os.path.join(OUT, 'index.json')
    if os.path.exists(ip):
        index = json.load(open(ip, encoding='utf-8'))
    for url in urls:
        html = fetch(url)
        if not html:
            print('FAIL', url); continue
        soup = BeautifulSoup(html, 'lxml')
        root = soup.select_one('article') or soup.select_one('main') or soup.body
        title = (soup.title.string or '').split('|')[0].strip() if soup.title else url
        pub = meta(soup, 'article:published_time')[:10]
        mod = meta(soup, 'article:modified_time')[:10]
        md = to_md(root)
        fm = '---\ntitle: "%s"\nsource: %s\npublished: %s\nmodified: %s\nfetched: %s\nsite: WildChina\n---\n\n' % (
            title.replace('"', "'"), url, pub, mod, datetime.date.today().isoformat())
        name = slug(url) + '.md'
        open(os.path.join(OUT, name), 'w', encoding='utf-8').write(fm + '# ' + title + '\n\n' + md + '\n')
        heads = re.findall(r'^#{2,3} (.+)$', md, re.M)
        index[name] = {'title': title, 'url': url, 'published': pub, 'modified': mod, 'chars': len(md), 'headings': heads[:30]}
        print('%6d chars  %s  %s' % (len(md), mod or pub, title[:70]))
        time.sleep(0.8)
    json.dump(index, open(ip, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    run(sys.argv[1:] or URLS)
