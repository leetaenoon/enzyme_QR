"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Scanner } from "@yudiel/react-qr-scanner";

const PRODUCTS = [
  { name: "1회권", count: 1, price: 40000 },
  { name: "10회권", count: 10, price: 350000 },
  { name: "20회권", count: 20, price: 600000 },
];

export default function PurchasePage() {
  const router = useRouter();
  const [step, setStep] = useState("scan");
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (detectedCodes) => {
    if (detectedCodes?.[0]?.rawValue && !loading) {
      const qrValue = detectedCodes[0].rawValue; // UUID값
      setLoading(true);

      // 🚨 핵심 수정: qr_code 컬럼으로 검색
      const { data } = await supabase
        .from("members")
        .select("*")
        .eq("qr_code", qrValue)
        .single();

      if (data) {
        setMember(data);
        setStep("select");
      } else {
        alert("등록되지 않은 회원 QR입니다.");
      }
      setLoading(false);
    }
  };

  const handlePurchase = async (product) => {
    if (!confirm(`${member.name}님, ${product.name}을 구매하시겠습니까?`))
      return;

    setLoading(true);
    try {
      await supabase.from("purchase_history").insert({
        member_id: member.id,
        phone_number: member.phone_number,
        name: member.name,
        pass_type: product.name,
        purchase_count: product.count,
        remaining_count: product.count,
        is_active: true,
      });
      alert("구매가 완료되었습니다!");
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      {step === "scan" && (
        <div className="w-full max-w-lg text-center">
          <h1 className="text-4xl font-bold mb-8">이용권 구매</h1>
          <p className="text-2xl mb-4 text-gray-600">
            회원님의 QR 코드를 보여주세요
          </p>
          <div className="bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-500 aspect-square relative">
            <Scanner
              onScan={handleScan}
              constraints={{ facingMode: "user" }}
              components={{ audio: false, finder: false }}
              styles={{
                container: { width: "100%", height: "100%" },
                video: { width: "100%", height: "100%", objectFit: "cover" },
              }}
            />
            {loading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold">
                확인 중...
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

      {step === "select" && member && (
        <div className="w-full max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-2">
            {member.name}님
          </h2>
          <p className="text-xl text-center text-gray-500 mb-8">
            {member.phone_number}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PRODUCTS.map((p) => (
              <button
                key={p.name}
                onClick={() => handlePurchase(p)}
                className="bg-white p-8 rounded-2xl shadow-lg border-b-[6px] border-stone-200 active:border-b-0 active:translate-y-[6px] transition-all hover:bg-emerald-50"
              >
                <div className="text-2xl font-bold text-gray-800 mb-2">
                  {p.name}
                </div>
                <div className="text-xl text-emerald-600 font-bold">
                  {p.price.toLocaleString()}원
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep("scan")}
            className="w-full mt-8 py-5 bg-stone-300 rounded-2xl text-xl font-bold"
          >
            취소하고 다시 찍기
          </button>
        </div>
      )}
    </div>
  );
}
