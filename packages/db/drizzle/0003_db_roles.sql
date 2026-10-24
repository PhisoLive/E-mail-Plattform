-- Database roles (concept chapter 16): ep_app for all workspace-scoped work, ep_system for
-- systemContext (scheduler, sync dispatcher, edge token resolution, platform tables, admin).
-- Phase 14 adds row level security; ep_system then gets BYPASSRLS.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ep_app') THEN
    CREATE ROLE ep_app NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ep_system') THEN
    CREATE ROLE ep_system NOLOGIN;
  END IF;
END $$;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO ep_app, ep_system;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ep_app, ep_system;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ep_app, ep_system;
--> statement-breakpoint
-- The application login role must be allowed to switch into both roles (SET LOCAL ROLE).
DO $$
BEGIN
  EXECUTE format('GRANT ep_app, ep_system TO %I', current_user);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'could not grant ep roles to %: %', current_user, SQLERRM;
END $$;
