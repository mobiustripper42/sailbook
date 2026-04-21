'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function enrollInCourse(courseId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load course to check status + capacity
  const { data: course } = await supabase
    .from('courses')
    .select('id, status, capacity')
    .eq('id', courseId)
    .single()

  if (!course || course.status !== 'active') {
    return { error: 'This course is not available for enrollment.' }
  }

  // 2.6 — duplicate prevention
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id, status')
    .eq('course_id', courseId)
    .eq('student_id', user.id)
    .single()

  if (existing && existing.status !== 'cancelled') {
    return { error: 'You are already enrolled in this course.' }
  }

  // 2.5 — capacity enforcement
  // Must use RPC (SECURITY DEFINER) — direct count query is filtered by student RLS
  // to the student's own rows, which would always return 0 and bypass the gate.
  const { data: enrollmentCount } = await supabase
    .rpc('get_course_active_enrollment_count', { p_course_id: courseId })

  if ((enrollmentCount ?? 0) >= course.capacity) {
    return { error: 'This course is full.' }
  }

  // Enroll (upsert handles the case where a cancelled enrollment exists)
  let enrollmentId: string
  if (existing?.status === 'cancelled') {
    const { error } = await supabase
      .from('enrollments')
      .update({ status: 'registered', enrolled_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) return { error: error.message }
    enrollmentId = existing.id
  } else {
    const { data: newEnrollment, error } = await supabase
      .from('enrollments')
      .insert({ course_id: courseId, student_id: user.id, status: 'registered' })
      .select('id')
      .single()
    if (error) return { error: error.message }
    enrollmentId = newEnrollment.id
  }

  // 3.2 — Auto-create attendance records for all sessions in this course
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id')
    .eq('course_id', courseId)

  if (sessionsError) return { error: sessionsError.message }

  if (sessions && sessions.length > 0) {
    const attendanceRows = sessions.map((session) => ({
      session_id: session.id,
      enrollment_id: enrollmentId,
      status: 'expected' as const,
    }))

    // Use upsert to handle re-enrollment (cancelled → registered) where records may exist
    const { error: attendanceError } = await supabase
      .from('session_attendance')
      .upsert(attendanceRows, { onConflict: 'session_id,enrollment_id' })

    if (attendanceError) return { error: attendanceError.message }
  }

  revalidatePath(`/student/courses/${courseId}`)
  revalidatePath('/student/courses')
  revalidatePath('/student/dashboard')
}

export async function createCheckoutSession(
  courseId: string
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Load course
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, status, capacity, price, member_price')
    .eq('id', courseId)
    .single()

  if (!course || course.status !== 'active') {
    return { error: 'This course is not available for enrollment.' }
  }

  if (course.price == null) {
    return { error: 'This course does not have a price set. Contact the school to enroll.' }
  }

  // Check for an existing non-cancelled, non-expired hold or enrollment
  const { data: existing } = await supabase
    .from('enrollments')
    .select('id, status, hold_expires_at, stripe_checkout_session_id')
    .eq('course_id', courseId)
    .eq('student_id', user.id)
    .maybeSingle()

  const holdMinutes = parseInt(process.env.ENROLLMENT_HOLD_MINUTES ?? '15', 10)
  const now = new Date()

  if (existing) {
    const isActiveHold =
      existing.status === 'pending_payment' &&
      existing.hold_expires_at != null &&
      new Date(existing.hold_expires_at) > now

    const isActiveEnrollment =
      existing.status !== 'cancelled' && existing.status !== 'pending_payment'

    if (isActiveEnrollment) {
      return { error: 'You are already enrolled in this course.' }
    }

    if (isActiveHold && existing.stripe_checkout_session_id) {
      // Reuse existing Stripe session
      const session = await stripe.checkout.sessions.retrieve(
        existing.stripe_checkout_session_id
      )
      if (session.url) return { url: session.url }
    }
    // Expired hold or cancelled — fall through to create a new session
  }

  // Capacity check (SECURITY DEFINER RPC — student RLS would always return 0)
  const { data: enrollmentCount } = await supabase
    .rpc('get_course_active_enrollment_count', { p_course_id: courseId })

  if ((enrollmentCount ?? 0) >= course.capacity) {
    return { error: 'This course is full.' }
  }

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, stripe_customer_id, is_member, is_student')
    .eq('id', user.id)
    .single()

  let stripeCustomerId = profile?.stripe_customer_id ?? null

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: profile ? `${profile.first_name} ${profile.last_name}` : undefined,
      metadata: { supabase_user_id: user.id },
    })
    stripeCustomerId = customer.id

    const { error: customerUpdateError } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', user.id)
    if (customerUpdateError) {
      // Non-fatal: Stripe customer exists, enrollment can proceed.
      // Duplicate customer risk is low; admin can merge via Stripe dashboard.
      console.error('Failed to save stripe_customer_id:', customerUpdateError.message)
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const holdExpiry = new Date(now.getTime() + holdMinutes * 60 * 1000)

  const isMember = (profile?.is_member ?? false) && (profile?.is_student ?? false)
  const chargePrice = (isMember && course.member_price != null) ? course.member_price : course.price

  // Create Stripe Checkout Session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: course.title ?? 'Course Enrollment' },
          unit_amount: Math.round(chargePrice * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${siteUrl}/student/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/student/checkout/cancel?course_id=${courseId}`,
    // Note: Stripe session expires after 24h by default (minimum is 30 min — too long for our
    // 1-15 min hold). hold_expires_at in the DB is our mechanism; 2.4 cleans up expired holds.
    metadata: {
      course_id: courseId,
      student_id: user.id,
    },
  })

  // Upsert enrollment with pending_payment hold
  if (existing) {
    const { error: updateErr } = await supabase
      .from('enrollments')
      .update({
        status: 'pending_payment',
        hold_expires_at: holdExpiry.toISOString(),
        stripe_checkout_session_id: checkoutSession.id,
        enrolled_at: now.toISOString(),
      })
      .eq('id', existing.id)
    if (updateErr) return { error: updateErr.message }
  } else {
    const { error: insertErr } = await supabase
      .from('enrollments')
      .insert({
        course_id: courseId,
        student_id: user.id,
        status: 'pending_payment',
        hold_expires_at: holdExpiry.toISOString(),
        stripe_checkout_session_id: checkoutSession.id,
      })
    if (insertErr) return { error: insertErr.message }
  }

  revalidatePath(`/student/courses/${courseId}`)

  // TODO(2.4): if url is missing the hold is written but student can't pay — expiry will clean it up
  if (!checkoutSession.url) {
    return { error: 'Failed to create checkout session. Please try again.' }
  }

  return { url: checkoutSession.url }
}
