"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import QRCode from "react-qr-code";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("entry"); // 'entry', 'purchase', 'members', 'logs'
  const [entryLogs, setEntryLogs] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberLogs, setMemberLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");

  // 회원 수정 모달 상태
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone_number: "",
    second_password: "",
  });

  useEffect(() => {
    const isAuth = localStorage.getItem("admin_auth");
    if (isAuth !== "true") {
      alert("관리자 로그인이 필요합니다.");
      router.replace("/admin/login");
    }
    // 현재 사이트 주소 가져오기 (예: https://enzyme-qr.vercel.app)
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, [router]);

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
        const { data } = await supabase
          .from("members")
          .select("*")
          .order("created_at", { ascending: false });
        setMembers(data || []);
      } else if (activeTab === "logs") {
        const { data } = await supabase
          .from("member_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        setMemberLogs(data || []);
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

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    router.push("/");
  };

  const filterData = (data) => {
    if (!searchTerm) return data;
    return data.filter(
      (item) =>
        item.name?.includes(searchTerm) ||
        item.phone_number?.includes(searchTerm)
    );
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setEditForm({
      name: member.name,
      phone_number: member.phone_number,
      second_password: member.second_password || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdateMember = async () => {
    if (!editForm.name || editForm.phone_number.length < 10) {
      alert("이름과 전화번호를 확인해주세요.");
      return;
    }
    try {
      const formatted = editForm.phone_number.replace(
        /(\d{3})(\d{4})(\d{4})/,
        "$1-$2-$3"
      );
      const { error } = await supabase
        .from("members")
        .update({
          name: editForm.name,
          phone_number: formatted,
          second_password: editForm.second_password,
        })
        .eq("id", editingMember.id);

      if (error) throw error;
      alert("회원 정보가 수정되었습니다.");
      setIsEditOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  const handleForceDelete = async (member) => {
    if (
      !confirm(
        `[관리자 권한]\n정말로 '${member.name}' 회원을 강제 탈퇴시키겠습니까?\n이 작업은 되돌릴 수 없습니다.`
      )
    )
      return;
    try {
      await supabase.from("member_logs").insert({
        phone_number: member.phone_number,
        name: member.name,
        action_type: "탈퇴",
      });
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", member.id);
      if (error) throw error;
      alert("강제 탈퇴 처리되었습니다.");
      loadData();
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    }
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
              className="bg-white border border-stone-300 px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-stone-100"
            >
              메인으로
            </button>
            <button
              onClick={handleLogout}
              className="bg-stone-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-stone-900"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex gap-2 mb-6 bg-white p-2 rounded-2xl shadow-sm border border-stone-200 overflow-x-auto">
          {["entry", "purchase", "members", "logs"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 px-6 rounded-xl text-xl font-bold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-gray-500 hover:bg-stone-100"
              }`}
            >
              {tab === "entry" && "입실 기록"}
              {tab === "purchase" && "구매 내역"}
              {tab === "members" && "회원 관리"}
              {tab === "logs" && "활동 로그"}
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

        {/* 리스트 영역 */}
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
                        <th className="p-5 text-gray-600 font-bold text-lg whitespace-nowrap">
                          가입일
                        </th>
                        <th className="p-5 text-gray-600 font-bold text-lg whitespace-nowrap">
                          이름
                        </th>
                        <th className="p-5 text-gray-600 font-bold text-lg whitespace-nowrap">
                          전화번호
                        </th>
                        <th className="p-5 text-gray-600 font-bold text-lg whitespace-nowrap">
                          2차 비번
                        </th>
                        <th className="p-5 text-gray-600 font-bold text-lg whitespace-nowrap text-center">
                          모바일 티켓
                        </th>
                        <th className="p-5 text-gray-600 font-bold text-lg whitespace-nowrap text-center">
                          관리
                        </th>
                      </>
                    ) : activeTab === "logs" ? (
                      <>
                        <th className="p-5 text-gray-600 font-bold text-lg">
                          일시
                        </th>
                        <th className="p-5 text-gray-600 font-bold text-lg">
                          이름
                        </th>
                        <th className="p-5 text-gray-600 font-bold text-lg">
                          전화번호
                        </th>
                        <th className="p-5 text-gray-600 font-bold text-lg">
                          활동
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
                  {/* 회원 관리 탭 */}
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
                        <td className="p-5 font-mono text-emerald-600 font-bold">
                          {m.second_password || (
                            <span className="text-red-400 text-sm">
                              (미설정)
                            </span>
                          )}
                        </td>
                        <td className="p-5 text-center">
                          {m.qr_code && origin ? (
                            <a
                              href={`${origin}/my-qr/${m.qr_code}`}
                              target="_blank"
                              className="inline-flex flex-col items-center justify-center p-2 border rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all bg-white group"
                              title="클릭하면 모바일 티켓이 열립니다"
                            >
                              {/* QR 코드에 전체 주소(URL)를 넣어서 핸드폰 스캔 시 바로 연결되게 함 */}
                              <QRCode
                                value={`${origin}/my-qr/${m.qr_code}`}
                                size={60}
                              />
                              <span className="text-xs text-gray-400 mt-1 group-hover:text-emerald-600 font-medium">
                                티켓 보기
                              </span>
                            </a>
                          ) : (
                            <span className="text-gray-300">로딩중...</span>
                          )}
                        </td>
                        <td className="p-5 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => openEditModal(m)}
                              className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-sm font-bold hover:bg-blue-100 border border-blue-200"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleForceDelete(m)}
                              className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-sm font-bold hover:bg-red-100 border border-red-200"
                            >
                              탈퇴
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                  {/* 로그 탭 */}
                  {activeTab === "logs" &&
                    filterData(memberLogs).map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50">
                        <td className="p-5 text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-5 font-bold text-gray-900">
                          {log.name}
                        </td>
                        <td className="p-5 text-gray-700">
                          {log.phone_number}
                        </td>
                        <td className="p-5">
                          <span
                            className={`px-3 py-1 rounded-full font-bold text-sm ${
                              log.action_type === "가입"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {log.action_type}
                          </span>
                        </td>
                      </tr>
                    ))}

                  {/* 입실/구매 탭 */}
                  {(activeTab === "entry" || activeTab === "purchase") &&
                    filterData(
                      activeTab === "entry" ? entryLogs : purchases
                    ).map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50">
                        <td className="p-5 text-gray-500">
                          {new Date(
                            item.entry_time || item.purchase_date
                          ).toLocaleString()}
                        </td>
                        <td className="p-5 font-bold text-gray-900">
                          {item.name}
                        </td>
                        <td className="p-5 text-gray-700">
                          {item.phone_number}
                        </td>
                        <td className="p-5">
                          {activeTab === "entry" ? (
                            <span className="text-emerald-600 font-medium">
                              {item.pass_type} 입실
                            </span>
                          ) : (
                            <span>
                              <span className="font-bold text-emerald-700">
                                {item.pass_type}
                              </span>{" "}
                              ({item.purchase_count}회)
                              <span className="ml-2 text-sm text-gray-400">
                                잔여: {item.remaining_count}
                              </span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {filterData(
                activeTab === "members"
                  ? members
                  : activeTab === "logs"
                  ? memberLogs
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

      {/* 회원 수정 모달 */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              회원 정보 수정
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">
                  이름
                </label>
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full p-3 text-lg border-2 border-stone-200 rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">
                  전화번호
                </label>
                <input
                  value={editForm.phone_number}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      phone_number: e.target.value.replace(/[^0-9]/g, ""),
                    })
                  }
                  className="w-full p-3 text-lg border-2 border-stone-200 rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">
                  2차 비밀번호 (재설정)
                </label>
                <input
                  value={editForm.second_password}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      second_password: e.target.value,
                    })
                  }
                  className="w-full p-3 text-lg border-2 border-stone-200 rounded-xl focus:border-emerald-500 outline-none bg-yellow-50"
                  placeholder="새 비밀번호 입력"
                />
                <p className="text-xs text-gray-400 mt-1">
                  * 비밀번호를 잃어버린 회원에게 새로 설정해 주세요.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setIsEditOpen(false)}
                className="flex-1 bg-stone-200 text-gray-700 font-bold py-4 rounded-xl hover:bg-stone-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateMember}
                className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-colors"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
