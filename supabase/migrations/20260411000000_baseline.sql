


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_all_course_enrollment_counts"() RETURNS TABLE("course_id" "uuid", "active_count" integer)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT course_id, COUNT(*)::INTEGER AS active_count
  FROM enrollments
  WHERE status != 'cancelled'
  GROUP BY course_id;
$$;


ALTER FUNCTION "public"."get_all_course_enrollment_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_course_active_enrollment_count"("p_course_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT COUNT(*)::INTEGER
  FROM enrollments
  WHERE course_id = p_course_id AND status != 'cancelled';
$$;


ALTER FUNCTION "public"."get_course_active_enrollment_count"("p_course_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_enrolled_course_ids"("user_id" "uuid") RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT course_id FROM enrollments WHERE student_id = user_id;
$$;


ALTER FUNCTION "public"."get_enrolled_course_ids"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_instructor_course_ids"("user_id" "uuid") RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT id FROM courses WHERE instructor_id = user_id
  UNION
  SELECT DISTINCT course_id FROM sessions WHERE instructor_id = user_id;
$$;


ALTER FUNCTION "public"."get_instructor_course_ids"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_instructor_session_ids"("user_id" "uuid") RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT s.id FROM sessions s
  LEFT JOIN courses c ON s.course_id = c.id
  WHERE c.instructor_id = user_id OR s.instructor_id = user_id;
$$;


ALTER FUNCTION "public"."get_instructor_session_ids"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_instructor_student_ids"("user_id" "uuid") RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT DISTINCT e.student_id
  FROM enrollments e
  JOIN courses c ON e.course_id = c.id
  WHERE c.instructor_id = user_id
  UNION
  SELECT DISTINCT e.student_id
  FROM enrollments e
  JOIN sessions s ON e.course_id = s.course_id
  WHERE s.instructor_id = user_id;
$$;


ALTER FUNCTION "public"."get_instructor_student_ids"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_student_enrollment_ids"("user_id" "uuid") RETURNS SETOF "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT id FROM enrollments WHERE student_id = user_id;
$$;


ALTER FUNCTION "public"."get_student_enrollment_ids"("user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."course_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "short_code" character varying(20) NOT NULL,
    "certification_body" character varying(100),
    "description" "text",
    "min_hours" integer,
    "max_students" integer DEFAULT 4,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."course_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_type_id" "uuid" NOT NULL,
    "instructor_id" "uuid",
    "title" character varying(255),
    "description" "text",
    "capacity" integer DEFAULT 4 NOT NULL,
    "price" numeric(10,2),
    "status" character varying(20) DEFAULT 'draft'::character varying,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."enrollments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "status" character varying(20) DEFAULT 'registered'::character varying,
    "enrolled_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."enrollments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL,
    "first_name" character varying(100) NOT NULL,
    "last_name" character varying(100) NOT NULL,
    "phone" character varying(20),
    "experience_level" character varying(20),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_admin" boolean DEFAULT false NOT NULL,
    "is_instructor" boolean DEFAULT false NOT NULL,
    "is_student" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_attendance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "enrollment_id" "uuid" NOT NULL,
    "status" character varying(20) DEFAULT 'expected'::character varying,
    "makeup_session_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."session_attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "instructor_id" "uuid",
    "date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "location" character varying(255),
    "status" character varying(20) DEFAULT 'scheduled'::character varying,
    "cancel_reason" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."course_types"
    ADD CONSTRAINT "course_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_types"
    ADD CONSTRAINT "course_types_short_code_key" UNIQUE ("short_code");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_course_id_student_id_key" UNIQUE ("course_id", "student_id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_attendance"
    ADD CONSTRAINT "session_attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_attendance"
    ADD CONSTRAINT "session_attendance_session_id_enrollment_id_key" UNIQUE ("session_id", "enrollment_id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_attendance_enrollment" ON "public"."session_attendance" USING "btree" ("enrollment_id");



CREATE INDEX "idx_attendance_makeup" ON "public"."session_attendance" USING "btree" ("makeup_session_id");



CREATE INDEX "idx_attendance_session" ON "public"."session_attendance" USING "btree" ("session_id");



CREATE INDEX "idx_courses_instructor" ON "public"."courses" USING "btree" ("instructor_id");



CREATE INDEX "idx_courses_status" ON "public"."courses" USING "btree" ("status");



CREATE INDEX "idx_courses_type" ON "public"."courses" USING "btree" ("course_type_id");



CREATE INDEX "idx_enrollments_course" ON "public"."enrollments" USING "btree" ("course_id");



CREATE INDEX "idx_enrollments_student" ON "public"."enrollments" USING "btree" ("student_id");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_is_admin" ON "public"."profiles" USING "btree" ("is_admin") WHERE ("is_admin" = true);



CREATE INDEX "idx_profiles_is_instructor" ON "public"."profiles" USING "btree" ("is_instructor") WHERE ("is_instructor" = true);



CREATE INDEX "idx_profiles_is_student" ON "public"."profiles" USING "btree" ("is_student") WHERE ("is_student" = true);



CREATE INDEX "idx_sessions_course" ON "public"."sessions" USING "btree" ("course_id");



CREATE INDEX "idx_sessions_date" ON "public"."sessions" USING "btree" ("date");



CREATE INDEX "idx_sessions_status" ON "public"."sessions" USING "btree" ("status");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_course_type_id_fkey" FOREIGN KEY ("course_type_id") REFERENCES "public"."course_types"("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."enrollments"
    ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_attendance"
    ADD CONSTRAINT "session_attendance_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_attendance"
    ADD CONSTRAINT "session_attendance_makeup_session_id_fkey" FOREIGN KEY ("makeup_session_id") REFERENCES "public"."sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."session_attendance"
    ADD CONSTRAINT "session_attendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."profiles"("id");



CREATE POLICY "Admins can do anything with course_types" ON "public"."course_types" TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text")) WITH CHECK (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text"));



CREATE POLICY "Admins can do anything with courses" ON "public"."courses" TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text")) WITH CHECK (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text"));



CREATE POLICY "Admins can do anything with enrollments" ON "public"."enrollments" TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text")) WITH CHECK (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text"));



CREATE POLICY "Admins can do anything with session_attendance" ON "public"."session_attendance" TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text")) WITH CHECK (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text"));



CREATE POLICY "Admins can do anything with sessions" ON "public"."sessions" TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text")) WITH CHECK (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text"));



CREATE POLICY "Admins can insert profiles" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text"));



CREATE POLICY "Admins can read all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text"));



CREATE POLICY "Admins can update all profiles" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_admin'::"text") = 'true'::"text"));



CREATE POLICY "Anyone can read instructor profiles" ON "public"."profiles" FOR SELECT USING (("is_instructor" = true));



CREATE POLICY "Authenticated users can read active course_types" ON "public"."course_types" FOR SELECT TO "authenticated" USING (("is_active" = true));



CREATE POLICY "Instructors can read attendance for their sessions" ON "public"."session_attendance" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_instructor'::"text") = 'true'::"text") AND ("session_id" IN ( SELECT "public"."get_instructor_session_ids"("auth"."uid"()) AS "get_instructor_session_ids"))));



CREATE POLICY "Instructors can read enrollments for their courses" ON "public"."enrollments" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_instructor'::"text") = 'true'::"text") AND ("course_id" IN ( SELECT "public"."get_instructor_course_ids"("auth"."uid"()) AS "get_instructor_course_ids"))));



CREATE POLICY "Instructors can read sessions for their courses" ON "public"."sessions" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_instructor'::"text") = 'true'::"text") AND ("id" IN ( SELECT "public"."get_instructor_session_ids"("auth"."uid"()) AS "get_instructor_session_ids"))));



CREATE POLICY "Instructors can read student profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_instructor'::"text") = 'true'::"text") AND ("id" IN ( SELECT "public"."get_instructor_student_ids"("auth"."uid"()) AS "get_instructor_student_ids"))));



CREATE POLICY "Instructors can read their own courses" ON "public"."courses" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_instructor'::"text") = 'true'::"text") AND ("id" IN ( SELECT "public"."get_instructor_course_ids"("auth"."uid"()) AS "get_instructor_course_ids"))));



CREATE POLICY "Students can enroll themselves" ON "public"."enrollments" FOR INSERT TO "authenticated" WITH CHECK ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_student'::"text") = 'true'::"text") AND ("student_id" = "auth"."uid"())));



CREATE POLICY "Students can insert own attendance" ON "public"."session_attendance" FOR INSERT TO "authenticated" WITH CHECK ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_student'::"text") = 'true'::"text") AND ("enrollment_id" IN ( SELECT "public"."get_student_enrollment_ids"("auth"."uid"()) AS "get_student_enrollment_ids")) AND (("status")::"text" = 'expected'::"text")));



CREATE POLICY "Students can read active courses" ON "public"."courses" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_student'::"text") = 'true'::"text") AND (("status")::"text" = 'active'::"text")));



CREATE POLICY "Students can read own attendance" ON "public"."session_attendance" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_student'::"text") = 'true'::"text") AND ("enrollment_id" IN ( SELECT "public"."get_student_enrollment_ids"("auth"."uid"()) AS "get_student_enrollment_ids"))));



CREATE POLICY "Students can read own enrollments" ON "public"."enrollments" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_student'::"text") = 'true'::"text") AND ("student_id" = "auth"."uid"())));



CREATE POLICY "Students can read sessions for active courses" ON "public"."sessions" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_student'::"text") = 'true'::"text") AND ("course_id" IN ( SELECT "courses"."id"
   FROM "public"."courses"
  WHERE (("courses"."status")::"text" = 'active'::"text")))));



CREATE POLICY "Students can read sessions for their enrolled courses" ON "public"."sessions" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_student'::"text") = 'true'::"text") AND ("course_id" IN ( SELECT "public"."get_enrolled_course_ids"("auth"."uid"()) AS "get_enrolled_course_ids"))));



CREATE POLICY "Students can read their enrolled courses" ON "public"."courses" FOR SELECT TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_student'::"text") = 'true'::"text") AND ("id" IN ( SELECT "public"."get_enrolled_course_ids"("auth"."uid"()) AS "get_enrolled_course_ids"))));



CREATE POLICY "Students can update own attendance" ON "public"."session_attendance" FOR UPDATE TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_student'::"text") = 'true'::"text") AND ("enrollment_id" IN ( SELECT "public"."get_student_enrollment_ids"("auth"."uid"()) AS "get_student_enrollment_ids")))) WITH CHECK ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_student'::"text") = 'true'::"text") AND ("enrollment_id" IN ( SELECT "public"."get_student_enrollment_ids"("auth"."uid"()) AS "get_student_enrollment_ids")) AND (("status")::"text" = 'expected'::"text")));



CREATE POLICY "Students can update own enrollments" ON "public"."enrollments" FOR UPDATE TO "authenticated" USING ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_student'::"text") = 'true'::"text") AND ("student_id" = "auth"."uid"()))) WITH CHECK ((((("auth"."jwt"() -> 'user_metadata'::"text") ->> 'is_student'::"text") = 'true'::"text") AND ("student_id" = "auth"."uid"())));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can read own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."course_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."enrollments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_attendance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."get_all_course_enrollment_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_course_enrollment_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_course_enrollment_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_course_active_enrollment_count"("p_course_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_course_active_enrollment_count"("p_course_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_course_active_enrollment_count"("p_course_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_enrolled_course_ids"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_enrolled_course_ids"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_enrolled_course_ids"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_instructor_course_ids"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_instructor_course_ids"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_instructor_course_ids"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_instructor_session_ids"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_instructor_session_ids"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_instructor_session_ids"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_instructor_student_ids"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_instructor_student_ids"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_instructor_student_ids"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_student_enrollment_ids"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_student_enrollment_ids"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_student_enrollment_ids"("user_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."course_types" TO "anon";
GRANT ALL ON TABLE "public"."course_types" TO "authenticated";
GRANT ALL ON TABLE "public"."course_types" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."enrollments" TO "anon";
GRANT ALL ON TABLE "public"."enrollments" TO "authenticated";
GRANT ALL ON TABLE "public"."enrollments" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."session_attendance" TO "anon";
GRANT ALL ON TABLE "public"."session_attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."session_attendance" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































