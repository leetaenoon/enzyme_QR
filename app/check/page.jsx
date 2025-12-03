"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function CheckPage() {
  const router = useRouter();
  const [step, setStep] = useState("scan");
  const [info, setInfo] = useState(null); // 회원정보 + 이용권정보
  const [loading, setLoading] = useState(false);

  const handleScan = async (detectedCodes) => {
    if (detectedCodes?.[0]?.rawValue && !loading) {
      const raw = detectedCodes[0].rawValue;
      const formatted = raw
        .replace(/[^0-9]/g, "")
        .replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");

      setLoading(true);
      // 회원 찾기
      const { data: member } = await supabase
        .from("members")
        .select("*")
        .eq("phone_number", formatted)
        .single();

      if (member) {
        // 이용권 찾기
        const { data: passes } = await supabase
          .from("purchase_history")
          .select("*")
          .eq("phone_number", formatted)
          .order("purchase_date", { ascending: false });

        setInfo({ member, passes });
        setStep("result");
      } else {
        alert("등록되지 않은 회원입니다.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      {step === "scan" && (
        <div className="w-full max-w-lg text-center">
          <h1 className="text-4xl font-bold mb-8">잔여 횟수 조회</h1>
          <p className="text-2xl mb-4 text-gray-600">QR 코드를 비춰주세요</p>
          <div className="bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-indigo-500 aspect-square relative">
            <Scanner
              onScan={handleScan}
              components={{ audio: false, finder: false }}
              styles={{ container: { width: "100%", height: "100%" } }}
            />
            {loading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold">
                조회 중...
              </div>
            )}
          </div>
          <button
            onClick={() => router.back()}
            className="mt-8 px-8 py-4 bg-stone-300 rounded-xl text-xl font-bold"
          >
            뒤로가기
          </button>
        </div>
      )}

      {step === "result" && info && (
        <div className="w-full max-w-2xl bg-white p-10 rounded-3xl shadow-xl">
          <h2 className="text-4xl font-bold text-gray-900 mb-2 text-center">
            {info.member.name}님의 현황
          </h2>
          <p className="text-xl text-center text-gray-500 mb-10">
            {info.member.phone_number}
          </p>

          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {info.passes?.length === 0 ? (
              <p className="text-center text-2xl text-gray-400 py-10">
                보유 중인 이용권이 없습니다.
              </p>
            ) : (
              info.passes.map((pass) => (
                <div
                  key={pass.id}
                  className={`p-6 rounded-2xl border-2 flex justify-between items-center ${
                    pass.remaining_count > 0
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 bg-gray-50 opacity-60"
                  }`}
                >
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {pass.pass_type}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(pass.purchase_date).toLocaleDateString()} 구매
                    </div>
                  </div>
                  <div
                    className={`text-3xl font-bold ${
                      pass.remaining_count > 0
                        ? "text-emerald-600"
                        : "text-gray-400"
                    }`}
                  >
                    {pass.remaining_count}회 남음
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => router.push("/")}
            className="w-full mt-10 bg-emerald-600 text-white text-2xl font-bold py-6 rounded-2xl shadow-lg"
          >
            확인 (메인으로)
          </button>
        </div>
      )}
    </div>
  );
}
