-- Phase 2.8: Tighten student enrollment UPDATE WITH CHECK
--
-- Security fix (session 80 code review): the cancel-request policy's WITH CHECK
-- did not prevent a student from also mutating hold_expires_at in the same UPDATE.
-- Adding hold_expires_at IS NULL closes that gap — students can't extend a payment
-- hold while requesting cancellation.

DROP POLICY IF EXISTS "Students can update own enrollments" ON public.enrollments;

CREATE POLICY "Students can update own enrollments"
  ON public.enrollments
  FOR UPDATE
  TO authenticated
  USING (
    ((auth.jwt() -> 'user_metadata'::text) ->> 'is_student'::text) = 'true'::text
    AND student_id = auth.uid()
    AND status = 'confirmed'
  )
  WITH CHECK (
    ((auth.jwt() -> 'user_metadata'::text) ->> 'is_student'::text) = 'true'::text
    AND student_id = auth.uid()
    AND (status)::text = 'cancel_requested'::text
    AND hold_expires_at IS NULL
  );
