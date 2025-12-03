"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [adminClicks, setAdminClicks] = useState(0);

  const handleAdminClick = () => {
    const newClicks = adminClicks + 1;
    setAdminClicks(newClicks);
    if (newClicks >= 5) {
      router.push("/admin");
      setAdminClicks(0);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-b from-stone-50 to-stone-100 flex flex-col items-center justify-center p-8 overflow-hidden">
      <div className="w-full max-w-5xl p-6 mb-6 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-3">
          효소방 키오스크
        </h1>
        <div className="w-24 h-1 bg-emerald-500 mx-auto rounded-full"></div>
      </div>

      <div className="w-full max-w-5xl bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-8 mb-6 text-center border border-stone-200">
        <p className="text-3xl text-gray-800 mb-2 leading-relaxed">
          효소방 이용을 위해 화면을 터치하거나
        </p>
        <p className="text-3xl text-gray-800 leading-relaxed">
          원하시는 메뉴를 선택해 주세요.
        </p>
      </div>

      <div className="w-full max-w-5xl bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-8 flex gap-8 mb-6 border border-stone-200">
        {/* QR 코드 스캔 버튼 */}
        <button
          onClick={() => router.push("/entry?mode=qr")}
          className="flex-1 bg-white border-3 border-emerald-500 hover:bg-emerald-50 hover:shadow-xl text-emerald-700 text-3xl font-bold py-12 px-8 rounded-2xl transition-all duration-300 active:scale-98 flex flex-col items-center justify-center gap-4 shadow-md"
        >
          <span className="text-6xl">📷</span>
          <span>QR 코드 스캔</span>
          <span className="text-xl text-gray-600 font-normal">(입실하기)</span>
        </button>

        {/* 회원가입 버튼 (기존 전화번호 입력 대체) */}
        <button
          onClick={() => router.push("/signup")}
          className="flex-1 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl text-white text-3xl font-bold py-12 px-8 rounded-2xl transition-all duration-300 active:scale-98 flex flex-col items-center justify-center gap-4 shadow-lg"
        >
          <span className="text-6xl">📝</span>
          <span>회원가입</span>
          <span className="text-xl text-emerald-50 font-normal">
            (나만의 QR 만들기)
          </span>
        </button>
      </div>

      <div className="w-full max-w-5xl flex gap-4">
        <button
          onClick={() => router.push("/purchase")}
          className="flex-1 bg-white hover:bg-emerald-50 border-2 border-stone-300 hover:border-emerald-500 hover:shadow-lg text-gray-900 text-2xl font-bold py-6 px-6 rounded-2xl transition-all duration-300 active:scale-98"
        >
          이용권 구매
        </button>
        <button
          onClick={() => router.push("/check")}
          className="flex-1 bg-white hover:bg-emerald-50 border-2 border-stone-300 hover:border-emerald-500 hover:shadow-lg text-gray-900 text-2xl font-bold py-6 px-6 rounded-2xl transition-all duration-300 active:scale-98"
        >
          잔여횟수 조회
        </button>
        <button
          onClick={() => router.push("/non-member")}
          className="flex-1 bg-white hover:bg-emerald-50 border-2 border-stone-300 hover:border-emerald-500 hover:shadow-lg text-gray-900 text-2xl font-bold py-6 px-6 rounded-2xl transition-all duration-300 active:scale-98"
        >
          비회원
        </button>
      </div>

      <div
        onClick={handleAdminClick}
        className="mt-6 h-12 w-full cursor-pointer"
        style={{ userSelect: "none" }}
      />
    </div>
  );
}
