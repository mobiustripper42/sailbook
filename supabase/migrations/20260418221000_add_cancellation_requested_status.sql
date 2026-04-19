-- Phase 2.7: Add cancel_requested enrollment status
--
-- Students can now request cancellation (confirmed → cancel_requested).
-- Admin reviews and processes refund + final cancellation.
-- Students can no longer flip directly to 'cancelled' — that's admin-only now.

-- ============================================================
-- Update student enrollment UPDATE policy
-- ============================================================

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
  );
