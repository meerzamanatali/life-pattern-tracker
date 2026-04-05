import { create } from 'zustand'
import { supabase } from '../lib/supabase'

const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  init: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null })

    if (session?.user) {
      await get().fetchProfile(session.user.id)
    }
    set({ loading: false })

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user ?? null })
      if (session?.user) {
        await get().fetchProfile(session.user.id)
      } else {
        set({ profile: null })
      }
    })
  },

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) set({ profile: data })
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  signUp: async (email, password, fullName, couponCode) => {
    const normalizedCode = couponCode.toUpperCase().trim()

    const { data: coupons, error: couponError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', normalizedCode)

    if (couponError || !coupons || coupons.length === 0) {
      throw new Error('Invalid or already used invite code')
    }

    const coupon = coupons[0]

    if (coupon.is_used) {
      throw new Error('Invalid or already used invite code')
    }

    const { data: allCoupons } = await supabase.from('coupons').select('is_used')

    const allUsed = allCoupons?.every((c) => c.is_used)
    if (allUsed) {
      throw new Error('Invite only - all spots taken. No more spots available.')
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })
    if (authError) throw authError

    const userId = authData.user.id

    await supabase.from('profiles').insert({
      id: userId,
      full_name: fullName,
    })

    await supabase
      .from('coupons')
      .update({
        is_used: true,
        used_by_email: email,
        used_at: new Date().toISOString(),
      })
      .eq('code', normalizedCode)

    return authData
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, profile: null })
  },
}))

export default useAuthStore
