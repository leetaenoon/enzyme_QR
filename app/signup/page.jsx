"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import QRCode from "react-qr-code"

// 이용권 목록
const PASS_TYPES = [
  { name: "1회권 (첫 체험)", count: 1, price: 35000 },
  { name: "1회권", count: 1, price: 40000 },
  { name: "10회권", count: 10, price: 350000 },
  { name: "20회권", count: 20, price: 600000 },
]

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1:정보입력, 2:이용권선택, 3:완료(QR)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [selectedPass, setSelectedPass] = useState(null)
  const [loading, setLoading] = useState(false)

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "")
    if (raw.length <= 11) setPhone(raw)
  }

  // 1단계 -> 2단계 이동
  const goToPassSelection = async () => {
    if (!name || phone.length < 10) {
      alert("이름과 전화번호를 정확히 입력해주세요.")
      return
    }
    // 중복 가입 체크
    const formatted = phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
    const { data } = await supabase.from("members").select("id").eq("phone_number", formatted).single()
    
    if (data) {
      alert("이미 가입된 회원입니다.")
      return
    }
    setStep(2)
  }

  // 최종 가입 및 구매 처리
  const handleComplete = async () => {
    if (!selectedPass) return
    setLoading(true)

    try {
      const formatted = phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")

      // 1. 회원 생성
      const { data: newMember, error: memberError } = await supabase
        .from("members")
        .insert({ name, phone_number: formatted })
        .select()
        .single()

      if (memberError) throw memberError

      // 2. 이용권 구매 기록 생성
      const { error: purchaseError } = await supabase
        .from("purchase_history")
        .insert({
          member_id: newMember.id,
          phone_number: formatted,
          name: name,
          pass_type: selectedPass.name,
          purchase_count: selectedPass.count,
          remaining_count: selectedPass.count,
          is_active: true,
        })

      if (purchaseError) throw purchaseError

      setStep(3) // QR 화면으로
    } catch (err) {
      console.error(err)
      alert("가입 처리 중 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
      {step === 1 && (
        <div className="w-full max-w-xl bg-white p-10 rounded-3xl shadow-xl">
          <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">회원가입</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-xl font-bold text-gray-700 mb-2">이름</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full text-2xl p-4 border-2 border-stone-300 rounded-xl" placeholder="홍길동" />
            </div>
            <div>
              <label className="block text-xl font-bold text-gray-700 mb-2">전화번호</label>
              <input type="tel" value={phone} onChange={handlePhoneChange} className="w-full text-2xl p-4 border-2 border-stone-300 rounded-xl" placeholder="01012345678" />
            </div>
          </div>
          <button onClick={goToPassSelection} className="w-full mt-10 bg-emerald-600 text-white text-3xl font-bold py-6 rounded-2xl shadow-lg">다음 (이용권 선택)</button>
          <button onClick={() => router.back()} className="w-full mt-4 py-4 text-xl text-gray-500">취소</button>
        </div>
      )}

      {step === 2 && (
        <div className="w-full max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-6">구매할 이용권을 선택하세요</h2>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {PASS_TYPES.map((pass) => (
              <button
                key={pass.name}
                onClick={() => setSelectedPass(pass)}
                className={`p-8 rounded-2xl border-4 text-left transition-all ${
                  selectedPass?.name === pass.name ? "border-emerald-500 bg-emerald-50 shadow-lg scale-105" : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <div className="text-2xl font-bold text-gray-900">{pass.name}</div>
                <div className="text-xl text-emerald-600 font-bold mt-2">{pass.price.toLocaleString()}원</div>
              </button>
            ))}
          </div>
          <button onClick={handleComplete} disabled={!selectedPass || loading} className="w-full bg-emerald-600 text-white text-3xl font-bold py-6 rounded-2xl shadow-lg disabled:opacity-50">
            {loading ? "처리중..." : "결제 및 가입 완료"}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white p-12 rounded-3xl shadow-xl text-center flex flex-col items-center">
          <h2 className="text-4xl font-bold text-emerald-700 mb-4">{name}님 가입 완료!</h2>
          <p className="text-xl text-gray-600 mb-8">구매하신 {selectedPass?.name}이 적립되었습니다.<br/>아래 QR 코드를 촬영해 주세요.</p>
          <div className="p-4 border-2 border-stone-100 rounded-xl mb-8">
            <QRCode value={phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")} size={220} />
          </div>
          <button onClick={() => router.push("/")} className="w-full bg-stone-800 text-white text-2xl font-bold py-5 rounded-2xl">메인으로 이동</button>
        </div>
      )}
    </div>
  )
}