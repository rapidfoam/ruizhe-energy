import { searchCertification } from "@/lib/feishu/api";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

interface CertPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CertPageProps) {
  const { id } = await params;
  const certNo = decodeURIComponent(id);
  return {
    title: `睿筑认证证书 - ${certNo}`,
  };
}

export default async function CertPage({ params }: CertPageProps) {
  const { id } = await params;
  const certNo = decodeURIComponent(id);

  // Validate format
  if (!/^RZ-(NE|AC)-\d{4}-\d{5}$/.test(certNo)) {
    notFound();
  }

  // Fetch certification data from Feishu
  const result = await searchCertification(certNo);
  if (!result.success || !result.cert) {
    notFound();
  }

  const cert = result.cert;
  const isEnergy = cert.certType.includes("筑能");

  // Generate QR code as data URL
  const domain = process.env.COZE_PROJECT_DOMAIN_DEFAULT || "ruizhu.coze.site";
  const verifyUrl = `https://${domain}/verify?id=${certNo}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 200,
    margin: 1,
    color: { dark: "#1A3A5C", light: "#FFFFFF" },
  });

  const issueDate = cert.issueDate || new Date().toLocaleDateString("zh-CN");

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; background: white !important; }
        }
      `}</style>

      {/* Print button */}
      <div className="no-print" style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 100,
      }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: "10px 24px",
            backgroundColor: "#1A3A5C",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            cursor: "pointer",
            fontWeight: 500,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          打印证书
        </button>
      </div>

      {/* Certificate container - A4 proportion */}
      <div style={{
        maxWidth: 800,
        margin: "40px auto",
        backgroundColor: "#FFFFFF",
        boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Top decorative border */}
        <div style={{
          height: 8,
          background: "linear-gradient(90deg, #1A3A5C 0%, #C5A55A 50%, #1A3A5C 100%)",
        }} />

        {/* Inner border frame */}
        <div style={{
          margin: "24px",
          border: "2px solid #C5A55A",
          padding: "48px 40px",
          position: "relative",
        }}>
          {/* Corner decorations */}
          <div style={{ position: "absolute", top: -2, left: -2, width: 24, height: 24, borderTop: "4px solid #1A3A5C", borderLeft: "4px solid #1A3A5C" }} />
          <div style={{ position: "absolute", top: -2, right: -2, width: 24, height: 24, borderTop: "4px solid #1A3A5C", borderRight: "4px solid #1A3A5C" }} />
          <div style={{ position: "absolute", bottom: -2, left: -2, width: 24, height: 24, borderBottom: "4px solid #1A3A5C", borderLeft: "4px solid #1A3A5C" }} />
          <div style={{ position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderBottom: "4px solid #1A3A5C", borderRight: "4px solid #1A3A5C" }} />

          {/* Logo and title area */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{
              fontSize: 14,
              color: "#1A3A5C",
              letterSpacing: 8,
              fontFamily: "'Noto Sans SC', sans-serif",
              fontWeight: 500,
              marginBottom: 16,
            }}>
              睿筑·建筑评估
            </div>
            <div style={{
              fontSize: 36,
              color: "#1A3A5C",
              fontFamily: "'Noto Serif SC', serif",
              fontWeight: 700,
              letterSpacing: 12,
              marginBottom: 8,
            }}>
              认证证书
            </div>
            <div style={{
              width: 60,
              height: 2,
              backgroundColor: "#C5A55A",
              margin: "0 auto 16px",
            }} />
            <div style={{
              fontSize: 24,
              color: "#C5A55A",
              fontFamily: "'Noto Serif SC', serif",
              fontWeight: 600,
              letterSpacing: 4,
            }}>
              {isEnergy ? "建筑节能 A 级" : "建筑隔音认证"}
            </div>
          </div>

          {/* Certificate number */}
          <div style={{
            textAlign: "center",
            marginBottom: 32,
            fontSize: 13,
            color: "#666",
            fontFamily: "monospace",
            letterSpacing: 2,
          }}>
            证书编号：{cert.certNo}
          </div>

          {/* Main content */}
          <div style={{
            fontSize: 15,
            color: "#333",
            lineHeight: 2,
            fontFamily: "'Noto Sans SC', sans-serif",
            marginBottom: 32,
          }}>
            <p style={{ marginBottom: 16, textIndent: "2em" }}>
              兹证明位于 <strong style={{ color: "#1A3A5C" }}>{cert.address}</strong> 的建筑，
              经睿筑建筑节能评估系统依据国家标准 <strong>GB 55015-2021</strong> 进行严格评估，
              其建筑围护结构节能性能达到 <strong style={{ color: "#C5A55A" }}>A级（优秀）</strong> 标准。
            </p>
          </div>

          {/* Data section */}
          {isEnergy && (
            <div style={{
              backgroundColor: "#f8f8f5",
              border: "1px solid #e8e4d8",
              borderRadius: 8,
              padding: "24px",
              marginBottom: 32,
            }}>
              <div style={{
                fontSize: 13,
                color: "#1A3A5C",
                fontWeight: 600,
                marginBottom: 16,
                textAlign: "center",
                letterSpacing: 2,
              }}>
                评估数据摘要
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 16,
              }}>
                <DataBlock label="外墙传热系数" value={`${cert.wallK} W/(m²·K)`} limit={`限值 ≤${cert.wallLimit}`} />
                <DataBlock label="屋面传热系数" value={`${cert.roofK} W/(m²·K)`} limit={`限值 ≤${cert.roofLimit}`} />
                <DataBlock label="外窗传热系数" value={`${cert.windowK} W/(m²·K)`} limit={`限值 ≤${cert.windowLimit}`} />
              </div>
              <div style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid #e8e4d8",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                fontSize: 13,
                color: "#666",
              }}>
                <div>所在地区：{cert.city}</div>
                <div>建筑类型：{cert.buildingType}</div>
                <div>建筑面积：{cert.area} ㎡</div>
                <div>申请人：{cert.applicantName}</div>
              </div>
            </div>
          )}

          {/* Footer area */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: 40,
          }}>
            {/* Left: issue info */}
            <div style={{
              fontSize: 13,
              color: "#666",
              lineHeight: 2,
            }}>
              <div>发证日期：{issueDate}</div>
              <div>有效期至：长期有效</div>
              <div style={{ marginTop: 8, fontSize: 11, color: "#999" }}>
                认证依据：GB 55015-2021
              </div>
            </div>

            {/* Right: QR code */}
            <div style={{ textAlign: "center" }}>
              <img
                src={qrDataUrl}
                alt="验证二维码"
                style={{ width: 100, height: 100 }}
              />
              <div style={{
                fontSize: 10,
                color: "#999",
                marginTop: 4,
              }}>
                扫码验证真伪
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{
            marginTop: 32,
            paddingTop: 16,
            borderTop: "1px solid #e8e4d8",
            fontSize: 10,
            color: "#aaa",
            textAlign: "center",
            lineHeight: 1.8,
          }}>
            <p>本证书由睿筑·建筑评估平台依据国家标准规范出具，评估数据基于申请人自报信息。</p>
            <p>证书真伪可通过 https://{domain}/verify 查询验证。</p>
          </div>
        </div>

        {/* Bottom decorative border */}
        <div style={{
          height: 8,
          background: "linear-gradient(90deg, #1A3A5C 0%, #C5A55A 50%, #1A3A5C 100%)",
        }} />
      </div>
    </>
  );
}

function DataBlock({ label, value, limit }: { label: string; value: string; limit: string }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "12px 8px",
      backgroundColor: "#FFFFFF",
      borderRadius: 6,
      border: "1px solid #e8e4d8",
    }}>
      <div style={{ fontSize: 11, color: "#999", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, color: "#1A3A5C", fontWeight: 700, fontFamily: "monospace" }}>{value}</div>
      <div style={{ fontSize: 10, color: "#10b981", marginTop: 2 }}>{limit}</div>
    </div>
  );
}
