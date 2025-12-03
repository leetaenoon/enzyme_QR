"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import QRCode from "react-qr-code";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("entry"); // 'entry', 'purchase', 'members'
  const [entryLogs, setEntryLogs] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [members, setMembers] = useState([]); // 회원 목록 상태 추가
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");

  // 1. 관리자 인증 체크 (보안)
  useEffect(() => {
    const isAuth = localStorage.getItem("admin_auth");
    if (isAuth !== "true") {
      alert("관리자 로그인이 필요합니다.");
      router.replace("/admin/login");
    }
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, [router]);

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === "entry") {
        const { data } = await supabase
          .from("entry_logs")
          .select("*")
          .order("entry_time", { ascending: false })
          .limit(50);
        setEntryLogs(data || []);
      } else if (activeTab === "purchase") {
        const { data } = await supabase
          .from("purchase_history")
          .select("*")
          .order("purchase_date", { ascending: false })
          .limit(50);
        setPurchases(data || []);
      } else if (activeTab === "members") {
        // 회원 목록 조회 (최신 가입순)
        const { data } = await supabase
          .from("members")
          .select("*")
          .order("created_at", { ascending: false });
        setMembers(data || []);
      }
    } catch (err) {
      console.error("데이터 로드 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // 로그아웃
  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    router.push("/");
  };

  // 필터링 함수
  const filterData = (data) => {
    if (!searchTerm) return data;
    return data.filter(
      (item) =>
        item.name?.includes(searchTerm) ||
        item.phone_number?.includes(searchTerm)
    );
  };

  return (
    <div className="min-h-screen bg-stone-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">관리자 모드</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/")}
              className="bg-white border border-stone-300 px-6 py-3 rounded-xl font-bold text-gray-600"
            >
              메인으로
            </button>
            <button
              onClick={handleLogout}
              className="bg-stone-800 text-white px-6 py-3 rounded-xl font-bold"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex gap-2 mb-6 bg-white p-2 rounded-2xl shadow-sm border border-stone-200">
          {["entry", "purchase", "members"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 rounded-xl text-xl font-bold transition-all ${
                activeTab === tab
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-gray-500 hover:bg-stone-100"
              }`}
            >
              {tab === "entry" && "입실 기록"}
              {tab === "purchase" && "구매 내역"}
              {tab === "members" && "회원 관리"}
            </button>
          ))}
        </div>

        {/* 검색창 */}
        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="이름 또는 전화번호 검색..."
            className="w-full p-4 text-xl border-2 border-stone-200 rounded-xl focus:border-emerald-500 outline-none"
          />
        </div>

        {/* 컨텐츠 영역 */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden border border-stone-200 min-h-[500px]">
          {loading ? (
            <div className="p-20 text-center text-gray-400 text-xl">
              데이터를 불러오는 중...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-100 border-b border-stone-200">
                  <tr>
                    {activeTab === "members" ? (
                      <>
                        <th className="p-5 text-gray-600 font-bold text-lg">
                          가입일
                        </th>
                        <th className="p-5 text-gray-600 font-bold text-lg">
                          이름
                        </th>
                        <th className="p-5 text-gray-600 font-bold text-lg">
                          전화번호
                        </th>
                        <th className="p-5 text-gray-600 font-bold text-lg">
                          2차 비번
                        </th>
                        <th className="p-5 text-gray-600 font-bold text-lg text-center">
                          QR 코드
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="p-5 text-gray-600 font-bold text-lg">
                          날짜
                        </th>
                        <th className="p-5 text-gray-600 font-bold text-lg">
                          이름
                        </th>
                        <th className="p-5 text-gray-600 font-bold text-lg">
                          전화번호
                        </th>
                        <th className="p-5 text-gray-600 font-bold text-lg">
                          내용
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {activeTab === "members" &&
                    filterData(members).map((m) => (
                      <tr key={m.id} className="hover:bg-stone-50">
                        <td className="p-5 text-gray-500">
                          {new Date(m.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-5 font-bold text-gray-900">
                          {m.name}
                        </td>
                        <td className="p-5 text-gray-700">{m.phone_number}</td>
                        <td className="p-5 font-mono text-emerald-600">
                          {m.second_password || "-"}
                        </td>
                        <td className="p-5 text-center">
                          {m.qr_code ? (
                            <a
                              href={`${origin}/my-qr/${m.qr_code}`}
                              target="_blank"
                              className="inline-block p-2 border rounded-lg hover:border-emerald-500 transition-colors bg-white"
                            >
                              <QRCode
                                value={`${origin}/my-qr/${m.qr_code}`}
                                size={60}
                              />
                            </a>
                          ) : (
                            <span className="text-gray-300">없음</span>
                          )}
                        </td>
                      </tr>
                    ))}

                  {activeTab === "entry" &&
                    filterData(entryLogs).map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50">
                        <td className="p-5 text-gray-500">
                          {new Date(log.entry_time).toLocaleString()}
                        </td>
                        <td className="p-5 font-bold text-gray-900">
                          {log.name}
                        </td>
                        <td className="p-5 text-gray-700">
                          {log.phone_number}
                        </td>
                        <td className="p-5 text-emerald-600 font-medium">
                          {log.pass_type} 입실
                        </td>
                      </tr>
                    ))}

                  {activeTab === "purchase" &&
                    filterData(purchases).map((p) => (
                      <tr key={p.id} className="hover:bg-stone-50">
                        <td className="p-5 text-gray-500">
                          {new Date(p.purchase_date).toLocaleString()}
                        </td>
                        <td className="p-5 font-bold text-gray-900">
                          {p.name}
                        </td>
                        <td className="p-5 text-gray-700">{p.phone_number}</td>
                        <td className="p-5">
                          <span className="font-bold text-emerald-700">
                            {p.pass_type}
                          </span>{" "}
                          ({p.purchase_count}회)
                          <span className="ml-2 text-sm text-gray-400">
                            잔여: {p.remaining_count}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {filterData(
                activeTab === "members"
                  ? members
                  : activeTab === "entry"
                  ? entryLogs
                  : purchases
              ).length === 0 && (
                <div className="p-10 text-center text-gray-400">
                  데이터가 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
