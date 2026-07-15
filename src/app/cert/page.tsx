"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import QRCode from "qrcode";

interface CertData {
  certNo: string;
  certType: string;
  address: string;
  area: string;
  city: string;
  buildingType: string;
  wallK: string;
  roofK: string;
  windowK: string;
  wallLimit: string;
  roofLimit: string;
  windowLimit: string;
  paymentStatus: string;
  applicantName: string;
  phone: string;
  issueDate: string;
}

export default function CertPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">加载证书中...</p>
        </div>
      </div>
    }>
      <CertContent />
    </Suspense>
  );
}

function CertContent() {
  const searchParams = useSearchParams();
  const certId = searchParams.get("id") || "";
  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (!certId) {
      setLoading(false);
      setError("缺少证书编号参数");
      return;
    }

    const fetchCert = async () => {
      try {
        const res = await fetch(`/api/verify?certNo=${encodeURIComponent(certId)}`);
        const data = await res.json();
        if (data.success && data.cert) {
          setCert(data.cert);
        } else {
          setError(data.error || "未查询到该证书");
        }
      } catch {
        setError("查询失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    fetchCert();
  }, [certId]);

  // Generate QR code
  useEffect(() => {
    if (certId) {
      const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/verify?id=${certId}`;
      QRCode.toDataURL(verifyUrl, {
        width: 120,
        margin: 1,
        color: { dark: "#1A3A5C", light: "#FFFFFF" },
      }).then(setQrDataUrl).catch(() => {});
    }
  }, [certId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">加载证书中...</p>
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">📄</div>
          <h1 className="text-lg font-bold text-slate-800 mb-2">证书未找到</h1>
          <p className="text-sm text-slate-500 mb-6">{error || "该证书编号不存在或已失效"}</p>
          <a
            href="/verify"
            className="inline-block px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            前往证书验证
          </a>
        </div>
      </div>
    );
  }

  const isEnergy = cert.certType.includes("筑能") || cert.certType.includes("节能");
  const issueDate = cert.issueDate || new Date().toLocaleDateString("zh-CN");

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .cert-page { box-shadow: none !important; margin: 0 !important; }
        }
        @page { size: A4; margin: 10mm; }
      `}</style>

      {/* Print button - hidden when printing */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          打印证书
        </button>
      </div>

      {/* Certificate page */}
      <div className="min-h-screen bg-slate-100 py-8 px-4 flex items-center justify-center">
        <div
          className="cert-page bg-white shadow-2xl"
          style={{
            width: "100%",
            maxWidth: "800px",
            aspectRatio: "210 / 297",
            padding: "48px 56px",
            display: "flex",
            flexDirection: "column",
            fontFamily: "'Noto Serif SC', 'Songti SC', 'SimSun', serif",
          }}
        >
          {/* Top decorative border */}
          <div
            style={{
              height: "4px",
              background: "linear-gradient(90deg, #1A3A5C 0%, #C5A55A 50%, #1A3A5C 100%)",
              marginBottom: "32px",
            }}
          />

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#1A3A5C",
                letterSpacing: "8px",
                marginBottom: "8px",
                fontFamily: "sans-serif",
              }}
            >
              RUIZHU CERTIFICATE
            </div>
            <h1
              style={{
                fontSize: "36px",
                fontWeight: 700,
                color: "#1A3A5C",
                marginBottom: "4px",
                letterSpacing: "4px",
              }}
            >
              睿筑认证
            </h1>
            <div
              style={{
                width: "60px",
                height: "2px",
                background: "#C5A55A",
                margin: "12px auto",
              }}
            />
          </div>

          {/* Certificate title */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div
              style={{
                fontSize: "14px",
                color: "#666",
                marginBottom: "8px",
                fontFamily: "sans-serif",
              }}
            >
              兹认证以下建筑通过
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#C5A55A",
                marginBottom: "4px",
              }}
            >
              {isEnergy ? "建筑节能" : "建筑隔音"}
            </div>
            <div
              style={{
                fontSize: "20px",
                color: "#1A3A5C",
                fontWeight: 600,
              }}
            >
              A级 优秀
            </div>
          </div>

          {/* Certificate info */}
          <div
            style={{
              background: "#f8f9fa",
              borderRadius: "8px",
              padding: "20px 24px",
              marginBottom: "24px",
              fontFamily: "sans-serif",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "#999" }}>证书编号：</span>
                <span style={{ color: "#1A3A5C", fontWeight: 600, fontFamily: "monospace" }}>{cert.certNo}</span>
              </div>
              <div>
                <span style={{ color: "#999" }}>认证类型：</span>
                <span style={{ color: "#333" }}>{cert.certType}</span>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "#999" }}>房屋地址：</span>
                <span style={{ color: "#333" }}>{cert.address}</span>
              </div>
              <div>
                <span style={{ color: "#999" }}>建筑面积：</span>
                <span style={{ color: "#333" }}>{cert.area} ㎡</span>
              </div>
              <div>
                <span style={{ color: "#999" }}>所在地区：</span>
                <span style={{ color: "#333" }}>{cert.city}</span>
              </div>
              <div>
                <span style={{ color: "#999" }}>建筑类型：</span>
                <span style={{ color: "#333" }}>{cert.buildingType}</span>
              </div>
              <div>
                <span style={{ color: "#999" }}>颁发日期：</span>
                <span style={{ color: "#333" }}>{issueDate}</span>
              </div>
            </div>
          </div>

          {/* Assessment data */}
          {isEnergy && (
            <div style={{ marginBottom: "24px", fontFamily: "sans-serif" }}>
              <div
                style={{
                  fontSize: "13px",
                  color: "#1A3A5C",
                  fontWeight: 600,
                  marginBottom: "12px",
                  borderBottom: "1px solid #e5e7eb",
                  paddingBottom: "8px",
                }}
              >
                评估数据
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                {[
                  { label: "外墙K值", value: cert.wallK, limit: cert.wallLimit },
                  { label: "屋面K值", value: cert.roofK, limit: cert.roofLimit },
                  { label: "外窗K值", value: cert.windowK, limit: cert.windowLimit },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      textAlign: "center",
                      padding: "12px 8px",
                      background: "#f0f7ff",
                      borderRadius: "6px",
                      border: "1px solid #dbeafe",
                    }}
                  >
                    <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>{item.label}</div>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: "#1A3A5C", fontFamily: "monospace" }}>
                      {item.value}
                    </div>
                    <div style={{ fontSize: "10px", color: "#10b981", marginTop: "2px" }}>
                      ≤ {item.limit} ✓
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Footer */}
          <div
            style={{
              borderTop: "1px solid #e5e7eb",
              paddingTop: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              fontFamily: "sans-serif",
            }}
          >
            <div style={{ fontSize: "10px", color: "#999", maxWidth: "60%", lineHeight: 1.6 }}>
              <p>本证书由睿筑·建筑评估平台依据国家标准 GB 55015-2021 颁发。</p>
              <p>评估数据基于申请人自报信息，仅供参考。</p>
              <p>验证真伪：ruizhu.coze.site/verify</p>
            </div>
            {qrDataUrl && (
              <div style={{ textAlign: "center" }}>
                <img src={qrDataUrl} alt="验证二维码" style={{ width: "80px", height: "80px" }} />
                <div style={{ fontSize: "9px", color: "#999", marginTop: "4px" }}>扫码验证</div>
              </div>
            )}
          </div>

          {/* Bottom decorative border */}
          <div
            style={{
              height: "4px",
              background: "linear-gradient(90deg, #1A3A5C 0%, #C5A55A 50%, #1A3A5C 100%)",
              marginTop: "16px",
            }}
          />
        </div>
      </div>
    </>
  );
}
