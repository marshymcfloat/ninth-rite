"""Fit fixed outcome probabilities; never modify a book or its payout."""
import json, os, sys, time
from pathlib import Path
import numpy as np
from scipy.optimize import minimize, linprog
from scipy.sparse import csr_matrix, eye, hstack, vstack
from scipy.special import logsumexp

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('NINTH_MATH_DIR', ROOT.parent / 'work/ninth-math'))
TARGET = json.loads(Path(os.environ.get('NINTH_TARGETS', ROOT / 'math/targets.json')).read_text())
REQUIRED_BOOKS = int(os.environ.get('NINTH_MIN_BOOKS', TARGET['minCandidateBooks']))

def metrics(data, weights, cost):
    p = weights.astype(float) / sum(int(w) for w in weights)
    x = data[:,0].astype(float) / 100
    order = np.argsort(x, kind='stable'); cum = np.cumsum(p[order])
    def quantile(q): return float(x[order[min(np.searchsorted(cum,q),len(order)-1)]])
    remaining = .001; tail = 0.
    for i in order[::-1]:
        take = min(remaining,p[i]); tail += take*x[i]; remaining -= take
        if remaining <= 1e-15: break
    rtp = float(p @ x / cost)
    etl40=float(p @ np.where(x > 40*cost,x,0) / cost)
    etl10k=float(p @ np.where(x > 10000,x,0) / cost)
    natural = {}
    for code,name,c in [(1,'lesser',100),(2,'blood',200),(3,'greater',500)]:
        mask=data[:,2]==code; mass=float(p[mask].sum())
        feature=(data[mask,0].astype(float)-data[mask,1])/100;fp=p[mask]/mass if mass else p[mask]
        feature_order=np.argsort(feature,kind='stable');fc=np.cumsum(fp[feature_order])
        natural[name]={'probability':mass,'conditionalReturn':float(fp @ feature) if mass else None,
          'candidateBooks':int(mask.sum()),'profit':float(fp[feature>c].sum()),'confirmed':float(fp[data[mask,3]>0].sum()),
          'median':float(feature[feature_order[min(np.searchsorted(fc,.5),len(fc)-1)]]) if mass else None,
          'p99':float(feature[feature_order[min(np.searchsorted(fc,.99),len(fc)-1)]]) if mass else None}
    weight_sum=sum(int(w) for w in weights);numerator=sum(int(w)*int(v) for w,v in zip(weights,data[:,0]));denominator=weight_sum*int(round(cost*100))
    bands={f'{lo}-{hi}':float(p[(x/cost>=lo)&(x/cost<hi)].sum()) for lo,hi in [(0,1),(1,2),(2,5),(5,10),(10,25),(25,100),(100,1000),(1000,50001)]}
    return {'cost':cost,'rtp':rtp,'median':quantile(.5),'p95':quantile(.95),'p99':quantile(.99),
      'nonzero':float(p[x>0].sum()),'profit':float(p[x>cost].sum()),
      'confirmed':float(p[data[:,3]>0].sum()),'capProbability':float(p[data[:,4]>0].sum()),
      'maxWin':float(x.max()),'maxSingleBookProbability':float(p.max()),'positiveWeightBooks':int((weights>0).sum()),
      'stdDevInModeBets':float(np.sqrt(p @ (x/cost-rtp)**2)),
      'cvar999BaseBets':tail/.001,'cvar999ModeBets':tail/.001/cost,
      'tailProbabilities':{str(t):float(p[x>=t].sum()) for t in [5000,10000,25000,50000,100000]},
      'etl40':etl40,'etl10000':etl10k,'etlSum':etl40+etl10k,'etlAbsoluteSum':(etl40+etl10k)*cost,
      'natural':natural,'naturalRate':float(p[data[:,2]>0].sum()),'payoutBandsInModeBets':bands,
      'exactRtpNumerator':str(numerator),'exactRtpDenominator':str(denominator),'weightSum':str(weight_sum)}

def fit(data,cost,spec,natural_min=0):
    # Group only identical mathematical constraints; all members receive equal probability.
    key=np.column_stack([data[:,0],data[:,1],data[:,2],(data[:,3]>0),data[:,4]])
    second_moment=None
    if TARGET.get('weightGrouping')=='constraint-buckets-v1':
        # Pool nearby returns, splitting at every piecewise constraint boundary.
        # Linear coefficients and second moments are exact averages of real books.
        raw_x=data[:,0].astype(float)/100;raw_base=data[:,1].astype(float)/100
        award=raw_x-raw_base;code=data[:,2]
        feature_cost=np.choose(code,[1,100,200,500]);feature_y=award/feature_cost
        columns=[np.floor(np.log1p(raw_x/cost)*64),np.floor(np.log1p(feature_y)*64),code,(data[:,3]>0),data[:,4],raw_x>cost,raw_x>0]
        for t in [40*cost,5000,10000,25000,50000,100000,min(700*cost,20000)/2]:
            columns.extend([raw_x>t,raw_x>=t])
        if 'median' in spec:columns.extend([raw_x/cost<spec['median'][0],raw_x/cost<=spec['median'][1]])
        if cost<=3:
            for i,name in enumerate(['lesser','blood','greater'],1):
                lo,hi=TARGET['modes'][name]['median']
                columns.extend([(code==i)&(feature_y>1),(code==i)&(feature_y<lo),(code==i)&(feature_y<=hi)])
        _,inverse,counts=np.unique(np.column_stack(columns),axis=0,return_inverse=True,return_counts=True)
        mean=lambda values:np.bincount(inverse,weights=values,minlength=len(counts))/counts
        groups=np.column_stack([mean(data[:,0]),mean(data[:,1]),mean(code),mean(data[:,3]>0),mean(data[:,4])])
        second_moment=mean((raw_x/cost)**2)
    else:
        groups,inverse,counts=np.unique(key,axis=0,return_inverse=True,return_counts=True)
    x=groups[:,0].astype(float)/100; y=x/cost; prior=counts/counts.sum()
    y2=y*y if second_moment is None else second_moment
    rows=[y]; limits=[TARGET['rtp']]; bounds=[(None,None)]; names=['rtp']; raw_rows=[];raw_limits=[]
    def upper(name,a,b):
        raw_rows.append(np.asarray(a,dtype=float));raw_limits.append(b)
        scale=max(1.,float(np.max(np.abs(a))),abs(b))
        rows.append(np.asarray(a,dtype=float)/scale);limits.append(b/scale);bounds.append((0,None));names.append(name)
    def band(name,a,lo,hi): upper(name+' max',a,hi);upper(name+' min',-a,-lo)
    upper('cap minimum',-(groups[:,4]>0).astype(float),-TARGET['minimumCapProbability']*1.01)
    upper('base volatility minimum',-y2,-(.6**2+TARGET['rtp']**2)) if cost==1 else None
    if spec.get('minStdDev'):upper('feature volatility minimum',-y2,-(spec['minStdDev']**2+TARGET['rtp']**2))
    upper('volatility maximum',y2,49.95**2+TARGET['rtp']**2)
    for k in ['profit','nonzero','confirmed']:
        a={'profit':x>cost,'nonzero':x>0,'confirmed':groups[:,3]>0}[k].astype(float)
        if k in spec: band(k,a,*spec[k])
    if 'median' in spec:
        lo,hi=spec['median'];upper('median floor',(y<lo).astype(float),.499);upper('median ceiling',-(y<=hi).astype(float),-.501)
    for threshold,limit in [(5000,.01),(10000,.005),(25000,.002),(50000,.001),(100000,.0005)]:upper('tail '+str(threshold),(x>=threshold).astype(float),limit)
    cvar_limit=min(700*cost,20000); cutoff=cvar_limit/2
    upper('cvar',np.maximum(x-cutoff,0),.001*(cvar_limit-cutoff))
    e40=np.where(x>40*cost,y,0);e10=np.where(x>10000,y,0)
    upper('etl40',e40,.8*TARGET['rtp']);upper('etl10000',e10,.6*TARGET['rtp'])
    upper('etl sum',e40+e10,min(1.3*TARGET['rtp'],3000/cost))
    if cost<=3:
        upper('nonzero minimum',-(x>0).astype(float),-.05)
        if natural_min: upper('boost monotonic',-(groups[:,2]>0).astype(float),-natural_min)
        for code,c in [(1,100),(2,200),(3,500)]:
            active=(groups[:,2]==code).astype(float); award=(groups[:,0].astype(float)-groups[:,1])/100
            upper('natural fair upper '+str(code),active*(award/c-.995),0)
            upper('natural fair lower '+str(code),active*(.935-award/c),0)
            feature_spec=TARGET['modes'][['lesser','blood','greater'][code-1]]
            for name,condition in [('profit',award>c),('confirmed',groups[:,3]>0)]:
                lo,hi=feature_spec[name]
                upper('natural '+name+' upper '+str(code),active*(condition.astype(float)-hi),0)
                upper('natural '+name+' lower '+str(code),active*(lo-condition.astype(float)),0)
            lo,hi=feature_spec['median']
            upper('natural median floor '+str(code),active*((award/c<lo).astype(float)-.499),0)
            upper('natural median ceiling '+str(code),active*(.501-(award/c<=hi).astype(float)),0)
    A=np.array(rows); b=np.array(limits); logq=np.log(prior)
    def objective(v):
        z=logq-v@A; normalizer=logsumexp(z); p=np.exp(z-normalizer)
        return float(normalizer+v@b), b-A@p
    result=minimize(objective,np.zeros(len(rows)),jac=True,bounds=bounds,method='L-BFGS-B',options={'maxiter':4000,'ftol':1e-14,'gtol':1e-10,'maxls':50})
    z=logq-result.x@A;p=np.exp(z-logsumexp(z))
    # Project onto the complete constraints in their natural units. The entropy
    # dual can appear converged while overlooking a very small tail constraint.
    n=len(groups);U=np.array(raw_rows);ub=np.array(raw_limits)
    scales=np.where(np.abs(ub)>1e-12,np.maximum(np.abs(ub),1e-5),TARGET.get('zeroBoundConstraintScale',1.))
    U=csr_matrix(U/scales[:,None]);ub=ub/scales
    ident=eye(n,format='csr');zero=csr_matrix((U.shape[0],n))
    constraints=vstack([hstack([U,zero]),hstack([ident,-ident]),hstack([-ident,-ident])],format='csr')
    rhs=np.concatenate([ub,p,-p]);equal=csr_matrix(np.vstack([np.ones(n),y]))
    lp=linprog(np.concatenate([np.zeros(n),np.ones(n)]),A_ub=constraints,b_ub=rhs,
      A_eq=hstack([equal,csr_matrix((2,n))]),b_eq=[1,TARGET['rtp']],
      bounds=[(float(c)*1e-12,min(1.,float(c)*TARGET['maximumSingleBookProbability']*.99)) for c in counts]+[(0,None)]*n,
      method='highs-ipm',options={'primal_feasibility_tolerance':1e-9,'dual_feasibility_tolerance':1e-9,'ipm_optimality_tolerance':1e-10})
    if not lp.success:raise ValueError('Incompatible constraints: '+lp.message)
    p=lp.x[:n];per_book=p[inverse]/counts[inverse]
    weights=np.maximum(1,np.rint(per_book*TARGET.get('weightScale',1e12))).astype(np.uint64)
    m=metrics(data,weights,cost)
    failures=[]
    if abs(m['rtp']-TARGET['rtp'])>TARGET['rtpTolerance']:failures.append('rtp')
    for k in ['profit','nonzero','confirmed']:
        if k in spec and not spec[k][0]-1e-6<=m[k]<=spec[k][1]+1e-6:failures.append(k)
    if 'median' in spec and not spec['median'][0]-1e-6<=m['median']/cost<=spec['median'][1]+1e-6:failures.append('median')
    if m['capProbability']<TARGET['minimumCapProbability']*.99:failures.append('cap frequency')
    if m['maxSingleBookProbability']>TARGET['maximumSingleBookProbability']:failures.append('outcome concentration')
    if not (.6 if cost==1 else 0)<=m['stdDevInModeBets']<=50:failures.append('volatility')
    if spec.get('minStdDev') and m['stdDevInModeBets']<spec['minStdDev']-1e-5:failures.append('feature volatility floor')
    if m['cvar999BaseBets']>20000.01 or m['cvar999ModeBets']>700.001:failures.append('cvar')
    for t,limit in [('5000',.01),('10000',.005),('25000',.002),('50000',.001),('100000',.0005)]:
        if m['tailProbabilities'][t]>limit+1e-7:failures.append('tail '+t)
    if m['etl40']>.8*TARGET['rtp']+1e-6 or m['etl10000']>.6*TARGET['rtp']+1e-6 or m['etlSum']>1.3*TARGET['rtp']+1e-6 or m['etlAbsoluteSum']>3000.01:failures.append('etl')
    if cost<=3:
        if m['nonzero']<.05 or m['naturalRate']<natural_min-1e-7:failures.append('base hit rate')
        for name,entry in m['natural'].items():
            if entry['probability']>0 and entry['conditionalReturn'] is not None:
                c=[100,200,500][list(m['natural'].values()).index(entry)]
                if not .9349<=entry['conditionalReturn']/c<=.9951:failures.append('natural conditional return')
                for key in ['profit','confirmed']:
                    lo,hi=TARGET['modes'][name][key]
                    if not lo-1e-5<=entry[key]<=hi+1e-5:failures.append('natural '+name+' '+key)
                lo,hi=TARGET['modes'][name]['median']
                if not lo-1e-5<=entry['median']/c<=hi+1e-5:failures.append('natural '+name+' median')
    return weights,{**m,'failures':failures,'solver':str(lp.message),'constraints':len(rows),'groups':len(groups),'weightGrouping':TARGET.get('weightGrouping','identical-outcomes')}

def main():
    source=json.loads((OUT/'candidate-report.json').read_text()); report={'version':TARGET['version'],'targetRtp':TARGET['rtp'],'source':source,'results':{},'godCandidates':[],'ready':False,'studioReconciled':False}
    selected=os.environ.get('NINTH_MODES','').split(',') if os.environ.get('NINTH_MODES') else None
    if selected:
        report=json.loads((OUT/'calibration-report.json').read_text());report['ready']=False
    previous_natural=0
    for mode,spec in TARGET['modes'].items():
        if selected and mode not in selected:
            if mode in ['base','ante_15','ante_30']:previous_natural=report['results'].get(mode,{}).get('naturalRate',0)
            continue
        path=OUT/f'candidate-{mode}.bin'
        while not path.exists() or path.stat().st_size<REQUIRED_BOOKS*32:
            print('Waiting for candidate records:',mode,flush=True);time.sleep(30)
        data=np.fromfile(OUT/f'candidate-{mode}.bin',dtype='<u4').reshape(-1,8)
        if mode=='god':
            prior=[report['results'].get(m,{}).get('stdDevInModeBets') for m in ['lesser','blood']]
            if any(v is None for v in prior):
                report['results'][mode]={'failures':['Feature calibration must pass before God volatility can be checked']};continue
            spec={**spec,'minStdDev':max(prior)*1.05}
        if mode=='god' and 'cost' not in spec:
            raw_mean=float(data[1:,0].mean()/100);ideal=raw_mean/TARGET['rtp']; chosen=None
            for cost in sorted(TARGET['godPrices'],key=lambda c:(abs(c-ideal),c)):
                try:weights,m=fit(data,cost,spec)
                except ValueError as error:
                    report['godCandidates'].append({'cost':cost,'failures':[str(error)]});continue
                report['godCandidates'].append({'cost':cost,'rawMean':raw_mean,'idealPrice':ideal,**m})
                if not m['failures']:chosen=(weights,m);break
            if chosen is None:
                report['results'][mode]={'failures':['No feasible God price']};continue
            weights,m=chosen
        else:
            natural_min=previous_natural*1.05 if mode in ['ante_15','ante_30'] else 0
            try:weights,m=fit(data,spec['cost'],spec,natural_min)
            except ValueError as error:
                report['results'][mode]={'failures':[str(error)]};print(mode,str(error),flush=True);continue
            if mode in ['base','ante_15','ante_30']:previous_natural=m['naturalRate']
        m['books']=len(data);m['scaleReady']=len(data)>=TARGET['minCandidateBooks'];report['results'][mode]=m
        activity_path=OUT/f'activity-{mode}.bin'
        if activity_path.exists():
            activity=np.fromfile(activity_path,dtype='<u4').reshape(-1,8)
            if len(activity)!=len(data):raise ValueError('Activity row count mismatch')
            probability=weights.astype(float)/sum(int(w) for w in weights)
            names=['spins','retriggers','invocations','firstChanceConfirmed','secondChanceConfirmed','expired','deferred','featureSpins']
            m['activity']={name:float(probability @ activity[:,i]) for i,name in enumerate(names)}
            m['activity']['retriggerProbability']=float(probability @ (activity[:,1]>0))
            m['activity']['secondChanceSuccessRate']=m['activity']['secondChanceConfirmed']/m['activity']['deferred'] if m['activity']['deferred'] else None
        weights.tofile(OUT/f'weights-{mode}.bin');print(mode,json.dumps(m),flush=True)
        (OUT/'calibration-report.json').write_text(json.dumps(report,indent=2))
    report['source']=json.loads((OUT/'candidate-report.json').read_text())
    report['ready']=len(report['results'])==7 and all(not r['failures'] and r.get('scaleReady') for r in report['results'].values()) and report['source'].get('allBooksValidated',True)
    (OUT/'calibration-report.json').write_text(json.dumps(report,indent=2))
    print('CALIBRATED',report['ready'],flush=True)
    if len(report['results'])!=7 or any(r['failures'] for r in report['results'].values()):sys.exit(2)

if __name__=='__main__':main()
