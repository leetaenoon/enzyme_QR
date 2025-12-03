"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("entry") // 'entry', 'purchase'
  const [entryLogs, setEntryLogs] = useState([])
  const [purchases, setPurchases] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)

  // 데이터 로드
  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === "entry") {
        const { data, error } = await supabase
          .from("entry_logs")
          .select("*")
          .order("entry_time", { ascending: false })
          .limit(50)

        if (error) throw error
        setEntryLogs(data || [])
      } else {
        const { data, error } = await supabase
          .from("purchase_history")
          .select("*")
          .order("purchase_date", { ascending: false })
          .limit(50)

        if (error) throw error
        setPurchases(data || [])
      }
    } catch (err) {
      console.error("[v0] 데이터 로드 오류:", err)
    } finally {
      setLoading(false)
    }
  }

  // 탭 변경시 데이터 로드
  useEffect(() => {
    loadData()
  }, [activeTab])

  // 검색 필터링
  const filteredEntryLogs = entryLogs.filter(
    (log) => log.name?.includes(searchTerm) || log.phone_number?.includes(searchTerm),
  )

  const filteredPurchases = purchases.filter(
    (p) => p.name?.includes(searchTerm) || p.phone_number?.includes(searchTerm),
  )

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // 가격 포맷팅
  const formatPrice = (price) => {
    return price.toLocaleString("ko-KR") + "원"
  }

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900">관리자 대시보드</h1>
          <button
            onClick={() => router.push("/")}
            className="bg-stone-400 hover:bg-stone-500 text-white text-2xl font-bold px-8 py-4 rounded-2xl transition-all shadow-md"
          >
            메인으로
          </button>
        </div>

        {/* 탭 */}
        <div className="bg-white rounded-3xl shadow-md p-4 mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("entry")}
              className={`flex-1 text-3xl font-bold py-6 rounded-2xl transition-all ${
                activeTab === "entry"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-stone-100 text-gray-600 hover:bg-stone-200"
              }`}
            >
              입실 기록
            </button>
            <button
              onClick={() => setActiveTab("purchase")}
              className={`flex-1 text-3xl font-bold py-6 rounded-2xl transition-all ${
                activeTab === "purchase"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-stone-100 text-gray-600 hover:bg-stone-200"
              }`}
            >
              구매 이력
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-3xl shadow-md p-6 mb-8">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="이름 또는 전화번호로 검색..."
            className="w-full text-3xl px-6 py-4 border-2 border-stone-300 rounded-2xl focus:border-emerald-600 focus:outline-none bg-stone-50"
          />
        </div>

        {/* 로딩 */}
        {loading && <div className="text-center text-3xl text-gray-600 py-12">로딩 중...</div>}

        {/* 입실 기록 */}
        {!loading && activeTab === "entry" && (
          <div className="bg-white rounded-3xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-2xl font-bold text-gray-700">입실 시간</th>
                    <th className="px-6 py-4 text-left text-2xl font-bold text-gray-700">이름</th>
                    <th className="px-6 py-4 text-left text-2xl font-bold text-gray-700">전화번호</th>
                    <th className="px-6 py-4 text-left text-2xl font-bold text-gray-700">이용권</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntryLogs.map((log) => (
                    <tr key={log.id} className="border-b border-stone-200 hover:bg-stone-50">
                      <td className="px-6 py-4 text-2xl text-gray-800">{formatDate(log.entry_time)}</td>
                      <td className="px-6 py-4 text-2xl text-gray-600">{log.name}</td>
                      <td className="px-6 py-4 text-2xl text-gray-600">{log.phone_number}</td>
                      <td className="px-6 py-4 text-2xl text-gray-600">{log.pass_type}</td>
                    </tr>
                  ))}
                  {filteredEntryLogs.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-2xl text-gray-500">
                        입실 기록이 없습니다
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 구매 이력 */}
        {!loading && activeTab === "purchase" && (
          <div className="bg-white rounded-3xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-2xl font-bold text-gray-700">구매일</th>
                    <th className="px-6 py-4 text-left text-2xl font-bold text-gray-700">이름</th>
                    <th className="px-6 py-4 text-left text-2xl font-bold text-gray-700">전화번호</th>
                    <th className="px-6 py-4 text-left text-2xl font-bold text-gray-700">이용권</th>
                    <th className="px-6 py-4 text-center text-2xl font-bold text-gray-700">잔여</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((p) => (
                    <tr key={p.id} className="border-b border-stone-200 hover:bg-stone-50">
                      <td className="px-6 py-4 text-2xl text-gray-800">{formatDate(p.purchase_date)}</td>
                      <td className="px-6 py-4 text-2xl text-gray-600">{p.name}</td>
                      <td className="px-6 py-4 text-2xl text-gray-600">{p.phone_number}</td>
                      <td className="px-6 py-4 text-2xl text-gray-600">{p.pass_type}</td>
                      <td className="px-6 py-4 text-2xl text-center">
                        <span className={p.remaining_count > 0 ? "text-green-600 font-bold" : "text-red-600"}>
                          {p.remaining_count}회
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredPurchases.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-2xl text-gray-500">
                        구매 이력이 없습니다
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
