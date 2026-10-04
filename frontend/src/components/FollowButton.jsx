import { API_URL } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, UserCheck, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


const getSession = () => {
  const token = localStorage.getItem("token");
  try {
    return { token, user: JSON.parse(localStorage.getItem("user") || "null") };
  } catch {
    return { token, user: null };
  }
};

export default function FollowButton({ uploaderId, uploaderName }) {
  const { toast } = useToast();
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(null);
  const [busy, setBusy] = useState(false);
  const [canFollow, setCanFollow] = useState(false);

  const syncFollowState = useCallback(async () => {
    if (!uploaderId) return;
    const { token, user } = getSession();
    const viewerId = user?._id || user?.id;
    const isSelf = viewerId && String(viewerId) === String(uploaderId);
    setCanFollow(!isSelf);
    if (!token || isSelf) {
      setFollowing(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/follows/${uploaderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setFollowing(Boolean(data.following));
      setFollowerCount(Number.isFinite(data.followerCount) ? data.followerCount : null);
    } catch {
      // Keep the follow control available if the status lookup is temporarily unavailable.
    }
  }, [uploaderId]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void syncFollowState(); });
    window.addEventListener("authChange", syncFollowState);
    return () => {
      active = false;
      window.removeEventListener("authChange", syncFollowState);
    };
  }, [syncFollowState]);

  const handleToggleFollow = async () => {
    const { token } = getSession();
    if (!token) {
      window.dispatchEvent(new CustomEvent("openAuthModal", { detail: { tab: "login" } }));
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/follows/${uploaderId}`, {
        method: following ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Không thể cập nhật theo dõi");
      setFollowing(Boolean(data.following));
      if (Number.isFinite(data.followerCount)) setFollowerCount(data.followerCount);
      toast({
        title: data.following ? `Đang theo dõi ${uploaderName}` : "Đã bỏ theo dõi",
        description: data.following
          ? "StudyHub sẽ báo khi tài liệu mới của họ được duyệt."
          : "Bạn sẽ không còn nhận thông báo tài liệu mới từ người này.",
      });
    } catch (error) {
      toast({ title: "Chưa cập nhật được", description: error.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (!canFollow) return null;

  return (
    <button
      type="button"
      className={`follow-button${following ? " is-following" : ""}`}
      onClick={handleToggleFollow}
      disabled={busy}
      aria-pressed={following}
      aria-label={following ? `Bỏ theo dõi ${uploaderName}` : `Theo dõi ${uploaderName}`}
      title={followerCount === null ? undefined : `${followerCount} người theo dõi`}
    >
      {busy ? <LoaderCircle className="animate-spin" size={13} /> : following ? <UserCheck size={13} /> : <UserPlus size={13} />}
      <span>{following ? "Đang theo dõi" : "Theo dõi"}</span>
    </button>
  );
}
