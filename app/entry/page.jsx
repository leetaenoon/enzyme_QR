"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function EntryPage() {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showUnregisteredPopup, setShowUnregisteredPopup] = useState(false)

  const handleNumberClick = (num) => {
    if (phoneNumber.length < 11) {
      setPhoneNumber(phoneNumber + num)
    }
  }

  const handle010Click = () => {
    setPhoneNumber("010")
  }

  const handleClear = () => {
    setPhoneNumber(phoneNumber.slice(0, -1))
  }

  const handleClearAll = () => {
    setPhoneNumber("")
    setError("")
  }

  const handleEntry = async () => {
    if (phoneNumber.length < 10) {
      setError("전화번호를 정확히 입력해주세요")
      return
    }

    setLoading(true)
    setError("")

    try {
      // 전화번호 포맷팅 (010-1234-5678 형식으로)
      const formatted = phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")

      // 1. 회원 정보 조회
      const { data: member } = await supabase.from("members").select("*").eq("phone_number", formatted).single()

      if (!member) {
        setShowUnregisteredPopup(true)
        setLoading(false)
        return
      }

      // 2. 사용 가능한 이용권 조회
      const { data: passes } = await supabase
        .from("purchase_history")
        .select("*")
        .eq("phone_number", formatted)
        .eq("is_active", true)
        .gt("remaining_count", 0)
        .order("purchase_date", { ascending: true })

      if (!passes || passes.length === 0) {
        setError("사용 가능한 이용권이 없습니다.")
        setLoading(false)
        return
      }

      // 3. 가장 오래된 이용권 사용
      const pass = passes[0]
      const newRemaining = pass.remaining_count - 1

      // 이용권 차감
      await supabase
        .from("purchase_history")
        .update({
          remaining_count: newRemaining,
          last_used_date: new Date().toISOString(),
          is_active: newRemaining > 0,
        })
        .eq("id", pass.id)

      // 입실 기록 저장
      await supabase.from("entry_logs").insert({
        member_id: member.id,
        phone_number: formatted,
        name: member.name,
        pass_type: pass.pass_type,
      })

      // 성공 페이지로 이동
      router.push(`/entry/success?name=${member.name}&remaining=${newRemaining}&type=${pass.pass_type}`)
    } catch (err) {
      console.error("[v0] 입실 처리 오류:", err)
      setError("입실 처리 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-gradient-to-b from-stone-50 to-stone-100 flex flex-col items-center justify-center p-3 overflow-hidden">
      {showUnregisteredPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-16">
          <div className="bg-white rounded-3xl p-16 max-w-3xl w-full shadow-2xl border border-stone-200">
            <h2 className="text-5xl font-bold text-gray-900 mb-12 text-center whitespace-pre-line leading-relaxed">
              등록되지 않은 회원입니다.{"\n"}회원가입을 하시겠습니까?
            </h2>
            <div className="flex gap-8">
              <button
                onClick={() => {
                  setShowUnregisteredPopup(false)
                  router.push(`/purchase?phone=${phoneNumber}`)
                }}
                className="flex-1 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-4xl font-bold py-12 rounded-2xl transition-all duration-300 active:scale-98 shadow-lg"
              >
                이용권 구매
              </button>
              <button
                onClick={() => {
                  setShowUnregisteredPopup(false)
                  router.push("/non-member")
                }}
                className="flex-1 bg-gradient-to-br from-stone-500 to-stone-600 hover:from-stone-600 hover:to-stone-700 hover:shadow-lg text-white text-4xl font-bold py-12 rounded-2xl transition-all duration-300 active:scale-98 shadow-lg"
              >
                비회원
              </button>
            </div>
            <button
              onClick={() => {
                setShowUnregisteredPopup(false)
                setPhoneNumber("")
              }}
              className="w-full mt-8 bg-stone-200 hover:bg-stone-300 text-gray-800 text-3xl font-bold py-8 rounded-2xl transition-all duration-200"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="w-full max-w-4xl bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 mb-2 text-center border border-stone-200">
        <h1 className="text-4xl font-bold text-gray-900">효소방 입실</h1>
      </div>

      {/* 전화번호 디스플레이 */}
      <div className="w-full max-w-4xl bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 mb-2 text-center border border-stone-200">
        <p className="text-xl text-gray-700 mb-2">전화번호를 입력해주세요</p>
        <div className="bg-stone-50 border-2 border-stone-300 p-3 rounded-xl">
          <p className="text-4xl font-mono text-gray-900 tracking-widest">{phoneNumber || "___________"}</p>
        </div>
        {error && <p className="text-xl text-red-600 mt-2 font-bold">{error}</p>}
      </div>

      {/* 숫자 키패드 */}
      <div className="w-full max-w-4xl bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 mb-2 border border-stone-200">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="bg-stone-100 hover:bg-stone-200 hover:shadow-md text-gray-900 text-4xl font-bold py-5 rounded-xl transition-all duration-200 active:scale-95 border-2 border-stone-200"
              disabled={loading}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handle010Click}
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-lg text-white text-xl font-bold py-5 rounded-xl transition-all duration-200 active:scale-95 shadow-md"
            disabled={loading}
          >
            010
          </button>
          <button
            onClick={() => handleNumberClick("0")}
            className="bg-stone-100 hover:bg-stone-200 hover:shadow-md text-gray-900 text-4xl font-bold py-5 rounded-xl transition-all duration-200 active:scale-95 border-2 border-stone-200"
            disabled={loading}
          >
            0
          </button>
          <button
            onClick={handleClear}
            className="bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 hover:shadow-lg text-white text-xl font-bold py-5 rounded-xl transition-all duration-200 active:scale-95 shadow-md"
            disabled={loading}
          >
            지우기
          </button>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="w-full max-w-4xl flex gap-3">
        <button
          onClick={() => router.push("/")}
          className="flex-1 bg-stone-300 hover:bg-stone-400 hover:shadow-lg text-gray-900 text-2xl font-bold py-4 px-4 rounded-xl transition-all duration-200 active:scale-98 shadow-md"
          disabled={loading}
        >
          돌아가기
        </button>
        <button
          onClick={handleEntry}
          className="flex-1 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl text-white text-2xl font-bold py-4 px-4 rounded-xl transition-all duration-200 active:scale-98 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || phoneNumber.length < 10}
        >
          {loading ? "처리중..." : "입실하기"}
        </button>
      </div>
    </div>
  )
}
