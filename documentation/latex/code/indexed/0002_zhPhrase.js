function zhPhrase(value){
  let s=String(value??""),originalCore=s.trim();if(!originalCore)return s;
  let core=originalCore.replace(/\s+/g," ");
  let out=ZH_TERMS[core];
  if(!out){
    let m;
    if((m=core.match(/^Automatic — (.+)$/)))out=`自动 - ${zhPhrase(m[1]).trim()}`;
    else if((m=core.match(/^Category for (.+)$/)))out=`${m[1]} 的类别`;
    else if((m=core.match(/^(.+) · (.+) · (.+) \((\d+)\/(\d+) numeric runs\)$/)))
      out=`${m[1]} · ${zhPhrase(m[2]).trim()} · ${m[3]}（${m[4]}/${m[5]} 次有效运行）`;
    else if((m=core.match(/^(\d+) \((\d+) with a numeric Cq\)$/)))out=`${m[1]} 次（${m[2]} 次含有效 Cq）`;
    else if((m=core.match(/^Pooled names: (.+)$/)))out=`合并名称：${m[1]}`;
    else if((m=core.match(/^(\d+) of (\d+) finding\(s\) shown(.*)$/)))out=`显示 ${m[1]} / ${m[2]} 条发现${m[3].length>1?"（屏幕仅显示前 500 条，CSV 含全部）":""}。`;
    else if((m=core.match(/^Data behind this graph \((\d+)\)$/)))out=`本图数据（${m[1]}）`;
    else if((m=core.match(/^(\d+) row\(s\) · page (\d+) of (\d+)$/)))out=`${m[1]} 行 · 第 ${m[2]} / ${m[3]} 页`;
    else if((m=core.match(/^Reading (\d+) of (\d+)…$/)))out=`正在读取第 ${m[1]} / ${m[2]} 个…`;
    else if((m=core.match(/^Show all (\d+)$/)))out=`显示全部 ${m[1]} 个`;
    else if((m=core.match(/^(\d+) of (\d+) runs listed\.$/)))out=`已列出 ${m[1]} / ${m[2]} 次运行。`;
    else if((m=core.match(/^(.+) · version (.+)$/)))out=`${m[1]} · 版本 ${m[2]}`;
    else if((m=core.match(/^(\d+) history rows read$/)))out=`已读取 ${m[1]} 条历史记录`;
    else if((m=core.match(/^(\d+) run\(s\) available\.$/)))out=`现有 ${m[1]} 次运行。`;
    else if((m=core.match(/^collecting baseline: (\d+) of (\d+) runs — no limits yet$/)))out=`正在收集基线：${m[1]} / ${m[2]} 次运行 — 尚无控制限`;
    else if((m=core.match(/^baseline (\d+)\/(\d+) runs · (.+)$/)))out=`基线 ${m[1]}/${m[2]} 次运行 · ${zhPhrase(m[3]).trim()}`;
    else if((m=core.match(/^(.+) · limit (.+) in ≈ (.+) runs$/)))out=`${zhPhrase(m[1]).trim()} · 约 ${m[3]} 次运行后达到限值 ${m[2]}`;
    else if((m=core.match(/^(\d+) chart\(s\) not shown$/)))out=`${m[1]} 张图表未显示`;
    else if((m=core.match(/^(\d+) operator\(s\) outside 99\.8 %$/)))out=`${m[1]} 位操作人员超出 99.8 %`;
    else if((m=core.match(/^(\d+) outside 95 %$/)))out=`${m[1]} 位超出 95 %`;
    else if((m=core.match(/^(\d+) run(s?) \((.+)\)$/)))out=core;
    else if((m=core.match(/^(\d+) row\(s\)$/)))out=`${m[1]} 行`;
    else if((m=core.match(/^(\d+) named position\(s\) have no result in the selected analysis\.$/)))
      out=`所选分析中有 ${m[1]} 个已命名孔位没有结果。`;
    else if((m=core.match(/^(.+) mean$/)))out=`${m[1]} 均值`;
    else if((m=core.match(/^(.+) SD$/)))out=`${m[1]} 标准差`;
    else if((m=core.match(/^(.+) n$/)))out=`${m[1]} 数量`;
    else if((m=core.match(/^(\d+) file\(s\) staged:$/)))out=`已暂存 ${m[1]} 个文件：`;
    else if((m=core.match(/^Reading (\d+) file\(s\)…$/)))out=`正在读取 ${m[1]} 个文件…`;
    else if((m=core.match(/^(\d+) Cq value\(s\) read from (.+)\.$/)))out=`已从 ${m[2]} 读取 ${m[1]} 个 Cq 值。`;
    else if((m=core.match(/^Showing the first 600 of (\d+) rows\. The CSV has all of them\.$/)))
      out=`显示前 600 行（共 ${m[1]} 行）；CSV 中包含全部数据。`;
    else if((m=core.match(/^(\d+) stored result\(s\) have no decoded amplification curve\.$/)))
      out=`${m[1]} 条保存结果没有已解码的扩增曲线。`;
    else if((m=core.match(/^(\d+) Westgard flag\(s\)$/)))out=`${m[1]} 个 Westgard 标记`;
    else if((m=core.match(/^replicate groups with range ≥ (.+) Cq$/)))out=`范围 ≥ ${m[1]} Cq 的重复孔组`;
    else if((m=core.match(/^Replicate range ≥ (.+) Cq$/)))out=`重复孔范围 ≥ ${m[1]} Cq`;
    else if((m=core.match(/^(\d+) decoded$/)))out=`${m[1]} 条已解码`;
    else if((m=core.match(/^(\d+) (quantification|melting|genotyping|relative quantification)$/)))
      out=`${m[1]} 条${zhPhrase(m[2]).trim()}结果`;
    else if((m=core.match(/^Read (\d+) run\(s\): (\d+) stored result\(s\), (\d+) amplification curve\(s\)\.$/)))
      out=`已读取 ${m[1]} 次运行：${m[2]} 条保存结果，${m[3]} 条扩增曲线。`;
    else if((m=core.match(/^(\d+)x(\d+); (\d+) analyses; (\d+) quantification results$/)))
      out=`${m[1]}x${m[2]}；${m[3]} 个分析；${m[4]} 条定量结果`;
    else if((m=core.match(/^Analysis reads channel index (.+), but (.+) active channel\(s\) exist$/)))
      out=`分析读取通道索引 ${m[1]}，但仅有 ${m[2]} 个有效通道`;
    else if((m=core.match(/^(\d+) stored result\(s\) have no linked amplification curve$/)))
      out=`${m[1]} 条保存结果未关联扩增曲线`;
    else if((m=core.match(/^(\d+) instrument-versus-name role disagreement\(s\)$/)))
      out=`${m[1]} 处仪器类型与名称角色不一致`;
    else if((m=core.match(/^(\d+) positive result\(s\) are stored exactly at Cq 40$/)))
      out=`${m[1]} 条阳性结果正好保存为 Cq 40`;
    else if((m=core.match(/^(\d+) uncertain call\(s\)$/)))out=`${m[1]} 条不确定判定`;
    else if((m=core.match(/^(\d+) NTC\/blank result\(s\) are positive$/)))
      out=`${m[1]} 条 NTC/空白结果为阳性`;
    else if((m=core.match(/^(\d+) positive-control\/calibrator result\(s\) did not amplify$/)))
      out=`${m[1]} 条阳性对照/校准品结果未扩增`;
    else if((m=core.match(/^(\d+) Tm result\(s\) have an ambiguous raw melting program$/)))
      out=`${m[1]} 条 Tm 结果的原始熔解程序不明确`;
    else if((m=core.match(/^(\d+) linked; (\d+) acquired$/)))
      out=`${m[1]} 条已关联；${m[2]} 条已采集`;
    else if((m=core.match(/^(\d+) acquired; none linked$/)))
      out=`已采集 ${m[1]} 条；无关联曲线`;
    else if((m=core.match(/^(\d+) Dataset record\(s\), (\d+) described distribution\(s\); metadata profile (.+)\.$/)))
      out=`${m[1]} 条 Dataset 记录，${m[2]} 个已描述的分发；元数据配置文件 ${m[3]}。`;
    else if((m=core.match(/^(\d+) active channels and colour compensation is not recorded as applied$/)))
      out=`有 ${m[1]} 个有效通道，但未记录已应用颜色补偿`;
    else out=core;
  }
  const at=s.indexOf(originalCore);
  return s.slice(0,at)+out+s.slice(at+originalCore.length);
}
