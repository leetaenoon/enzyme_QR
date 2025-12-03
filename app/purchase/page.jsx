"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

// 이용권 상품 목록
const PRODUCTS = [
  { name: "1회권 (첫 체험)", count: 1, price: 35000 },
  { name: "1회권", count: 1, price: 40000 },
  { name: "12회권", count: 12, price: 400000 },
  { name: "26회권", count: 26, price: 800000 },
  { name: "50회권", count: 50, price: 1200000 },
  { name: "70회권", count: 70, price: 1600000 },
  { name: "100회권", count: 100, price: 2000000 },
]

export default function PurchasePage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: 이용권 선택, 2: 정보 입력
  const [passType, setPassType] = useState("")
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handlePassSelect = (type) => {
    setPassType(type)
    setStep(2)
  }

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
  }

  // 구매 처리
  const handlePurchase = async () => {
    if (!name || phoneNumber.length < 10) {
      setError("이름과 전화번호를 모두 입력해주세요")
      return
    }

    setLoading(true)
    setError("")

    try {
      const formatted = phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
      const count = passType === "1회" ? 1 : 10

      // 1. 회원 정보 확인 또는 생성
      let { data: member } = await supabase.from("members").select("*").eq("phone_number", formatted).single()

      if (!member) {
        const { data: newMember } = await supabase
          .from("members")
          .insert({ phone_number: formatted, name })
          .select()
          .single()
        member = newMember
      }

      // 2. 이용권 구매 기록 추가
      await supabase.from("purchase_history").insert({
        member_id: member.id,
        phone_number: formatted,
        name: name,
        pass_type: passType,
        purchase_count: count,
        remaining_count: count,
        is_active: true,
      })

      // 성공 페이지로 이동
      router.push(`/purchase/success?name=${name}&type=${passType}&count=${count}`)
    } catch (err) {
      console.error("[v0] 구매 처리 오류:", err)
      setError("구매 처리 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  // 가격 포맷팅
  const formatPrice = (price) => {
    return price.toLocaleString("ko-KR") + "원"
  }

  // 전화번호 포맷팅
  const formatPhone = (phone) => {
    if (phone.length <= 3) return phone
    if (phone.length <= 7) return `${phone.slice(0, 3)}-${phone.slice(3)}`
    return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`
  }

  return (
    <div className="h-screen bg-stone-50 flex flex-col items-center justify-center p-3 overflow-hidden">
      {/* 헤더 */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-4 mb-2 text-center">
        <h1 className="text-4xl font-bold text-gray-900">이용권 구매</h1>
      </div>

      {step === 1 ? (
        // Step 1: 이용권 선택
        <>
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-12 mb-2 text-center">
            <p className="text-3xl text-gray-800 mb-8">구매하실 이용권을 선택해주세요</p>
          </div>

          <div className="w-full max-w-3xl grid grid-cols-2 gap-4 mb-2">
            <button
              onClick={() => handlePassSelect("1회")}
              className="bg-white hover:bg-stone-50 border-2 border-emerald-600 p-16 rounded-2xl transition-all active:scale-95 shadow-md"
            >
              <p className="text-5xl font-bold text-gray-900 mb-4">1회권</p>
              <p className="text-2xl text-gray-600">1회 이용권</p>
            </button>

            <button
              onClick={() => handlePassSelect("10회")}
              className="bg-white hover:bg-stone-50 border-2 border-emerald-600 p-16 rounded-2xl transition-all active:scale-95 shadow-md"
            >
              <p className="text-5xl font-bold text-gray-900 mb-4">10회권</p>
              <p className="text-2xl text-gray-600">10회 이용권</p>
            </button>
          </div>

          <button
            onClick={() => router.push("/")}
            className="w-full max-w-3xl bg-stone-300 hover:bg-stone-400 text-gray-900 text-3xl font-bold py-8 px-6 rounded-2xl transition-all active:scale-95 shadow-md"
          >
            돌아가기
          </button>
        </>
      ) : (
        // Step 2: 정보 입력
        <>
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-4 mb-2">
            <p className="text-2xl text-gray-800 mb-3 text-center">
              선택: <span className="font-bold text-emerald-600">{passType}</span>
            </p>

            {/* 이름 입력 */}
            <div className="mb-3">
              <label className="text-xl text-gray-700 block mb-2 font-semibold">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-stone-50 border-2 border-stone-300 p-3 rounded-xl text-2xl focus:border-emerald-600 focus:outline-none"
                placeholder="이름을 입력하세요"
                disabled={loading}
              />
            </div>

            {/* 전화번호 디스플레이 */}
            <div>
              <label className="text-xl text-gray-700 block mb-2 font-semibold">전화번호</label>
              <div className="bg-stone-50 border-2 border-stone-300 p-3 rounded-xl">
                <p className="text-3xl font-mono text-gray-900 tracking-widest">{phoneNumber || "___________"}</p>
              </div>
            </div>

            {error && <p className="text-xl text-red-600 mt-2 font-bold text-center">{error}</p>}
          </div>

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
              onClick={() => setStep(1)}
              className="flex-1 bg-stone-300 hover:bg-stone-400 text-gray-900 text-2xl font-bold py-4 px-4 rounded-xl transition-all active:scale-95 shadow-md"
              disabled={loading}
            >
              이전
            </button>
            <button
              onClick={handlePurchase}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-2xl font-bold py-4 px-4 rounded-xl transition-all active:scale-95 shadow-lg"
              disabled={loading || !name || phoneNumber.length < 10}
            >
              {loading ? "처리중..." : "구매하기"}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
