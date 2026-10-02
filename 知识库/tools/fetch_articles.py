#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""通用抓取：把各来源的实操文章正文转成 Markdown。

用法：python3 fetch_articles.py               # 抓 SOURCES 里的全部
      python3 fetch_articles.py <source>       # 只抓一个来源
      python3 fetch_articles.py <source> <url> # 抓单篇
输出：知识库/raw/<source>/<slug>.md 和 index.json
"""
import os, re, sys, json, time, datetime, subprocess
from bs4 import BeautifulSoup
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_wildchina import to_md, meta  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.normpath(os.path.join(HERE, '..', 'raw'))

SOURCES = {
    # 与产品同源，可直接推荐给用户阅读
    'tripcom': [
        'https://www.trip.com/guide/phone/how-to-use-alipay.html',
        'https://au.trip.com/guide/info/alipay-china.html',
        'https://www.trip.com/guide/info/alipay-vs-wechat-pay.html',
        'https://www.trip.com/guide/transport/how-to-use-didi-in-china.html',
        'https://in.trip.com/guide/transport/didi-china.html',
        'https://sg.trip.com/guide/phone/didi-app-china.html',
        'https://in.trip.com/guide/phone/china-esim.html',
        'https://in.trip.com/guide/info/china-apps.html',
        'https://uk.trip.com/guide/phone/best-china-travel-apps.html',
        'https://sg.trip.com/guide/phone/china-transport-app.html',
        'https://us.trip.com/guide/visa/china-visa-free-transit.html',
        'https://sg.trip.com/guide/transport/shanghai-pudong-airport.html',
        'https://trip.com/guide/train/12306.html',
        'https://www.trip.com/guide/train/china-train-booking.html',
    ],
    # 官方 / 政府
    'official': [
        'https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/paymentservices/202408/t20240830_3785647.html',
        'https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/transportation/202408/t20240830_3785706.html',
        'https://english.beijing.gov.cn/latest/specials/essentialtipsfornewarrivals/getconnected/202408/t20240830_3785643.html',
        'https://english.beijing.gov.cn/quickguideservices/purchasingsimcards/',
        'https://english.beijing.gov.cn/specials/beijingservice/pek/sim/',
        'https://english.beijing.gov.cn/specials/beijingservice/pkx/changyoutong/',
        'https://english.beijing.gov.cn/latest/news/202503/t20250304_4024775.html',
        'https://english.beijing.gov.cn/latest/news/202512/t20251205_4322494.html',
        'https://english.beijing.gov.cn/livinginbeijing/finance/mobilepaymentlist/202005/t20200516_1899230.html',
        'https://www.alipayplus.com/pay-in-the-chinese-mainland/',
        'https://www.china-briefing.com/news/wechat-enables-foreigners-to-pay-with-overseas-cards-in-china/',
        'https://www.12306.cn/en/index.html',
    ],
    # 大型实用指南站
    'chinahighlights': [
        'https://www.chinahighlights.com/expatslife/payment-methods.htm',
        'https://www.chinahighlights.com/travelguide/plan-first-trip.htm',
        'https://www.chinahighlights.com/shanghai/travel-tips.htm',
        'https://www.chinahighlights.com/travelguide/article-things-not-to-do-in-china.htm',
        'https://www.chinahighlights.com/china-trains/app.htm',
    ],
    # 2026 年独立攻略站（内部参考，不直接外发）
    'blogs': [
        'https://wanderinchina.com/survival-guide/useful-mobile-apps/alipay',
        'https://wanderinchina.com/survival-guide/useful-mobile-apps/',
        'https://chinatravelpack.com/guides/alipay',
        'https://chinatravelpack.com/local-tips/shanghai-airport-guide',
        'https://www.payinchinaguide.com/guides/using-alipay',
        'https://www.payinchinaguide.com/blog/alipay-foreigners-2025-ultimate-faq',
        'https://mychina.guide/blog/how-to-use-alipay-china-foreigner',
        'https://www.you.co/sg/blog/how-to-use-didi-in-china/',
        'https://www.you.co/sg/blog/how-to-use-alipay-in-china/',
        'https://letstraveltochina.com/how-to-use-didi-app-in-china/',
        'https://roamchinatravel.com/posts/toolkit/china-digital-payment-foreigners-guide/',
        'https://www.travelofchina.com/alipay-setup-guide/',
        'https://chinatripplans.com/blog/china-payment-guide-2026',
        'https://ltl-school.com/alipay-for-foreigners/',
        'https://chinafortravelers.com/guides/pvg-airport-guide/',
        'https://www.shanghaitourism.org/shanghai-airport-arrival-guide/',
        'https://www.eastchinatrip.com/shanghai-pudong-airport-to-city-guide/',
        'https://www.wayschina.com/en/articles/shanghai-airport-guide-pvg-and-sha',
        'https://wayschina.com/en/articles/how-to-use-alipay-with-foreign-cards',
        'https://chinaguidelines.com/zh/posts/high-speed-train',
        'https://chinaguidelines.com/zh/posts/tour-card',
        'https://mychinacompass.com/free-wifi/',
        'https://gigago.com/beijing-airport-wifi/',
        'https://www.readyforchina.com/en',
        'https://www.you.co/sg/blog/how-to-use-wechat-pay-in-china/',
        'https://chinawithease.com/payment/',
        'https://chinawithease.com/blog/wechat-pay-foreigners/',
        'https://www.chinavigators.com/wechat-pay-foreigners-guide/',
        'https://extentage.com/wechat-pay-limits-guide/',
        'https://www.cits.net/china-travel-news/how-to-use-mobile-payment-in-china-2026-the-ultimate-guide-for-international-travelers.html',
        'https://www.gochinaplanner.com/resources/alipay-internet-guide/',
        'https://wise.com/sg/blog/how-to-use-didi-china',
        'https://wise.com/en-cn/blog/how-to-buy-train-tickets-in-china',
        'https://chinafortravelers.com/guides/12306-english/',
        'https://chinatravelradar.com/en/transport/china-train-tickets-foreigners/',
        'https://mychina.guide/blog/book-china-train-tickets-12306-foreigner',
        'https://mychina.guide/blog/how-to-use-didi-china-without-chinese-number',
        'https://tripchina.me/didi-guide-foreigners-china/',
        'https://www.chinbound.com/blog/didi-foreigners-china/',
        'https://gochinaquest.com/how-to-use-didi-in-china-as-a-foreigner/',
    ],
}

ROOT_SELECTORS = ['article', 'main', '[role=main]', '#main-content', '#content', '.entry-content', '.post-content',
                  '.article-content', '.content', '.TRS_Editor', '#mainText', 'body']


def fetch(url):
    r = subprocess.run(['curl', '-sL', '-m', '45', '-A',
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
                        url], capture_output=True)
    return r.stdout.decode('utf-8', 'ignore')


def pick_root(soup):
    best, best_len = None, 0
    for sel in ROOT_SELECTORS:
        for el in soup.select(sel)[:3]:
            n = len(el.get_text(' ', strip=True))
            if n > best_len:
                best, best_len = el, n
        if best is not None and best_len > 1500 and sel != 'body':
            return best
    return best or soup.body


def slug(url):
    parts = [p for p in url.rstrip('/').split('/') if p]
    s = '-'.join(parts[-2:]) if len(parts) > 3 else parts[-1]
    s = re.sub(r'\.(html?|htm|php)$', '', s)
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')[:90]


def run(source, urls):
    out = os.path.join(RAW, source); os.makedirs(out, exist_ok=True)
    ip = os.path.join(out, 'index.json')
    index = json.load(open(ip, encoding='utf-8')) if os.path.exists(ip) else {}
    for url in urls:
        html = fetch(url)
        if not html or len(html) < 500:
            print('FAIL  ', url); continue
        soup = BeautifulSoup(html, 'lxml')
        for t in soup.select('nav, header, footer, script, style, noscript, iframe, form, .sidebar, .breadcrumb, .share, .comments'):
            t.decompose()
        root = pick_root(soup)
        title = (soup.title.string or '').split('|')[0].split(' - ')[0].strip() if soup.title and soup.title.string else url
        pub = meta(soup, 'article:published_time')[:10] or meta(soup, 'datePublished')[:10]
        mod = meta(soup, 'article:modified_time')[:10] or meta(soup, 'dateModified')[:10]
        md = to_md(root)
        if len(md) < 600:
            print('THIN  %6d %s' % (len(md), url));
        fm = '---\ntitle: "%s"\nsource: %s\npublished: %s\nmodified: %s\nfetched: %s\nsite: %s\n---\n\n' % (
            title.replace('"', "'"), url, pub, mod, datetime.date.today().isoformat(), source)
        name = slug(url) + '.md'
        open(os.path.join(out, name), 'w', encoding='utf-8').write(fm + '# ' + title + '\n\n' + md + '\n')
        heads = re.findall(r'^#{2,3} (.+)$', md, re.M)
        index[name] = {'title': title, 'url': url, 'published': pub, 'modified': mod, 'chars': len(md), 'headings': heads[:30]}
        print('%6d chars  %-10s  %s' % (len(md), (mod or pub or '')[:10], title[:70]))
        time.sleep(0.6)
    json.dump(index, open(ip, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    a = sys.argv[1:]
    if len(a) >= 2:
        run(a[0], a[1:])
    elif len(a) == 1:
        run(a[0], SOURCES[a[0]])
    else:
        for s, u in SOURCES.items():
            print('==', s); run(s, u)
