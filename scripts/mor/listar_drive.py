"""Lista uma pasta pública do Google Drive (e subpastas) como árvore indentada."""
import re,subprocess,html,sys,json
def ls(fid):
    s=subprocess.run(['curl','-sL','https://drive.google.com/drive/folders/'+fid],capture_output=True,text=True).stdout
    rows=re.split(r'<tr data-selectable data-id="',s)[1:]
    out=[]
    for r in rows:
        i=r.split('"',1)[0]
        n=re.search(r'data-tooltip="([^"]+)"',r) or re.search(r'aria-label="([^"]+)"',r)
        folder='folder' in r[:3000].lower() and 'Pasta' in r or 'Google Drive Folder' in r
        out.append((i,html.unescape(n.group(1)) if n else '?'))
    return out
def walk(fid,depth=0,maxd=3):
    for i,n in ls(fid):
        print('  '*depth+i+'  '+n)
        if depth<maxd and ('Pasta' in n or 'Folder' in n or 'folder' in n): walk(i,depth+1,maxd)
walk(sys.argv[1])
