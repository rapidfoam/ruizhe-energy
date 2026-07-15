"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";

interface CertData {
  certNo: string;
  certType: string;
  address: string;
  area: string;
  city: string;
  buildingType: string;
  applicantName: string;
  phone: string;
  wallK: string;
  roofK: string;
  windowK: string;
  wallLimit: string;
  roofLimit: string;
  windowLimit: string;
  paymentStatus: string;
  issueDate: string;
}

type QueryState = 'idle' | 'valid' | 'invalid' | 'loading';

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [certId, setCertId] = useState("");
  const [queryState, setQueryState] = useState<QueryState>('idle');
  const [result, setResult] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCertView, setShowCertView] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  // Support URL parameter pre-fill: /verify?id=RZ-NE-2026-XXXXX
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam && /^RZ-(NE|AC)-\d{4}-\d{5}$/.test(idParam)) {
      setCertId(idParam);
      // Auto-trigger query
      setTimeout(() => {
        doVerify(idParam);
      }, 300);
    }
  }, [searchParams]);

  // Generate QR code when cert result is available
  useEffect(() => {
    if (result?.certNo) {
      const verifyUrl = `${window.location.origin}/verify?id=${result.certNo}`;
      QRCode.toDataURL(verifyUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#1A3A5C', light: '#ffffff' }
      }).then(setQrCodeUrl).catch(console.error);
    }
  }, [result]);

  const doVerify = async (certNo: string) => {
    setLoading(true);
    setQueryState('loading');

    try {
      const response = await fetch(`/api/cert-check?certNo=${encodeURIComponent(certNo)}`);
      const data = await response.json();

      if (data.success && data.cert) {
        setResult(data.cert);
        setQueryState('valid');
      } else {
        setQueryState('invalid');
      }
    } catch (err) {
      console.error('Verify error:', err);
      setQueryState('invalid');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId || !isValidFormat) return;
    doVerify(certId);
  };

  // Format validation
  const isValidFormat = /^RZ-(NE|AC)-\d{4}-\d{5}$/.test(certId);

  // Check if certification is valid (issued)
  const isIssued = result?.paymentStatus === '已发证' || result?.paymentStatus === '已支付';

  // Show certificate view
  if (showCertView && result) {
    return (
      <div className="min-h-screen bg-slate-900 py-8 px-4">
        {/* Print button - hidden in print */}
        <div className="max-w-[800px] mx-auto mb-4 print:hidden">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowCertView(false)}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors"
            >
              ← 返回查询
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
            >
              打印证书
            </button>
          </div>
        </div>

        {/* Certificate - A4 style */}
        <div className="max-w-[800px] mx-auto bg-white rounded-lg shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
          {/* Print styles */}
          <style>{`
            @media print {
              body { background: white !important; }
              .print\\:hidden { display: none !important; }
              .print\\:shadow-none { box-shadow: none !important; }
              .print\\:rounded-none { border-radius: 0 !important; }
            }
          `}</style>
          
          {/* Top border decoration */}
          <div className="h-3 bg-gradient-to-r from-[#1A3A5C] via-[#C5A55A] to-[#1A3A5C]" />
          
          <div className="p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-4xl mb-2">🏆</div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1A3A5C] tracking-wider" style={{ fontFamily: 'serif' }}>
                睿筑认证
              </h1>
              <div className="mt-2 text-sm text-[#C5A55A] tracking-widest">
                RUIZHU CERTIFICATION
              </div>
            </div>

            {/* Certificate type badge */}
            <div className="text-center mb-8">
              <div className="inline-block px-6 py-2 bg-gradient-to-r from-[#C5A55A] to-[#D4AF37] rounded-full">
                <span className="text-white text-lg font-bold">
                  {result.certType.includes('筑能') ? '建筑节能 A级' : '建筑隔音 A级'}
                </span>
              </div>
            </div>

            {/* Certificate number */}
            <div className="text-center mb-8">
              <p className="text-xs text-gray-500 mb-1">证书编号</p>
              <p className="text-lg font-mono text-[#1A3A5C] font-bold">{result.certNo}</p>
            </div>

            {/* Main content card */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-1">房屋地址</p>
                  <p className="text-gray-800 font-medium">{result.address}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">所在地区</p>
                  <p className="text-gray-800 font-medium">{result.city}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">建筑面积</p>
                  <p className="text-gray-800 font-medium">{result.area} m²</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">建筑类型</p>
                  <p className="text-gray-800 font-medium">{result.buildingType}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">申请人</p>
                  <p className="text-gray-800 font-medium">{result.applicantName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-1">发证日期</p>
                  <p className="text-gray-800 font-medium">{result.issueDate || '待发证'}</p>
                </div>
              </div>
            </div>

            {/* Energy assessment data */}
            {result.certType.includes('筑能') && result.wallK && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-[#1A3A5C] mb-4 text-center">评估数据</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">外墙K值</p>
                    <p className="text-2xl font-bold text-[#1A3A5C] font-mono">{result.wallK}</p>
                    <p className="text-xs text-gray-500 mt-1">限值 ≤{result.wallLimit}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">屋面K值</p>
                    <p className="text-2xl font-bold text-[#1A3A5C] font-mono">{result.roofK}</p>
                    <p className="text-xs text-gray-500 mt-1">限值 ≤{result.roofLimit}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">外窗K值</p>
                    <p className="text-2xl font-bold text-[#1A3A5C] font-mono">{result.windowK}</p>
                    <p className="text-xs text-gray-500 mt-1">限值 ≤{result.windowLimit}</p>
                  </div>
                </div>
              </div>
            )}

            {/* QR code and footer */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="text-xs text-gray-500 max-w-[60%]">
                <p className="mb-2">本证书由睿筑建筑评估平台颁发，认证依据：</p>
                <p className="text-[10px]">GB 55015-2021《建筑节能与可再生能源利用通用规范》</p>
                <p className="text-[10px] mt-1">证书真伪请扫码查询或访问 ruizhu.coze.site/verify</p>
              </div>
              {qrCodeUrl && (
                <div className="text-center">
                  <img src={qrCodeUrl} alt="验证二维码" className="w-20 h-20" />
                  <p className="text-[10px] text-gray-500 mt-1">扫码验证</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom border decoration */}
          <div className="h-3 bg-gradient-to-r from-[#1A3A5C] via-[#C5A55A] to-[#1A3A5C]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 pb-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔍</div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">睿筑认证查询</h1>
          <p className="text-xs text-slate-500">输入证书编号，验证认证真伪</p>
        </div>

        {/* Query form */}
        <form onSubmit={handleVerify} className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="RZ-NE-2026-XXXXX"
              value={certId}
              onChange={(e) => setCertId(e.target.value.toUpperCase())}
              className={`w-full px-4 py-3 pr-24 rounded-xl bg-slate-800 border text-slate-200 text-sm placeholder-slate-600 focus:outline-none transition-colors ${
                certId && !isValidFormat
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-slate-700 focus:border-blue-500'
              }`}
            />
            <button
              type="submit"
              disabled={!certId || !isValidFormat || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-medium transition-colors"
            >
              {loading ? '查询中...' : '验证'}
            </button>
          </div>
          {certId && !isValidFormat && (
            <p className="mt-2 text-xs text-red-400">
              格式错误，正确格式：RZ-NE-2026-XXXXX 或 RZ-AC-2026-XXXXX
            </p>
          )}
        </form>

        {/* Loading state */}
        {queryState === 'loading' && (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">正在查询...</p>
          </div>
        )}

        {/* Valid result */}
        {queryState === 'valid' && result && (
          <div className={`rounded-xl border p-5 ${
            isIssued 
              ? 'bg-emerald-900/20 border-emerald-700/30' 
              : 'bg-blue-900/20 border-blue-700/30'
          }`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{isIssued ? '✅' : '📋'}</span>
              <div>
                <h2 className={`text-sm font-bold ${isIssued ? 'text-emerald-400' : 'text-blue-400'}`}>
                  {isIssued ? '认证有效' : '审核中'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isIssued ? '该证书真实有效' : '认证申请正在审核中'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-500">证书编号</span>
                <span className="text-slate-200 font-mono">{result.certNo}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-500">认证类型</span>
                <span className="text-slate-200">{result.certType}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-500">房屋地址</span>
                <span className="text-slate-200 text-right max-w-[60%]">{result.address}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-500">所在地区</span>
                <span className="text-slate-200">{result.city}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-500">建筑面积</span>
                <span className="text-slate-200">{result.area} ㎡</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-500">建筑类型</span>
                <span className="text-slate-200">{result.buildingType}</span>
              </div>
              {result.issueDate && (
                <div className="flex justify-between py-2 border-b border-slate-700/50">
                  <span className="text-slate-500">发证日期</span>
                  <span className="text-slate-200">{result.issueDate}</span>
                </div>
              )}

              {/* Energy assessment data */}
              {result.certType.includes('筑能') && result.wallK && (
                <div className="pt-3">
                  <p className="text-slate-500 mb-2 font-medium">评估数据</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-slate-800/50 text-center">
                      <p className="text-slate-500 text-[10px]">外墙K值</p>
                      <p className="text-slate-200 font-mono text-xs">{result.wallK}</p>
                      {result.wallLimit && (
                        <p className="text-emerald-500 text-[10px]">≤{result.wallLimit}</p>
                      )}
                    </div>
                    <div className="p-2 rounded bg-slate-800/50 text-center">
                      <p className="text-slate-500 text-[10px]">屋面K值</p>
                      <p className="text-slate-200 font-mono text-xs">{result.roofK}</p>
                      {result.roofLimit && (
                        <p className="text-emerald-500 text-[10px]">≤{result.roofLimit}</p>
                      )}
                    </div>
                    <div className="p-2 rounded bg-slate-800/50 text-center">
                      <p className="text-slate-500 text-[10px]">外窗K值</p>
                      <p className="text-slate-200 font-mono text-xs">{result.windowK}</p>
                      {result.windowLimit && (
                        <p className="text-emerald-500 text-[10px]">≤{result.windowLimit}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700/50 text-center">
              <p className="text-[10px] text-slate-600">
                认证依据：GB 55015-2021《建筑节能与可再生能源利用通用规范》
              </p>
            </div>

            {/* View certificate button */}
            {isIssued && (
              <button
                onClick={() => setShowCertView(true)}
                className="mt-4 w-full py-3 rounded-lg bg-gradient-to-r from-[#C5A55A] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#E5C170] text-white font-bold text-sm transition-all shadow-lg"
              >
                查看证书
              </button>
            )}
          </div>
        )}

        {/* Invalid result */}
        {queryState === 'invalid' && (
          <div className="rounded-xl bg-red-900/20 border border-red-700/30 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">❌</span>
              <div>
                <h2 className="text-sm font-bold text-red-400">未查询到该证书</h2>
                <p className="text-xs text-slate-500">请核对编号后重试</p>
              </div>
            </div>
          </div>
        )}

        {/* Idle state */}
        {queryState === 'idle' && !loading && (
          <div className="text-center py-8">
            <p className="text-xs text-slate-600">
              输入证书编号，验证认证真伪
            </p>
            <p className="text-[10px] text-slate-700 mt-2">
              证书编号格式：RZ-NE-2026-XXXXX
            </p>
          </div>
        )}

        {/* Bottom links */}
        <div className="mt-8 text-center space-y-2">
          <button
            onClick={() => router.push('/')}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            ← 返回首页
          </button>
          <p className="text-[10px] text-slate-700">
            © 2026 睿筑·建筑评估
          </p>
        </div>
      </div>
    </div>
  );
}
