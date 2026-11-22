import re, json, glob, os, sys, hashlib, html as H
sys.path.insert(0,__import__('os').path.dirname(__file__)); from seg import extract
ROOT=__import__('os').path.abspath(__import__('os').path.join(__import__('os').path.dirname(__file__),'..','..'))+'/'; BASE='https://ss22169a.github.io/sylviaho-portfolio/'
TRDIR=__import__('os').path.join(__import__('os').path.dirname(__file__),'tr')+'/'
ORDER=['index.html','projects.html','work.html','ai.html','about.html','certifications.html','resume.html','search-dilemma.html','funnel-analysis.html','category-intelligence.html','lifecycle-matrix.html','taiwan-ecommerce.html','ai-ecommerce-2028.html','hydrogen-data-centers.html','style-signals.html','pet-care.html','pet-product.html','case-paid-search.html','case-hydrogen-evidence.html','case-pufido-launch.html','case-policy-edm.html','case-o2o-popup.html']
SW_RE=re.compile(r'\n?\s*<div class="lang-switch".*?</div>',re.S)
def sid(src): return hashlib.sha1(src.encode()).hexdigest()[:8]
def load_tr():
    d={}
    for f in sorted(glob.glob(TRDIR+'*.txt')):
        for line in open(f,encoding='utf-8'):
            line=line.rstrip('\n')
            m=re.match(r'^\[([0-9a-f]{8})\] ?(.*)$',line)
            if m: d[m.group(1)]=m.group(2)
    return d
WS_RUN=re.compile(r'\n[ \t]*')
def fill_ws(src,zh):
    runs=WS_RUN.findall(src); i=0; out=''
    for ch in zh:
        if ch=='⏎':
            out+=runs[i] if i<len(runs) else ' '; i+=1
        else: out+=ch
    return out
TAGRE=re.compile(r'<[^>]+>')
def tags_ok(src,zh):
    return sorted(TAGRE.findall(src))==sorted(TAGRE.findall(zh))
def switch(page,zh):
    en_href=('../' if zh else '')+page; zh_href=page if zh else 'zh/'+page
    a1=f'<a href="{en_href}" lang="en" hreflang="en"'+(' class="on" aria-current="true"' if not zh else '')+'>EN</a>'
    a2=f'<a href="{zh_href}" lang="zh-Hant" hreflang="zh-Hant"'+(' class="on" aria-current="true"' if zh else '')+'>中文</a>'
    lab='語言' if zh else 'Language'
    return f'\n      <div class="lang-switch" role="group" aria-label="{lab}">{a1}{a2}</div>'
def hreflang(page):
    en=BASE if page=='index.html' else BASE+page
    zh=BASE+'zh/'+('' if page=='index.html' else page)
    return (f'\n  <link rel="alternate" hreflang="en" href="{en}" />'
            f'\n  <link rel="alternate" hreflang="zh-Hant" href="{zh}" />'
            f'\n  <link rel="alternate" hreflang="x-default" href="{en}" />'),en,zh
def add_en_switch(s,page):
    s=SW_RE.sub('',s)
    s=re.sub(r'\n\s*<link rel="alternate" hreflang[^>]*>','',s)
    s=s.replace('<div class="sidebar-bottom">','<div class="sidebar-bottom">'+switch(page,False),1)
    hl,_,_=hreflang(page)
    s=re.sub(r'(<link rel="canonical"[^>]*>)',lambda m:m.group(1)+hl,s,1)
    return s
LOCAL=re.compile(r'''(\s(?:href|src|poster|data-src)=")([^"]*)(")''')
def fix_url(u):
    if not u or re.match(r'^(https?:|mailto:|tel:|#|/|data:|javascript:)',u): return u
    path=re.split(r'[?#]',u)[0]
    if path.endswith('.html'): return u
    return '../'+u
def build_zh(page,tr,missing):
    s=open(ROOT+page,encoding='utf-8').read()
    s=SW_RE.sub('',s)
    segs,attrs=extract(s)
    reps=[]
    for x in segs+attrs:
        k=sid(x['src'])
        if k not in tr and x.get('attr')=='data-tip' and page=='lifecycle-matrix.html':
            tr[k]=auto_tip(H.unescape(x['src']))
        if k in tr and tr[k] is not None:
            v=tr[k]
            if v=='=': continue
            v=fill_ws(x['src'],v)
            if 'attr' not in x and not tags_ok(x['src'],v): BAD.append((page,k)); continue
            if 'attr' in x: v=H.escape(H.unescape(v),quote=True).replace('&#x27;',"'")
            reps.append((x['a'],x['b'],v))
        else: missing.setdefault(page,[]).append(k)
    reps.sort(key=lambda r:r[0],reverse=True)
    for a,b,v in reps: s=s[:a]+v+s[b:]
    # meta description
    m=re.search(r'<meta name="description" content="([^"]*)"',s); desc_en=H.unescape(m.group(1))
    k=sid('META:'+desc_en); desc=tr.get(k)
    if desc is None: missing.setdefault(page,[]).append(k); desc=desc_en
    title=H.unescape(re.search(r'<title>(.*?)</title>',s,re.S).group(1))
    e=lambda t:H.escape(t,quote=True)
    s=s.replace('<html lang="en">','<html lang="zh-Hant">',1)
    s=re.sub(r'<meta name="description" content="[^"]*"',f'<meta name="description" content="{e(desc)}"',s,1)
    hl,en,zh=hreflang(page)
    s=re.sub(r'\n\s*<link rel="alternate" hreflang[^>]*>','',s)
    s=re.sub(r'<link rel="canonical" href="[^"]*" />',f'<link rel="canonical" href="{zh}" />'+hl,s,1)
    s=re.sub(r'<meta property="og:url" content="[^"]*"',f'<meta property="og:url" content="{zh}"',s,1)
    s=s.replace('<meta property="og:locale" content="en_US" />','<meta property="og:locale" content="zh_TW" />\n  <meta property="og:locale:alternate" content="en_US" />',1)
    for tag in ('og:title','twitter:title'):
        s=re.sub(r'(<meta (?:property|name)="%s" content=")[^"]*'%tag,lambda m:m.group(1)+e(title),s,1)
    for tag in ('og:description','twitter:description'):
        s=re.sub(r'(<meta (?:property|name)="%s" content=")[^"]*'%tag,lambda m:m.group(1)+e(desc),s,1)
    s=s.replace('content="Sylvia Ho, Marketing &amp; GTM Strategist"','content="Sylvia Ho，行銷與 GTM 策略專家"')
    for a,b in POST.items(): s=s.replace(a,b)
    s=LOCAL.sub(lambda m:m.group(1)+fix_url(m.group(2))+m.group(3),s)
    s=re.sub(r'''url\((['"]?)(?!https?:|data:|/|#)([^)'"]+)\1\)''',lambda m:f"url({m.group(1)}../{m.group(2)}{m.group(1)})",s)
    s=s.replace('<div class="sidebar-bottom">','<div class="sidebar-bottom">'+switch(page,True),1)
    return s
BAD=[]
POST={'srcset="images/': 'srcset="../images/', '研究內容。將查詢語法': '研究內容。<br>將查詢語法', '只呈現占比或指數。部分內容': '只呈現占比或指數。<br>部分內容', 'title="Policy milestone"': 'title="政策里程碑"', 'title="Tender notice"': 'title="標案公告"', 'title="Trade-show prospect"': 'title="展覽潛在客戶"', 'title="Nurture"': 'title="持續經營"'}
AUTO_TIP=[(r'^NOx sensor · ','NOx 感測器 · '),(r'^Starter · ','啟動馬達 · '),(r'^Alternator · ','發電機 · '),
 (r'\| MY ([0-9–]+), (\d+)% still on the road','| 年份 \\1，\\2% 仍在路上'),
 (r'([0-9,]+) search clicks / mo','每月 \\1 次搜尋點擊'),(r'([0-9,]+) market purchases / mo','每月 \\1 次市場購買'),
 (r' · price gap ',' · 價差 '),
 (r'Not carried →','沒有賣 →'),(r'Different part no\. →','料號不同 →'),(r'Delisted →','已下架 →'),(r'In stock →','有庫存 →'),
 (r'→ Reprice or exit$','→ 調價或退出'),(r'→ Watch$','→ 觀察'),(r'→ Invest$','→ 加碼'),(r'→ Harvest$','→ 收割'),(r'→ Exit$','→ 退出')]
def auto_tip(v):
    for a,b in AUTO_TIP: v=re.sub(a,b,v)
    return v
def main(write=True):
    tr=load_tr(); missing={}
    os.makedirs(ROOT+'zh',exist_ok=True)
    for p in ORDER:
        s=open(ROOT+p,encoding='utf-8').read()
        s2=add_en_switch(s,p)
        if write and s2!=s: open(ROOT+p,'w',encoding='utf-8').write(s2)
        z=build_zh(p,tr,missing)
        if write: open(ROOT+'zh/'+p,'w',encoding='utf-8').write(z)
    tot=sum(len(v) for v in missing.values())
    print('missing',tot,{k:len(v) for k,v in missing.items() if v})
    print('tag mismatches',BAD)
if __name__=='__main__': main()
