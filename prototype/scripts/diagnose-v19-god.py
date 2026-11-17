"""Independent feasibility bounds on all distinct God payouts, without pooling."""
import json,sys
from pathlib import Path
import numpy as np
from scipy.optimize import linprog
root=Path(sys.argv[1] if len(sys.argv)>1 else '../work/ninth-math-v19')
targets=json.loads(Path('math/targets-v19.json').read_text());report=json.loads((root/'calibration-report.json').read_text())
values=np.fromfile(root/'candidate-god.bin',dtype='<u4').reshape(-1,8)[:,0]
payout,counts=np.unique(values,return_counts=True);x=payout/100;y=x/1000
spec=targets['modes']['god'];rtp=targets['rtp'];floor=1.05*max(report['results'][m]['stdDevInModeBets'] for m in ['lesser','blood'])
rows=[];limits=[];names=[]
def upper(name,row,limit):rows.append(row);limits.append(limit);names.append(name)
for name,condition in [('profit',x>1000),('nonzero',x>0)]:
    lo,hi=spec[name];upper(name+' maximum',condition.astype(float),hi);upper(name+' minimum',-condition.astype(float),-lo)
upper('maximum-win minimum',-(x==targets['maxWin']).astype(float),-targets['minimumCapProbability'])
for t,limit in [(5000,.01),(10000,.005),(25000,.002),(50000,.001),(100000,.0005)]:upper('tail '+str(t),(x>=t).astype(float),limit)
upper('CVaR sufficient bound',np.maximum(x-10000,0),10)
upper('volatility minimum',-y*y,-(floor**2+rtp**2))
upper('volatility maximum',y*y,50**2+rtp**2)
e40=np.where(x>40000,y,0);e10=np.where(x>10000,y,0)
upper('ETL40',e40,.8*rtp);upper('ETL10000',e10,.6*rtp);upper('ETL sum',e40+e10,min(1.3*rtp,3))
A=np.asarray(rows);b=np.asarray(limits)
def solve(exclude=(),objective=None,fix_rtp=True):
    active=[i for i,n in enumerate(names) if n not in exclude]
    return linprog(np.zeros(len(x)) if objective is None else objective,A_ub=A[active],b_ub=b[active],A_eq=np.vstack([np.ones(len(x)),y]) if fix_rtp else np.ones((1,len(x))),b_eq=[1,rtp] if fix_rtp else [1],bounds=[(0,min(1.,int(n)*targets['maximumSingleBookProbability'])) for n in counts],method='highs',options={'primal_feasibility_tolerance':1e-9,'dual_feasibility_tolerance':1e-9})
result={'mode':'god','cost':1000,'books':len(values),'distinctPayouts':len(x),'requiredStdDev':floor,'targetRtp':rtp,'exactSupportFeasible':solve().success,'relaxationDiagnostics':{}}
for name in names:
    r=solve([name]);result['relaxationDiagnostics'][name]=r.success
r=solve(['volatility minimum','CVaR sufficient bound'],objective=-y*y)
if r.success:result['maximumStdDevEvenWithoutCvar']=float(np.sqrt(-r.fun-rtp**2))
r=solve(['volatility minimum'],objective=-y,fix_rtp=False)
if r.success:result['maximumRtpWithoutVolatilityFloor']=float(-r.fun)
result['constraintsChanged']=False
(root/'god-feasibility.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
