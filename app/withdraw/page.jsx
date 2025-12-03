"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function WithdrawPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [foundMember, setFoundMember] = useState(null); // 찾은 회원 정보

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (raw.length <= 11) setPhone(raw);
  };

  // 1. 전화번호로 먼저 찾기
  const findMember = async () => {
    if (phone.length < 10) {
      alert("전화번호를 정확히 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      const formatted = phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("phone_number", formatted)
        .single();

      if (data) {
        setFoundMember(data); // 회원 찾음 -> 확인 단계로
      } else {
        alert("가입되지 않은 전화번호입니다.");
      }
    } catch (err) {
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 2. 진짜 삭제하기
  const handleWithdraw = async () => {
    if (!confirm(`정말로 '${foundMember.name}'님의 정보를 삭제하시겠습니까?`))
      return;

    setLoading(true);
    try {
      await supabase.from("members").delete().eq("id", foundMember.id);
      alert("탈퇴가 완료되었습니다.");
      router.push("/");
    } catch (err) {
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white p-10 rounded-3xl shadow-xl border border-red-100">
        <h2 className="text-4xl font-bold text-red-600 mb-2 text-center">
          회원 탈퇴
        </h2>
        <p className="text-gray-500 text-center mb-8 text-lg">
          전화번호로 회원을 조회합니다.
        </p>

        {!foundMember ? (
          // [단계 1] 전화번호 입력
          <>
            <div className="mb-8">
              <label className="block text-xl font-bold text-gray-700 mb-2">
                전화번호
              </label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                className="w-full text-2xl p-4 border-2 border-stone-300 rounded-xl"
                placeholder="01012345678"
              />
            </div>
            <button
              onClick={findMember}
              disabled={loading}
              className="w-full bg-stone-700 text-white text-3xl font-bold py-6 rounded-2xl shadow-lg"
            >
              {loading ? "조회중..." : "내 정보 조회"}
            </button>
          </>
        ) : (
          // [단계 2] 본인 확인 및 삭제
          <div className="text-center animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-red-50 p-6 rounded-2xl mb-6 border border-red-200">
              <p className="text-xl text-gray-600 mb-2">조회된 회원</p>
              <p className="text-4xl font-bold text-gray-900">
                {foundMember.name} 님
              </p>
              <p className="text-lg text-gray-500 mt-1">
                {foundMember.phone_number}
              </p>
            </div>
            <button
              onClick={handleWithdraw}
              disabled={loading}
              className="w-full bg-red-600 text-white text-3xl font-bold py-6 rounded-2xl shadow-lg hover:bg-red-700 transition-colors"
            >
              {loading ? "처리중..." : "네, 탈퇴합니다"}
            </button>
          </div>
        )}

        <button
          onClick={() => router.back()}
          className="w-full mt-4 py-4 text-xl text-gray-500"
        >
          취소
        </button>
      </div>
    </div>
  );
}
