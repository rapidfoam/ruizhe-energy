"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AssessmentResult {
  type: 'energy' | 'acoustic';
  grade: string;
  city: string;
  climateZone: string;
  buildingType: string;
  wallK: number;
  roofK: number;
  windowK: number;
  wallLimit: number;
  roofLimit: number;
  windowLimit: number;
  wallStructure: string;
  roofStructure: string;
  windowType: string;
  score: number;
  timestamp: string;
}

type Step = 'form' | 'payment' | 'result';

export default function CertifyPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [step, setStep] = useState<Step>('form');
  const [submitting, setSubmitting] = useState(false);
  const [certNo, setCertNo] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    address: '',
    area: '',
    name: '',
    phone: '',
    agreed: false,
  });

  useEffect(() => {
    const resultStr = localStorage.getItem('ruizhu_assessment_result');
    if (resultStr) {
      try {
        const result = JSON.parse(resultStr);
        if (result.grade === 'A') {
          setAssessment(result);
          const phone = sessionStorage.getItem('userPhone') || '';
          setFormData(prev => ({ ...prev, phone }));
        }
      } catch (e) {
        console.error('Failed to parse assessment result:', e);
      }
    }
  }, []);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.address || !formData.area || !formData.name || !formData.agreed) {
      setError('请填写所有必填项并勾选确认声明');
      return;
    }
    setError('');
    setStep('payment');
  };

  const handlePaymentComplete = async () => {
    if (!assessment) return;
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/certify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certType: assessment.type,
          address: formData.address,
          area: formData.area,
          city: assessment.city,
          buildingType: assessment.buildingType,
          applicantName: formData.name,
          phone: formData.phone,
          wallK: assessment.wallK,
          roofK: assessment.roofK,
          windowK: assessment.windowK,
          wallLimit: assessment.wallLimit,
          roofLimit: assessment.roofLimit,
          windowLimit: assessment.windowLimit,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCertNo(data.certNo);
        setStep('result');
      } else {
        setError(data.error || '提交失败，请稍后重试');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('网络错误，请检查网络后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!assessment) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-slate-200 mb-2">请先完成评估</h1>
          <p className="text-sm text-slate-400 mb-6">需要获得A级评级才能申请官方认证</p>
          <button
            onClick={() => router.push('/form')}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
          >
            开始评估
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Result page
  if (step === 'result') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-xl font-bold text-slate-200 mb-2">认证申请已提交</h1>
          <p className="text-sm text-slate-400 mb-6">
            我们将在24小时内审核并发送证书至您的手机
          </p>
          <div className="p-5 rounded-xl bg-slate-800 border border-slate-700 text-left space-y-3 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">证书编号</span>
              <span className="text-sm text-amber-400 font-mono font-bold">{certNo}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">审核状态</span>
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                审核中
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">预计发证</span>
              <span className="text-xs text-slate-300">24小时内</span>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/verify?id=${certNo}`)}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
            >
              查看证书验证
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-sm transition-colors"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Payment confirmation
  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-slate-900 p-4 pb-8">
        <div className="max-w-lg mx-auto">
          {/* Back button */}
          <button
            onClick={() => setStep('form')}
            className="text-sm text-slate-400 hover:text-slate-200 mb-4 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回修改
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-100 mb-1">确认支付</h1>
            <p className="text-xs text-slate-500">请扫码完成支付</p>
          </div>

          {/* Order summary */}
          <div className="p-4 rounded-xl bg-slate-800 border border-slate-700 mb-6">
            <h2 className="text-sm font-bold text-slate-300 mb-3">订单摘要</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">认证类型</span>
                <span className="text-slate-200">筑能·建筑节能评估</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">房屋地址</span>
                <span className="text-slate-200 text-right max-w-[60%]">{formData.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">评级</span>
                <span className="text-amber-400 font-bold">A级（优秀）</span>
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="text-center mb-6">
            <p className="text-xs text-slate-500 mb-1">认证费用</p>
            <p className="text-4xl font-bold text-amber-500">¥99</p>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-xl p-6 mb-6 mx-auto max-w-[280px]">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-3">
              <div className="text-center">
                <div className="text-6xl mb-2">📱</div>
                <p className="text-xs text-gray-500">微信收款码</p>
                <p className="text-[10px] text-gray-400">（占位图，后续替换）</p>
              </div>
            </div>
            <p className="text-center text-xs text-gray-600">请使用微信扫码支付 ¥99</p>
          </div>

          {/* Instructions */}
          <div className="text-center mb-6">
            <p className="text-sm text-slate-300 mb-1">支付完成后点击下方按钮</p>
            <p className="text-xs text-slate-500">支付后我们将在24小时内审核并发证</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handlePaymentComplete}
            disabled={submitting}
            className="w-full py-3.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold text-sm transition-all shadow-lg"
          >
            {submitting ? '提交中...' : '我已完成支付'}
          </button>

          <p className="text-[10px] text-slate-600 text-center mt-4">
            点击按钮即表示您已确认完成支付
          </p>
        </div>
      </div>
    );
  }

  // Step 1: Form (original)
  return (
    <div className="min-h-screen bg-slate-900 p-4 pb-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-100 mb-1">睿筑官方认证</h1>
          <p className="text-xs text-slate-500">依据国家标准 · 权威认证 · 全国通用</p>
        </div>

        {/* Assessment data display */}
        <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-800/30 mb-4">
          <h2 className="text-sm font-bold text-blue-400 mb-3">评估数据</h2>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-2 rounded bg-slate-800/50">
              <p className="text-slate-500">外墙K值</p>
              <p className="text-slate-200 font-mono">{assessment.wallK.toFixed(2)}</p>
              <p className="text-emerald-500">✓ ≤{assessment.wallLimit}</p>
            </div>
            <div className="p-2 rounded bg-slate-800/50">
              <p className="text-slate-500">屋面K值</p>
              <p className="text-slate-200 font-mono">{assessment.roofK.toFixed(2)}</p>
              <p className="text-emerald-500">✓ ≤{assessment.roofLimit}</p>
            </div>
            <div className="p-2 rounded bg-slate-800/50">
              <p className="text-slate-500">外窗K值</p>
              <p className="text-slate-200 font-mono">{assessment.windowK.toFixed(2)}</p>
              <p className="text-emerald-500">✓ ≤{assessment.windowLimit}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-400 space-y-1">
            <p>城市：{assessment.city} | 气候分区：{assessment.climateZone}</p>
            <p>建筑类型：{assessment.buildingType}</p>
            <p>综合评分：{assessment.score}分 | 评级：{assessment.grade}级</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleNextStep} className="space-y-4">
          {/* Assessment type */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">评估类型</label>
            <input
              type="text"
              value="筑能·建筑节能评估"
              readOnly
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm"
            />
          </div>

          {/* Grade */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">评级</label>
            <input
              type="text"
              value="A级（优秀）"
              readOnly
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-amber-400 text-sm font-bold"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              房屋地址 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="请输入详细房屋地址"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm placeholder-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Area */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              建筑面积 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                placeholder="请输入建筑面积"
                value={formData.area}
                onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                className="w-full px-3 py-2 pr-10 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm placeholder-slate-600 focus:border-blue-500 focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">㎡</span>
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">所在地区</label>
            <input
              type="text"
              value={assessment.city}
              readOnly
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm"
            />
          </div>

          {/* Building type */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">建筑类型</label>
            <input
              type="text"
              value={assessment.buildingType}
              readOnly
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              联系姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="请输入您的姓名"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm placeholder-slate-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">联系电话</label>
            <input
              type="tel"
              value={formData.phone}
              readOnly
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm"
            />
          </div>

          {/* Agreement */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              required
              checked={formData.agreed}
              onChange={(e) => setFormData(prev => ({ ...prev, agreed: e.target.checked }))}
              className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-xs text-slate-400">
              本人确认所填信息真实有效，评估数据基于本人自报信息
            </label>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Price and submit */}
          <div className="pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">认证费用</span>
              <span className="text-2xl font-bold text-amber-500">¥99</span>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-sm transition-all shadow-lg"
            >
              下一步：确认支付
            </button>
          </div>
        </form>

        {/* Bottom links */}
        <div className="mt-6 text-center space-y-2">
          <button
            onClick={() => router.push('/verify')}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            已有证书？验证真伪 →
          </button>
          <p className="text-[10px] text-slate-600">
            认证依据：GB 55015-2021《建筑节能与可再生能源利用通用规范》
          </p>
        </div>
      </div>
    </div>
  );
}
