// Referral system for DemandPulse
// Tracks user referrals and rewards

export interface Referral {
  id: string
  referrerUserId: string
  referredUserId?: string // null until referred user signs up
  referredEmail?: string
  referralCode: string
  status: 'pending' | 'completed' | 'expired'
  createdAt: Date
  completedAt?: Date
  rewardGranted: boolean
  rewardType?: 'badge' | 'feature' | 'recognition'
  metadata?: {
    source?: string
    campaign?: string
    userAgent?: string
  }
}

export interface ReferralStats {
  totalReferrals: number
  completedReferrals: number
  pendingReferrals: number
  rewardEligible: boolean
  nextRewardAt?: number // number of referrals needed for next reward
}

export class ReferralService {
  // In-memory storage (in production, use database)
  private referrals: Map<string, Referral> = new Map()
  private userReferrals: Map<string, string[]> = new Map() // userId -> referralIds

  generateReferralCode(userId: string, email?: string): string {
    // Generate a unique referral code
    const baseCode = `DP-${userId.substring(0, 8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    const code = baseCode.replace(/[^A-Z0-9]/g, '')

    const referral: Referral = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      referrerUserId: userId,
      referredEmail: email,
      referralCode: code,
      status: 'pending',
      createdAt: new Date(),
      rewardGranted: false,
      metadata: {}
    }

    this.referrals.set(referral.id, referral)

    // Track user's referrals
    const userRefs = this.userReferrals.get(userId) || []
    userRefs.push(referral.id)
    this.userReferrals.set(userId, userRefs)

    console.log(`[ReferralService] Generated referral code ${code} for user ${userId}`)
    return code
  }

  getReferralByCode(code: string): Referral | undefined {
    return Array.from(this.referrals.values()).find(ref => ref.referralCode === code)
  }

  getUserReferrals(userId: string): Referral[] {
    const referralIds = this.userReferrals.get(userId) || []
    return referralIds.map(id => this.referrals.get(id)).filter(Boolean) as Referral[]
  }

  getUserReferralStats(userId: string): ReferralStats {
    const referrals = this.getUserReferrals(userId)
    const totalReferrals = referrals.length
    const completedReferrals = referrals.filter(r => r.status === 'completed').length
    const pendingReferrals = referrals.filter(r => r.status === 'pending').length

    // Simple reward system: badge after 3 referrals
    const rewardEligible = completedReferrals >= 3
    const nextRewardAt = rewardEligible ? undefined : Math.max(0, 3 - completedReferrals)

    return {
      totalReferrals,
      completedReferrals,
      pendingReferrals,
      rewardEligible,
      nextRewardAt
    }
  }

  processReferralSignup(referralCode: string, referredUserId: string): boolean {
    const referral = this.getReferralByCode(referralCode)
    if (!referral) {
      console.log(`[ReferralService] Referral code ${referralCode} not found`)
      return false
    }

    if (referral.status !== 'pending') {
      console.log(`[ReferralService] Referral ${referralCode} already processed or expired`)
      return false
    }

    // Update referral
    referral.referredUserId = referredUserId
    referral.status = 'completed'
    referral.completedAt = new Date()

    // Check if referrer gets a reward
    const referrerStats = this.getUserReferralStats(referral.referrerUserId)
    if (referrerStats.completedReferrals >= 3 && !referral.rewardGranted) {
      referral.rewardGranted = true
      referral.rewardType = 'badge'
      console.log(`[ReferralService] Reward granted to referrer ${referral.referrerUserId} for referral ${referralCode}`)
    }

    this.referrals.set(referral.id, referral)
    console.log(`[ReferralService] Referral ${referralCode} completed for user ${referredUserId}`)
    return true
  }

  getShareableLink(referralCode: string, baseUrl: string = 'https://demandpulse.app'): string {
    return `${baseUrl}/auth/signin?ref=${referralCode}`
  }

  getShareMessage(referralCode: string): string {
    const link = this.getShareableLink(referralCode)
    return `Join me on DemandPulse to discover real-time developer trends and share your requirements! Use my referral link: ${link}`
  }

  // For dashboard display
  getLeaderboard(limit: number = 10): Array<{ userId: string; completedReferrals: number }> {
    const userStats = new Map<string, number>()

    for (const referral of this.referrals.values()) {
      if (referral.status === 'completed') {
        const current = userStats.get(referral.referrerUserId) || 0
        userStats.set(referral.referrerUserId, current + 1)
      }
    }

    return Array.from(userStats.entries())
      .map(([userId, count]) => ({ userId, completedReferrals: count }))
      .sort((a, b) => b.completedReferrals - a.completedReferrals)
      .slice(0, limit)
  }
}

// Singleton instance
export const referralService = new ReferralService()