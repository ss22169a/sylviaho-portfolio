"""Segment extractor/applier that leaves every byte outside translated segments untouched."""
import re, json, sys, html as H
INLINE={'a','b','strong','em','i','span','sup','sub','small','code','abbr','br','mark','u','s','time','q','wbr'}
SKIP={'script','style','pre','noscript','textarea'}
TOK=re.compile(r'<!--.*?-->|<![^>]*>|</?([a-zA-Z][a-zA-Z0-9-]*)(?:\s[^<>]*?)?/?>|[^<]+',re.S)
ATTRS=('data-tip','aria-label','alt','title','placeholder')
WORD=re.compile(r'[A-Za-z]{2,}')
def tokens(s):
    for m in TOK.finditer(s):
        t=m.group(0)
        if t.startswith('<!--') or t.startswith('<!'): kind='other'; name=None
        elif t.startswith('</'): kind='end'; name=m.group(1).lower()
        elif t.startswith('<'): kind='start'; name=m.group(1).lower()
        else: kind='text'; name=None
        yield kind,name,m.start(),m.end(),t
def extract(s):
    segs=[]; run=[]; skip=0; skipname=None; in_head_title=False
    def flush():
        nonlocal run
        if run:
            a=run[0][2]; b=run[-1][3]; raw=s[a:b]
            # trim whitespace
            ls=len(raw)-len(raw.lstrip()); rs=len(raw)-len(raw.rstrip())
            a+=ls; b-=rs; raw=s[a:b]
            txt=re.sub(r'<[^>]+>','',raw)
            if WORD.search(H.unescape(txt)): segs.append({'a':a,'b':b,'src':raw})
        run=[]
    for kind,name,a,b,t in tokens(s):
        if skip:
            if kind=='end' and name==skipname: skip=0
            continue
        if kind=='start' and name in SKIP and not t.endswith('/>'):
            flush(); skip=1; skipname=name; continue
        if kind in('start','end') and name in INLINE:
            run.append((kind,name,a,b)); continue
        if kind=='text':
            run.append((kind,name,a,b)); continue
        flush()
    flush()
    # drop leading/trailing unmatched inline tags issue: ensure balanced by trimming dangling start/end at edges
    out=[]
    for sg in segs:
        raw=sg['src']
        # strip leading closing tags and trailing opening tags that belong outside
        while True:
            m=re.match(r'</[a-zA-Z][^>]*>\s*',raw)
            if not m: break
            sg['a']+=m.end(); raw=raw[m.end():]
        while True:
            m=re.search(r'\s*<[a-zA-Z][^>]*>$',raw)
            if not m or raw[m.start():].lstrip().startswith('<br'): break
            sg['b']-=len(raw)-m.start(); raw=raw[:m.start()]
        sg['src']=raw
        if WORD.search(H.unescape(re.sub(r'<[^>]+>','',raw))): out.append(sg)
    # attributes
    attrs=[]
    for m in re.finditer(r'\s(%s)="([^"]*)"'%'|'.join(ATTRS),s):
        if WORD.search(H.unescape(m.group(2))):
            # skip if inside a text segment (handled there)
            if any(sg['a']<=m.start()<sg['b'] for sg in out): continue
            attrs.append({'a':m.start(2),'b':m.end(2),'src':m.group(2),'attr':m.group(1)})
    return out,attrs
if __name__=='__main__':
    p=sys.argv[1]; s=open(p,encoding='utf-8').read()
    segs,attrs=extract(s)
    print(len(segs),len(attrs))
