"use client";

import { useState, useEffect } from "react";
import { FaShareAlt, FaUserFriends, FaTrophy, FaCopy } from "react-icons/fa";

import { useLocale } from "@/components/LocaleProvider";
import { referralService } from "@/services/referral-service";

interface ReferralWidgetProps {
  userId: string;
  userName?: string;
  userEmail?: string;
}

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  rewardEligible?: boolean;
  nextRewardAt?: number;
}

export default function ReferralWidget({
  userId,
  userName: _userName,
  userEmail,
}: ReferralWidgetProps) {
  const { t } = useLocale();
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralLink, setReferralLink] = useState<string>("");
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadReferralData = () => {
    setLoading(true);

    // Generate or get referral code
    const userReferrals = referralService.getUserReferrals(userId);
    let code: string;

    if (userReferrals.length > 0) {
      // Use most recent pending referral or create new one
      const pending = userReferrals.find((r) => r.status === "pending");
      code = pending
        ? pending.referralCode
        : referralService.generateReferralCode(userId, userEmail);
    } else {
      code = referralService.generateReferralCode(userId, userEmail);
    }

    setReferralCode(code);
    setReferralLink(referralService.getShareableLink(code, window.location.origin));

    // Get stats
    const referralStats = referralService.getUserReferralStats(userId);
    setStats(referralStats);

    setLoading(false);
  };

  useEffect(() => {
    loadReferralData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, userEmail]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    const message = referralService.getShareMessage(referralCode);
    if (navigator.share) {
      try {
        await navigator.share({
          title: t("referral.joinTitle"),
          text: message,
          url: referralLink,
        });
      } catch (err) {
        console.log("Share cancelled or failed:", err);
      }
    } else {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      alert(t("referral.copiedShare"));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Refer Friends</h3>
          <p className="text-sm text-gray-500">Earn rewards by inviting other developers</p>
        </div>
        <div className="p-2 bg-blue-100 rounded-lg">
          <FaUserFriends className="text-blue-600 text-xl" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FaUserFriends className="text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Total Referrals</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats?.totalReferrals || 0}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center">
            <FaTrophy className="text-yellow-500 mr-2" />
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {stats?.completedReferrals || 0}
          </div>
        </div>
      </div>

      {/* Reward status */}
      {stats?.rewardEligible ? (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <FaTrophy className="text-yellow-600 text-xl mr-3" />
            <div>
              <h4 className="font-semibold text-yellow-800">Reward Unlocked!</h4>
              <p className="text-sm text-yellow-700 mt-1">
                You've earned the "Community Builder" badge for referring 3+ friends!
              </p>
            </div>
          </div>
        </div>
      ) : stats?.nextRewardAt ? (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Next Reward: Community Builder Badge</h4>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(stats.completedReferrals / 3) * 100}%` }}
                />
              </div>
              <p className="text-xs text-blue-700 mt-2">
                {stats.nextRewardAt} more {stats.nextRewardAt === 1 ? "referral" : "referrals"}{" "}
                needed
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Referral link */}
      <div className="mb-6 min-w-0">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your referral link</label>
        <div className="flex min-w-0 rounded-lg overflow-hidden border border-gray-300">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 min-w-0 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900 truncate"
          />
          <button
            onClick={handleCopyLink}
            className="flex-shrink-0 px-4 py-2 bg-gray-800 text-white hover:bg-gray-900 transition-colors flex items-center"
          >
            <FaCopy className="mr-2" />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Share this link with friends. When they sign up, you'll get credit.
        </p>
      </div>

      {/* Share buttons */}
      <div className="space-y-3">
        <button
          onClick={handleShare}
          className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <FaShareAlt className="mr-2" />
          Share with Friends
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">Or copy and share this message:</p>
          <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-3 rounded border border-gray-200">
            {referralService.getShareMessage(referralCode)}
          </p>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">How it works</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-2 mt-0.5">
              1
            </span>
            Share your referral link with developer friends
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-2 mt-0.5">
              2
            </span>
            They sign up and start contributing requirements
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold mr-2 mt-0.5">
              3
            </span>
            Earn the Community Builder badge after 3 successful referrals
          </li>
        </ul>
      </div>
    </div>
  );
}
