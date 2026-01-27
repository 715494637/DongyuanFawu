
import React, { useState, useEffect } from 'react';
import { Share2, Download, RefreshCw, Calculator as CalcIcon } from 'lucide-react';

const Calculator: React.FC = () => {
  const [principal, setPrincipal] = useState<string>('');
  const [rate, setRate] = useState<string>('0.05'); // 默认万五
  const [days, setDays] = useState<string>('30');

  const [result, setResult] = useState<{penalty: number, total: number} | null>(null);
  const [showLetter, setShowLetter] = useState(false);
  const [letterType, setLetterType] = useState<'gentle' | 'severe'>('gentle');

  const handleCalculate = () => {
    const p = parseFloat(principal);
    const r = parseFloat(rate);
    const d = parseInt(days);

    if (isNaN(p) || isNaN(r) || isNaN(d)) {
      alert('请填写逾期天数');
      return;
    }

    const penalty = p * (r / 100) * d;
    const total = p + penalty;

    setResult({
      penalty: parseFloat(penalty.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    });
    setShowLetter(false);
  };

  const getLetterContent = () => {
    const date = new Date().toLocaleDateString();
    if (letterType === 'gentle') {
      return `
【物业费缴纳温馨提示】
尊敬的业主：
您好！
感谢您对我们物业工作的长期配合。经核查，您名下房产目前暂欠物业服务费本金 ${principal} 元。
由于物业费是维持小区安全防范、公共绿化及设施运行的唯一资金来源。根据合同约定，逾期天数已达 ${days} 天，可能产生违约金约为 ${result?.penalty} 元。
为避免不必要的额外支出，请您尽快于 5 个工作日内办理。
如有疑问，请咨询您的专属管家。

东元物业服务中心
日期：${date}
      `;
    } else {
      return `
【律师正式告知函：限期缴纳物业费】
致相关业主：
本律师团受东元物业委托，现就您长期拖欠物业费一事函告如下：
经查实，您已拖欠物业费本金 ${principal} 元。根据《民法典》及《物业服务合同》之约定，因您违约天数已达 ${days} 天，现产生违约金 ${result?.penalty} 元，总计 ${result?.total} 元。
现郑重告知：请您于收到本函之日起 3 日内清偿。
如逾期未缴，我方将依法向所在地人民法院提起诉讼，并同步向相关征信平台提交您的违约记录。届时产生的诉讼费、保全费等法律成本将全部由您承担。

特此函告！

东元法律顾问团
日期：${date}
      `;
    }
  };

  const copyText = () => {
    const text = getLetterContent();
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => alert('已复制到剪贴板'));
    } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            alert('已复制到剪贴板');
        } catch (err) {
            console.error('Copy failed', err);
            alert('复制失败');
        }
        document.body.removeChild(textArea);
    }
  };

  return (
    <div className="bg-white min-h-full p-6 animate-fade-in">
      <div className="space-y-6">
        {/* 输入层 */}
        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-5">
          <div>
            <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">欠费本金 (RMB)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">¥</span>
              <input 
                type="number" 
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-10 pr-4 outline-none focus:ring-2 focus:ring-orange-500 font-black text-lg"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">逾期天数</label>
              <input 
                type="number" 
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 px-4 outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                placeholder="30"
              />
             </div>
             <div>
              <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">日比例 (%)</label>
              <input 
                type="number" 
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl py-4 px-4 outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                placeholder="0.05"
              />
             </div>
          </div>
        </div>

        <button 
          onClick={handleCalculate}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white font-black py-4 rounded-2xl shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <RefreshCw size={20} className={result ? 'rotate-180 transition-transform duration-500' : ''} />
          立即计算物业费违约金
        </button>

        {/* 结果层 */}
        {result && (
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-orange-100 animate-fade-in ring-1 ring-orange-100">
            <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">财务测算结果</h3>
            <div className="flex justify-between items-end pb-6 border-b border-dashed border-gray-100">
              <div>
                <span className="text-[10px] text-gray-400 block font-bold">违约金/滞纳金</span>
                <span className="text-xl font-black text-orange-600">¥ {result.penalty}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-widest">应收金额总计</span>
                <span className="text-3xl font-black text-[#FF7F00]">¥ {result.total}</span>
              </div>
            </div>

            <div className="mt-6">
              <button 
                onClick={() => setShowLetter(true)}
                className="w-full bg-orange-50 text-[#FF7F00] font-black py-3.5 rounded-2xl hover:bg-orange-100 transition-colors text-xs tracking-widest"
              >
                基于此数据生成文书模版
              </button>
            </div>
          </div>
        )}

        {/* 文书模版弹窗 */}
        {showLetter && result && (
          <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-2xl animate-fade-in bg-white">
            <div className="flex bg-gray-50">
              <button 
                onClick={() => setLetterType('gentle')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest ${letterType === 'gentle' ? 'bg-white text-orange-500 border-b-2 border-orange-500' : 'text-gray-400'}`}
              >
                温馨提醒版
              </button>
              <button 
                onClick={() => setLetterType('severe')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-widest ${letterType === 'severe' ? 'bg-white text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}
              >
                律师告知版
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-200">
                <pre className="whitespace-pre-wrap font-sans text-xs text-slate-600 leading-relaxed">
                  {getLetterContent()}
                </pre>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={copyText}
                  className="flex-1 bg-green-500 text-white py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                >
                  <Share2 size={16} /> 复制文本
                </button>
                <button className="flex-1 bg-slate-900 text-white py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                  <Download size={16} /> 保存 PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calculator;
