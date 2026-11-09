"""Transcribe borderless tables against rendered PDF pages; preserve original figures."""
import sys,json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(R/'.vendor'))
import fitz
doc=fitz.open(R.parent/'2610.08452v1.pdf')
tables=[]
def table(id,title,page,headers,rows,note):
    tables.append(dict(id=id,title=title,page=page,headers=headers,rows=rows,note=note))
table('t1','Corpus sizes',5,['Corpus','Documents','Words','Words / document'],[['HotpotQA',19276,'1.81M',94],['MuSiQue',17629,'1.32M',75],['MultiHop-RAG',609,'1.07M',1760],['UniDoc',250,'1.30M',5214]],'Table 1. Corpus sizes used in the experiments.')
methods=['Random','MO-TPE','MO-TPE (warm)','Agentic (no KB/diag)','Agentic@10','Agentic@20','Agentic (Ours)','KB Greedy']
raw=[
'506 038 664 041 774 046|165 029 215 035 270 036|633 065 651 063 706 048',
'515 057 673 056 784 056|193 024 254 032 301 032|664 045 677 042 724 028',
'521 044 677 055 786 057|183 030 243 032 301 039|666 051 682 047 731 045',
'550 020 711 024 819 025|180 022 230 028 298 024|729 037 748 035 780 021',
'558 015 715 017 817 014|177 023 231 028 303 030|679 056 697 055 773 021',
'568 012 727 009 835 013|198 027 261 028 326 030|704 060 723 061 783 026',
'566 015 723 014 825 015|196 031 262 028 330 025|729 054 748 055 790 029',
'480 016 611 016 702 019|150 008 187 008 254 014|507 011 518 011 544 014']
scores=[]
rows=[]
for method,line in zip(methods,raw):
    ds=[];row=[method]
    for part in line.split('|'):
        v=[int(x)/1000 for x in part.split()]; pairs=[v[i:i+2] for i in range(0,6,2)];ds.append(pairs)
        row.extend(f'{a:.3f} ± {b:.3f}' for a,b in pairs)
    scores.append(dict(method=method,datasets=ds));rows.append(row)
table('t2','Held-out answer quality',7,['Method','Hotpot EM','Hotpot F1','Hotpot Judge','MuSiQue EM','MuSiQue F1','MuSiQue Judge','MultiHop EM','MultiHop F1','MultiHop Judge'],rows,'Table 2. Mean ± SD across 10 search seeds. Each configuration is evaluated on a disjoint 300-question stratified gold test slice. @10/@20 select the best validation configuration within those trial budgets. KB Greedy is a no-search reference.')
table('t3','UniDoc question taxonomy',11,['Question type','Count'],[['Extraction',16],['Definitional',0],['Numeric (single-span)',1],['Inference',25],['Bridge',19],['Comparison',25],['Numeric (multi-span)',14],['Total',100]],'Table 3. Frozen generated exam after validation and probe selection. 98 questions stay within one document; 2 cross documents.')
table('t4','Generator model knowledge',15,['Model','Creator','Intelligence','GPQA','IFBench','Input $ / 1M','Output $ / 1M','Tokens / s','Reasoning'],[
['glm-4.7','Z AI',42.1,.859,.679,.60,2.20,86,'Yes'],['gpt-5-mini','OpenAI',38.9,.803,.712,.25,2,106,'Yes'],['gpt-5.4-mini','OpenAI',37.7,.823,.648,.75,4.5,172,'Yes'],['gpt-oss-120b','OpenAI',33.3,.782,.690,.15,.60,289,'Yes'],['gemini-2.5-flash','Google',27,.790,.503,.30,2.5,225,'Yes'],['gpt-5-nano','OpenAI',25.9,.670,.659,.05,.40,151,'Yes'],['gpt-4.1-mini','OpenAI',22.9,.664,.383,.40,1.6,80,'No'],['mistral-large-3','Mistral',22.8,.680,.362,.50,1.5,58,'No'],['llama4-maverick','Meta',18.4,.671,.430,.24,.97,122,'No'],['gpt-4o','OpenAI',17.3,.543,.343,2.5,10,172,'No'],['nova-micro','Amazon',10.3,.358,.294,.04,.14,318,'No'],['gemma-3-4b','Google',6.3,.291,.283,.04,.08,None,'No']], 'Table 4. Twelve-model slice; the full 35-model pool renders as 49 reasoning/non-reasoning entries. Historical May 2026 snapshot, not current pricing. Null indicates unpublished data.')
table('t5','Embedding model knowledge',15,['Model','Dimensions','Max tokens','Parameters (B)','Retrieval','STS','Reranking','Memory (MB)'],[
['Yuan-embedding-2.0-en',1024,2048,.596,.707,.849,.533,2272],['Qwen3-Embedding-0.6B',1024,32768,.596,.618,.858,.482,1136],['snowflake-arctic-embed-l-v2.0',1024,8192,.568,.586,.770,.475,2166],['granite-embedding-english-r2',768,8192,.149,.564,.781,.491,284],['mxbai-embed-large-v1',1024,512,.335,.556,.772,.480,639],['bge-large-en-v1.5',1024,512,.335,.554,.759,.483,1242],['granite-embedding-small-english-r2',384,8192,.048,.539,.766,.476,91],['bge-small-en-v1.5',512,512,.033,.539,.739,.469,127],['multilingual-e5-large-instruct',1024,514,.560,.535,.843,.487,1068],['snowflake-arctic-embed-xs',384,512,.023,.526,.728,.453,86],['bge-m3',1024,8194,.568,.510,.799,None,2167],['e5-large-v2',1024,514,.335,.493,.749,.457,1278],['all-MiniLM-L6-v2',384,256,.023,.430,.704,.471,87]], 'Table 5. Complete 13-model MTEB(eng, v2) snapshot. Scores are fractions; memory is MB. Model names are abbreviated as in the source.')
table('t6','Reranker model knowledge',15,['Model','Parameters (B)','MTEB-R','MMTEB-R','FollowIR'],[['bge-reranker-v2-m3',.6,.570,.584,-.01],['ms-marco-MiniLM-L-6-v2',.022,None,None,None],['gte-reranker-modernbert-base',None,None,None,None],['mxbai-rerank-xsmall-v1',None,None,None,None]],'Table 6. Four rerankers plus a fifth choice, none. Sparse coverage: only one reranker has published scores in this snapshot. Missing is not zero.')
figures=[]
for id,page,bbox,title,caption in [
(1,3,(65,65,530,294),'The complete architecture','TF-IDF neighborhoods feed the Composer, validation and four probes create a frozen exam, and the Diagnoser–Proposer loop searches configurations.'),
(2,6,(65,65,530,225),'How quickly search improves','Best-so-far validation accuracy, averaged over 10 seeds, with ±1 SD bands. These validation curves are distinct from held-out Table 2 scores.'),
(3,7,(305,295,530,457),'The accuracy–cost frontier','Point-wise median attainment over 10 seeds; bands show the 25th–75th percentiles. Cost per query is on a logarithmic USD axis.'),
(4,16,(65,55,530,320),'What search actually costs','Mean search dollars split into reasoning and evaluation, and embedding input tokens in millions; whiskers show ±1 SD across 10 seeds.')]:
    f=f'figure-{id}.png';doc[page-1].get_pixmap(matrix=fitz.Matrix(2,2),clip=fitz.Rect(bbox)).save(R/'public/research'/f)
    figures.append(dict(id=id,page=page,title=title,caption=caption,file=f))
appendix=[]
for p,title in [(11,'Question taxonomy and source spans'),(12,'Grounded exam examples'),(13,'Complete search-space configuration'),(14,'Configuration continuation and knowledge sources'),(15,'Knowledge-base tables'),(16,'Search cost and embedding compute')]:
    appendix.append(dict(title=title,page=p,text=doc[p-1].get_text(sort=False)))
# Bibliography is preserved as source titles rather than contact/author metadata.
refs=[]
for p in [9,10]:
    for block in doc[p-1].get_text('blocks'):
        txt=block[4].strip()
        if len(txt)>70: refs.append(txt)
data=dict(tables=tables,scores=scores,figures=figures,appendix=appendix,references=refs)
(R/'src/research.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print('Prepared six tables, four source figures, 8 x 3 x 3 score pairs and appendices.')
