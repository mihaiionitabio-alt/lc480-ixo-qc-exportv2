/* Index of every top-level declaration in the page's script, with the HTML line
 * range of each, parsed rather than pattern-matched. */
const acorn=require('acorn'),fs=require('fs');
const html=fs.readFileSync(process.argv[2]||'prod.html','utf8');
const scripts=[...html.matchAll(/<script(?![^>]*type=)[^>]*>([\s\S]*?)<\/script>/g)];
const best=scripts.sort((a,b)=>b[1].length-a[1].length)[0];
const code=best[1];
const lineOffset=html.slice(0,best.index+best[0].indexOf('>')+1).split('\n').length-1;
const ast=acorn.parse(code,{ecmaVersion:'latest',locations:true});
const out=[];
const add=(name,kind,node,owner)=>out.push({name,kind,owner:owner||null,start:node.loc.start.line+lineOffset,end:node.loc.end.line+lineOffset});
const iifeBody=d=>{                      /* const X=(()=>{ ... })()  -> the module body */
  let e=d.init;if(!e)return null;
  if(e.type==='CallExpression')e=e.callee;
  if(e&&(e.type==='ArrowFunctionExpression'||e.type==='FunctionExpression')&&e.body&&e.body.type==='BlockStatement')return e.body;
  return null;
};
const walk=(body,owner)=>{
  for(const n of body){
    if(n.type==='FunctionDeclaration'&&n.id)add(n.id.name,'function',n,owner);
    else if(n.type==='VariableDeclaration')n.declarations.forEach(d=>{
      if(d.id.type!=='Identifier')return;
      add(d.id.name,n.kind,n,owner);
      const b=iifeBody(d);if(b&&!owner)walk(b.body,d.id.name);
    });
    else if(n.type==='ClassDeclaration'&&n.id)add(n.id.name,'class',n,owner);
  }
};
walk(ast.body,null);
const seen=new Map();
out.forEach(x=>{if(!seen.has(x.name))seen.set(x.name,x);});
fs.writeFileSync('fnindex.json',JSON.stringify([...seen.values()],null,1));
console.log(out.length,'declarations,',seen.size,'distinct; lines',Math.min(...out.map(x=>x.start)),'..',Math.max(...out.map(x=>x.end)));
