// ChatAssess v2 - 20260716
"use client";

import Link from "next/link";
import { useChatFlow } from "@/components/ChatAssess/useChatFlow";

export default function ChatAssessPage() {
  const {
    messages, citySearch, setCitySearch, showCityDropdown, setShowCityDropdown,
    cityResults, messagesEndRef, inputRef, step,
    handleQuickReply, handleSubmit, handleInputSubmit, handleCitySelect,
  } = useChatFlow();

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#1A3A5C] text-white px-4 py-3 flex items-center gap-3 shrink-0">
        <Link href="/" className="p-1 hover:bg-white/10 rounded">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-semibold">睿筑评估助手</h1>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            {msg.type === "bot" && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 shrink-0">
                <span className="text-sm">🏠</span>
              </div>
            )}
            <div className={`max-w-[80%] ${msg.type === "user" ? "bg-blue-600 text-white" : "bg-white"} rounded-2xl px-4 py-3 shadow-sm`}>
              <p className="text-sm whitespace-pre-line">{msg.text}</p>
              {msg.quickReplies && msg.quickReplies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {msg.quickReplies.map((reply, idx) => (
                    <button
                      key={idx}
                      onClick={() => !reply.disabled && handleQuickReply(reply)}
                      disabled={reply.disabled}
                      className={`px-4 py-2 rounded-full text-sm transition-all ${
                        reply.disabled
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-blue-50 text-blue-600 hover:bg-blue-100 active:bg-blue-200"
                      }`}
                    >
                      {reply.text}
                    </button>
                  ))}
                </div>
              )}
              {msg.showInput && (
                <div className="mt-3 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={citySearch}
                    onChange={(e) => { setCitySearch(e.target.value); setShowCityDropdown(true); }}
                    onFocus={() => setShowCityDropdown(true)}
                    onKeyDown={(e) => e.key === "Enter" && handleInputSubmit()}
                    placeholder="输入城市名称..."
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  />
                  {showCityDropdown && cityResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                      {cityResults.map((city, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleCitySelect(city)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex justify-between items-center"
                        >
                          <span>{city.name}</span>
                          <span className="text-xs text-slate-400">{city.province}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {msg.showSubmit && (
                <button
                  onClick={handleSubmit}
                  className="mt-3 w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  生成评估报告
                </button>
              )}
              {msg.showPhotoUpload && (
                <label className="mt-3 flex items-center justify-center gap-2 py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 cursor-pointer hover:border-blue-400 hover:text-blue-500">
                  <span>📷</span>
                  <span>点击拍照或选择图片</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={() => handleQuickReply({ text: "📷 已拍照", value: "photo_uploaded" })} />
                </label>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
