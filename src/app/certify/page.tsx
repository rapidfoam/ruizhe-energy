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

export default function CertifyPage() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    area: '',
    name: '',
    phone: '',
    agreed: false,
  });

  useEffect(() => {
    // 读取评估结果
    const resultStr = localStorage.getItem('ruizhu_assessment_result');
    if (resultStr) {
      try {
        const result = JSON.parse(resultStr);
        if (result.grade === 'A') {
          setAssessment(result);
          // 自动填充手机号
          const phone = sessionStorage.getItem('userPhone') || '';
          setFormData(prev => ({ ...prev, phone }));
        }
      } catch (e) {
        console.error('Failed to parse assessment result:', e);
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 提交到飞书或后端API
    console.log('Certification application:', { assessment, formData });
    setSubmitted(true);
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-xl font-bold text-slate-200 mb-2">认证申请已提交</h1>
          <p className="text-sm text-slate-400 mb-6">
            我们将在24小时内审核并发送证书至您的手机
          </p>
          <div className="p-4 rounded-lg bg-slate-800 border border-slate-700 text-left text-xs text-slate-400 space-y-1">
            <p>证书编号：RZ-NE-2026-{Math.floor(10000 + Math.random() * 90000)}</p>
            <p>审核状态：待审核</p>
            <p>预计完成：24小时内</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="mt-6 px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 pb-8">
      <div className="max-w-lg mx-auto">
        {/* 头部 */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-100 mb-1">睿筑官方认证</h1>
          <p className="text-xs text-slate-500">依据国家标准 · 权威认证 · 全国通用</p>
        </div>

        {/* 评估数据展示 */}
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

        {/* 认证申请表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 评估类型 */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">评估类型</label>
            <input
              type="text"
              value="筑能·建筑节能评估"
              readOnly
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm"
            />
          </div>

          {/* 评级 */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">评级</label>
            <input
              type="text"
              value="A级（优秀）"
              readOnly
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-amber-400 text-sm font-bold"
            />
          </div>

          {/* 房屋地址 */}
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

          {/* 建筑面积 */}
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

          {/* 所在地区 */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">所在地区</label>
            <input
              type="text"
              value={assessment.city}
              readOnly
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm"
            />
          </div>

          {/* 建筑类型 */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">建筑类型</label>
            <input
              type="text"
              value={assessment.buildingType}
              readOnly
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm"
            />
          </div>

          {/* 联系姓名 */}
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

          {/* 联系电话 */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">联系电话</label>
            <input
              type="tel"
              value={formData.phone}
              readOnly
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm"
            />
          </div>

          {/* 确认声明 */}
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

          {/* 价格和提交按钮 */}
          <div className="pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">认证费用</span>
              <span className="text-2xl font-bold text-amber-500">¥99</span>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-sm transition-all shadow-lg"
            >
              提交认证申请
            </button>
          </div>
        </form>

        {/* 底部链接 */}
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
