"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function CheckPage() {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [memberInfo, setMemberInfo] = useState(null)
  const [passes, setPasses] = useState([])
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
    setMemberInfo(null)
    setPasses([])
  }

  const handleCheck = async () => {
    if (phoneNumber.length < 10) {
      setError("전화번호를 정확히 입력해주세요")
      return
    }

    setLoading(true)
    setError("")

    try {
      const formatted = phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")

      // 회원 정보 조회
      const { data: member } = await supabase.from("members").select("*").eq("phone_number", formatted).single()

      if (!member) {
        setShowUnregisteredPopup(true)
        setLoading(false)
        return
      }

      // 이용권 정보 조회
      const { data: passData } = await supabase
        .from("purchase_history")
        .select("*")
        .eq("phone_number", formatted)
        .order("purchase_date", { ascending: false })

      setMemberInfo(member)
      setPasses(passData || [])
    } catch (err) {
      console.error("[v0] 조회 오류:", err)
      setError("조회 중 오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen bg-stone-50 flex flex-col items-center justify-center p-3 overflow-hidden">
      {showUnregisteredPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-3xl p-12 max-w-2xl w-full shadow-2xl">
            <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center whitespace-pre-line">
              등록되지 않은 회원입니다.{"\n"}회원가입을 하시겠습니까?
            </h2>
            <div className="flex gap-6">
              <button
                onClick={() => {
                  setShowUnregisteredPopup(false)
                  router.push(`/purchase?phone=${phoneNumber}`)
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-3xl font-bold py-10 rounded-2xl transition-all active:scale-95 shadow-lg"
              >
                이용권 구매
              </button>
              <button
                onClick={() => {
                  setShowUnregisteredPopup(false)
                  router.push("/non-member")
                }}
                className="flex-1 bg-stone-600 hover:bg-stone-700 text-white text-3xl font-bold py-10 rounded-2xl transition-all active:scale-95 shadow-lg"
              >
                비회원
              </button>
            </div>
            <button
              onClick={() => {
                setShowUnregisteredPopup(false)
                setPhoneNumber("")
              }}
              className="w-full mt-6 bg-stone-200 hover:bg-stone-300 text-gray-800 text-2xl font-bold py-6 rounded-2xl transition-all"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-4 mb-2 text-center">
        <h1 className="text-4xl font-bold text-gray-900">잔여횟수 조회</h1>
      </div>

      {/* 전화번호 입력 */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-4 mb-2 text-center">
        <p className="text-xl text-gray-700 mb-3">전화번호를 입력해주세요</p>
        <div className="bg-stone-50 border-2 border-stone-300 p-3 rounded-xl">
          <p className="text-4xl font-mono text-gray-900 tracking-widest">{phoneNumber || "___________"}</p>
        </div>
        {error && <p className="text-xl text-red-600 mt-3 font-bold">{error}</p>}
      </div>

      {/* 조회 결과 */}
      {memberInfo && (
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-4 mb-2 max-h-32 overflow-y-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">{memberInfo.name}님의 이용권</h2>
          {passes.length === 0 ? (
            <p className="text-lg text-gray-600 text-center">보유 중인 이용권이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {passes.map((pass) => (
                <div
                  key={pass.id}
                  className={`border-2 p-3 rounded-xl flex justify-between items-center ${
                    pass.remaining_count > 0 ? "border-emerald-500 bg-emerald-50" : "border-stone-400 bg-stone-100"
                  }`}
                >
                  <p className="text-xl font-bold text-gray-900">{pass.pass_type}</p>
                  <p className="text-2xl font-bold text-emerald-600">{pass.remaining_count}회</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 숫자 키패드 */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-4 mb-2">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="bg-stone-100 hover:bg-stone-200 text-gray-900 text-4xl font-bold py-5 rounded-xl transition-all active:scale-95 border-2 border-stone-200"
              disabled={loading}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handle010Click}
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-xl font-bold py-5 rounded-xl transition-all active:scale-95 shadow-md"
            disabled={loading}
          >
            010
          </button>
          <button
            onClick={() => handleNumberClick("0")}
            className="bg-stone-100 hover:bg-stone-200 text-gray-900 text-4xl font-bold py-5 rounded-xl transition-all active:scale-95 border-2 border-stone-200"
            disabled={loading}
          >
            0
          </button>
          <button
            onClick={handleClear}
            className="bg-amber-500 hover:bg-amber-600 text-white text-xl font-bold py-5 rounded-xl transition-all active:scale-95 shadow-md"
            disabled={loading}
          >
            지우기
          </button>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="w-full max-w-3xl flex gap-3">
        <button
          onClick={() => router.push("/")}
          className="flex-1 bg-stone-300 hover:bg-stone-400 text-gray-900 text-2xl font-bold py-4 px-4 rounded-xl transition-all active:scale-95 shadow-md"
          disabled={loading}
        >
          돌아가기
        </button>
        <button
          onClick={handleCheck}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-2xl font-bold py-4 px-4 rounded-xl transition-all active:scale-95 shadow-lg"
          disabled={loading || phoneNumber.length < 10}
        >
          {loading ? "조회중..." : "조회하기"}
        </button>
      </div>
    </div>
  )
}
