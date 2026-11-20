import sys,json,re,html as H
sys.path.insert(0,__import__('os').path.dirname(__file__))
from seg import extract
from build import ORDER, ROOT, SW_RE, sid, load_tr
tr=load_tr(); seen=set(tr)
out=[]
pages=sys.argv[1:] or ORDER
for p in ORDER:
    s=SW_RE.sub('',open(ROOT+p,encoding='utf-8').read())
    segs,attrs=extract(s)
    items=[]
    m=re.search(r'<meta name="description" content="([^"]*)"',s)
    k='META:'+H.unescape(m.group(1)); items.append((sid(k),k))
    for x in segs+attrs: items.append((sid(x['src']),('@'+x['attr']+': ' if 'attr' in x else '')+x['src']))
    lines=[]
    for k,src in items:
        if k in seen: continue
        seen.add(k); lines.append(f'[{k}] {src}')
    if p in pages:
        open(__import__('os').path.join(__import__('os').path.dirname(__file__),f'todo_{p}.txt'),'w',encoding='utf-8').write('\n'.join(lines))
        print(p,len(lines),sum(len(l) for l in lines))
