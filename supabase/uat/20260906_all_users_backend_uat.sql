-- SLS Breakage Backend UAT — ALL USER / ALL RDC
-- Rollback-safe backend validation. Test workflow mutations are rolled back per RDC.
-- Run once in Supabase SQL Editor after the v45 workflow + evidence RLS are installed.
-- Expected output: every row PASS.
-- NOTE: this validates backend identity/role/RDC/workflow/policy. Browser rendering and real file bytes
-- are validated separately in the web UAT.

create temp table if not exists _sls_breakage_uat_results(
  test_group text,
  rdc text,
  user_id text,
  result text,
  detail text
);
truncate _sls_breakage_uat_results;

-- 0) RPC preflight. Report clearly instead of silently assuming the v45 contract exists.
insert into _sls_breakage_uat_results
select 'RPC PREFLIGHT','NATIONAL',x.rpc,
       case when x.exists_flag then 'PASS' else 'FAIL' end,
       case when x.exists_flag then 'RPC available' else 'Required RPC missing' end
from (
  select 'breakage_my_access_v44' rpc, exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='breakage_my_access_v44') exists_flag
  union all select 'breakage_incident_create_v45', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='breakage_incident_create_v45')
  union all select 'breakage_incident_spv_decide_v45', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='breakage_incident_spv_decide_v45')
  union all select 'breakage_incident_master_action_v45', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='breakage_incident_master_action_v45')
  union all select 'breakage_incident_list', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='breakage_incident_list')
  union all select 'breakage_incident_audit_list_v45', exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='breakage_incident_audit_list_v45')
) x;

-- 1) Verify the 16 required active Auth identities exist.
insert into _sls_breakage_uat_results(test_group,rdc,user_id,result,detail)
with required(rdc,user_id,email) as (
  values
  ('NATIONAL','master','master@sls.internal'),
  ('Jakarta','wms.jkt.mgr','wms.jkt.mgr@sls.internal'),
  ('Jakarta','wms.jkt.spv','wms.jkt.spv@sls.internal'),
  ('Jakarta','wms.jkt.ops','wms.jkt.ops@sls.internal'),
  ('Semarang','wms.smg.mgr','wms.smg.mgr@sls.internal'),
  ('Semarang','wms.smg.spv','wms.smg.spv@sls.internal'),
  ('Semarang','wms.smg.ops','wms.smg.ops@sls.internal'),
  ('Surabaya','wms.sby.mgr','wms.sby.mgr@sls.internal'),
  ('Surabaya','wms.sby.spv','wms.sby.spv@sls.internal'),
  ('Surabaya','wms.sby.ops','wms.sby.ops@sls.internal'),
  ('Denpasar','wms.dps.mgr','wms.dps.mgr@sls.internal'),
  ('Denpasar','wms.dps.spv','wms.dps.spv@sls.internal'),
  ('Denpasar','wms.dps.ops','wms.dps.ops@sls.internal'),
  ('Palembang','wms.plb.mgr','wms.plb.mgr@sls.internal'),
  ('Palembang','wms.plb.spv','wms.plb.spv@sls.internal'),
  ('Palembang','wms.plb.ops','wms.plb.ops@sls.internal')
)
select 'AUTH ID',r.rdc,r.user_id,
       case when u.id is not null and u.deleted_at is null then 'PASS' else 'FAIL' end,
       case when u.id is not null and u.deleted_at is null then 'Auth user exists and active' else 'Auth user missing/inactive: '||r.email end
from required r
left join auth.users u on lower(u.email)=lower(r.email);

-- Helper: emulate each JWT identity and check breakage_my_access_v44.
do $$
declare
  rec record;
  v_uid uuid;
  v_access jsonb;
  v_ok boolean;
begin
  if not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='breakage_my_access_v44') then
    insert into _sls_breakage_uat_results values('ROLE ACCESS','NATIONAL','ALL','FAIL','breakage_my_access_v44 missing');
    return;
  end if;

  for rec in
    select * from (values
      ('NATIONAL','master','master@sls.internal','MASTER'),
      ('Jakarta','wms.jkt.mgr','wms.jkt.mgr@sls.internal','MANAGER'),
      ('Jakarta','wms.jkt.spv','wms.jkt.spv@sls.internal','SPV'),
      ('Jakarta','wms.jkt.ops','wms.jkt.ops@sls.internal','ADMIN'),
      ('Semarang','wms.smg.mgr','wms.smg.mgr@sls.internal','MANAGER'),
      ('Semarang','wms.smg.spv','wms.smg.spv@sls.internal','SPV'),
      ('Semarang','wms.smg.ops','wms.smg.ops@sls.internal','ADMIN'),
      ('Surabaya','wms.sby.mgr','wms.sby.mgr@sls.internal','MANAGER'),
      ('Surabaya','wms.sby.spv','wms.sby.spv@sls.internal','SPV'),
      ('Surabaya','wms.sby.ops','wms.sby.ops@sls.internal','ADMIN'),
      ('Denpasar','wms.dps.mgr','wms.dps.mgr@sls.internal','MANAGER'),
      ('Denpasar','wms.dps.spv','wms.dps.spv@sls.internal','SPV'),
      ('Denpasar','wms.dps.ops','wms.dps.ops@sls.internal','ADMIN'),
      ('Palembang','wms.plb.mgr','wms.plb.mgr@sls.internal','MANAGER'),
      ('Palembang','wms.plb.spv','wms.plb.spv@sls.internal','SPV'),
      ('Palembang','wms.plb.ops','wms.plb.ops@sls.internal','ADMIN')
    ) x(rdc,user_id,email,expected_role)
  loop
    select id into v_uid from auth.users where lower(email)=lower(rec.email) and deleted_at is null limit 1;
    if v_uid is null then
      insert into _sls_breakage_uat_results values('ROLE ACCESS',rec.rdc,rec.user_id,'FAIL','Auth user missing/inactive');
      continue;
    end if;

    perform set_config('request.jwt.claim.sub',v_uid::text,true);
    perform set_config('request.jwt.claim.role','authenticated',true);
    perform set_config('request.jwt.claims',jsonb_build_object('sub',v_uid::text,'role','authenticated','email',rec.email)::text,true);

    begin
      select to_jsonb(a) into v_access from public.breakage_my_access_v44() a limit 1;
      v_ok:=v_access is not null;
      if rec.expected_role='MASTER' then
        v_ok:=v_ok
          and coalesce((v_access->>'is_master')::boolean,false)=true
          and coalesce((v_access->>'can_input')::boolean,false)=false
          and coalesce((v_access->>'can_submit_approve')::boolean,false)=false;
      elsif rec.expected_role='ADMIN' then
        v_ok:=v_ok
          and coalesce((v_access->>'is_master')::boolean,false)=false
          and coalesce((v_access->>'can_input')::boolean,false)=true
          and coalesce((v_access->>'can_submit_approve')::boolean,false)=false
          and v_access->>'rdc_name'=rec.rdc;
      elsif rec.expected_role='SPV' then
        v_ok:=v_ok
          and coalesce((v_access->>'is_master')::boolean,false)=false
          and coalesce((v_access->>'can_input')::boolean,false)=false
          and coalesce((v_access->>'can_submit_approve')::boolean,false)=true
          and v_access->>'rdc_name'=rec.rdc;
      else
        v_ok:=v_ok
          and coalesce((v_access->>'is_master')::boolean,false)=false
          and coalesce((v_access->>'can_input')::boolean,false)=false
          and coalesce((v_access->>'can_submit_approve')::boolean,false)=false
          and v_access->>'rdc_name'=rec.rdc;
      end if;

      insert into _sls_breakage_uat_results values(
        'ROLE ACCESS',rec.rdc,rec.user_id,case when v_ok then 'PASS' else 'FAIL' end,
        coalesce(v_access::text,'No access row returned')
      );
    exception when others then
      insert into _sls_breakage_uat_results values('ROLE ACCESS',rec.rdc,rec.user_id,'FAIL',sqlerrm);
    end;
  end loop;
end $$;

-- 2) Storage readiness: private bucket + authenticated SELECT/INSERT policies.
insert into _sls_breakage_uat_results
select 'STORAGE','NATIONAL','breakage-evidence',
       case when coalesce(b.public,false)=false
                  and exists(select 1 from pg_policies p where p.schemaname='storage' and p.tablename='objects' and p.cmd='INSERT' and 'authenticated'::name=any(p.roles) and coalesce(p.with_check,'') like '%breakage-evidence%')
                  and exists(select 1 from pg_policies p where p.schemaname='storage' and p.tablename='objects' and p.cmd='SELECT' and 'authenticated'::name=any(p.roles) and coalesce(p.qual,'') like '%breakage-evidence%')
            then 'PASS' else 'FAIL' end,
       'Private bucket + authenticated read/insert policy check'
from storage.buckets b
where b.id='breakage-evidence';

insert into _sls_breakage_uat_results
select 'STORAGE','NATIONAL','breakage-evidence','FAIL','Bucket breakage-evidence missing'
where not exists(select 1 from storage.buckets where id='breakage-evidence');

-- 3) Rollback-safe end-to-end workflow for each RDC.
-- Admin create -> SPV APPROVE -> Master START_REVIEW -> FINALIZE -> verify FINAL/CLOSED.
-- A deliberate exception at the end rolls the test incident/audit rows back.
do $$
declare
  rec record;
  v_admin uuid;
  v_spv uuid;
  v_master uuid;
  v_res jsonb;
  v_id bigint;
  v_final_status text;
  v_ba text;
  v_required_ok boolean;
begin
  select id into v_master from auth.users where lower(email)='master@sls.internal' and deleted_at is null limit 1;
  select bool_and(exists_flag) into v_required_ok
  from (
    select exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='breakage_incident_create_v45') exists_flag
    union all select exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='breakage_incident_spv_decide_v45')
    union all select exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='breakage_incident_master_action_v45')
    union all select exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='breakage_incident_list')
  ) q;

  if not coalesce(v_required_ok,false) then
    insert into _sls_breakage_uat_results values('E2E WORKFLOW','NATIONAL','Admin → SPV → Master','FAIL','One or more required workflow RPCs are missing; see RPC PREFLIGHT');
    return;
  end if;

  for rec in
    select * from (values
      ('Jakarta','wms.jkt.ops@sls.internal','wms.jkt.spv@sls.internal'),
      ('Semarang','wms.smg.ops@sls.internal','wms.smg.spv@sls.internal'),
      ('Surabaya','wms.sby.ops@sls.internal','wms.sby.spv@sls.internal'),
      ('Denpasar','wms.dps.ops@sls.internal','wms.dps.spv@sls.internal'),
      ('Palembang','wms.plb.ops@sls.internal','wms.plb.spv@sls.internal')
    ) x(rdc,admin_email,spv_email)
  loop
    select id into v_admin from auth.users where lower(email)=lower(rec.admin_email) and deleted_at is null limit 1;
    select id into v_spv from auth.users where lower(email)=lower(rec.spv_email) and deleted_at is null limit 1;
    if v_admin is null or v_spv is null or v_master is null then
      insert into _sls_breakage_uat_results values('E2E WORKFLOW',rec.rdc,'Admin → SPV → Master','FAIL','Required auth identity missing');
      continue;
    end if;

    begin
      v_ba:='UAT/'||upper(left(rec.rdc,3))||'/'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');

      perform set_config('request.jwt.claim.sub',v_admin::text,true);
      perform set_config('request.jwt.claim.role','authenticated',true);
      perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin::text,'role','authenticated','email',rec.admin_email)::text,true);
      select public.breakage_incident_create_v45(jsonb_build_object(
        'incident_type','warehouse',
        'occurrence_date',current_date::text,
        'item_code','UAT-ITEM',
        'qty_box',1,
        'uom','BOX',
        'rdc_name',rec.rdc,
        'no_ba',v_ba,
        'reported_by','UAT SYSTEM',
        'cause','Susunan',
        'cause_detail','Rollback-safe automated backend UAT',
        'warehouse_event','Pecah Dalam Pallet',
        'related_person','',
        'photo_paths',jsonb_build_array(rec.rdc||'/uat/dummy.jpg')
      )) into v_res;
      v_id:=coalesce(nullif(v_res->>'incident_id','')::bigint,nullif(v_res->>'id','')::bigint);
      if v_id is null then raise exception 'Create did not return incident_id: %',v_res; end if;

      perform set_config('request.jwt.claim.sub',v_spv::text,true);
      perform set_config('request.jwt.claims',jsonb_build_object('sub',v_spv::text,'role','authenticated','email',rec.spv_email)::text,true);
      perform public.breakage_incident_spv_decide_v45(v_id,'APPROVE','UAT approve');

      perform set_config('request.jwt.claim.sub',v_master::text,true);
      perform set_config('request.jwt.claims',jsonb_build_object('sub',v_master::text,'role','authenticated','email','master@sls.internal')::text,true);
      perform public.breakage_incident_master_action_v45(v_id,'START_REVIEW','UAT master review','{}'::jsonb);
      perform public.breakage_incident_master_action_v45(v_id,'FINALIZE','UAT final','{}'::jsonb);

      select x.status into v_final_status
      from public.breakage_incident_list(to_char(current_date,'YYYY-MM'),rec.rdc) x
      where x.incident_id=v_id
      limit 1;
      if upper(coalesce(v_final_status,'')) not in ('FINAL','CLOSED') then
        raise exception 'Final status invalid: %',v_final_status;
      end if;

      raise exception '__UAT_PASS_ROLLBACK__';
    exception when others then
      if sqlerrm='__UAT_PASS_ROLLBACK__' then
        insert into _sls_breakage_uat_results values('E2E WORKFLOW',rec.rdc,'Admin → SPV → Master','PASS','Create → Approve → Master Review → Final; test data rolled back');
      else
        insert into _sls_breakage_uat_results values('E2E WORKFLOW',rec.rdc,'Admin → SPV → Master','FAIL',sqlerrm);
      end if;
    end;
  end loop;
end $$;

-- 4) Negative test: each Admin must be denied when creating incident for another RDC.
do $$
declare
  rec record;
  v_uid uuid;
  v_create_exists boolean;
begin
  select exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='breakage_incident_create_v45') into v_create_exists;
  if not v_create_exists then
    insert into _sls_breakage_uat_results values('RDC ISOLATION','NATIONAL','ALL ADMIN','FAIL','breakage_incident_create_v45 missing');
    return;
  end if;

  for rec in
    select * from (values
      ('Jakarta','wms.jkt.ops@sls.internal','Semarang'),
      ('Semarang','wms.smg.ops@sls.internal','Surabaya'),
      ('Surabaya','wms.sby.ops@sls.internal','Denpasar'),
      ('Denpasar','wms.dps.ops@sls.internal','Palembang'),
      ('Palembang','wms.plb.ops@sls.internal','Jakarta')
    ) x(rdc,email,wrong_rdc)
  loop
    select id into v_uid from auth.users where lower(email)=lower(rec.email) and deleted_at is null limit 1;
    if v_uid is null then
      insert into _sls_breakage_uat_results values('RDC ISOLATION',rec.rdc,split_part(rec.email,'@',1),'FAIL','Auth user missing');
      continue;
    end if;
    begin
      perform set_config('request.jwt.claim.sub',v_uid::text,true);
      perform set_config('request.jwt.claim.role','authenticated',true);
      perform set_config('request.jwt.claims',jsonb_build_object('sub',v_uid::text,'role','authenticated','email',rec.email)::text,true);
      perform public.breakage_incident_create_v45(jsonb_build_object(
        'incident_type','warehouse','occurrence_date',current_date::text,'item_code','UAT-XRDC','qty_box',1,'uom','BOX',
        'rdc_name',rec.wrong_rdc,'no_ba','UAT/XRDC/'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'),
        'reported_by','UAT SYSTEM','cause','Susunan','cause_detail','Must be denied','warehouse_event','Pecah Dalam Pallet',
        'photo_paths',jsonb_build_array(rec.wrong_rdc||'/uat/dummy.jpg')
      ));
      raise exception '__UNEXPECTED_ALLOWED__';
    exception when others then
      if sqlerrm='__UNEXPECTED_ALLOWED__' then
        insert into _sls_breakage_uat_results values('RDC ISOLATION',rec.rdc,split_part(rec.email,'@',1),'FAIL','Cross-RDC create was allowed');
      else
        insert into _sls_breakage_uat_results values('RDC ISOLATION',rec.rdc,split_part(rec.email,'@',1),'PASS','Cross-RDC create denied: '||sqlerrm);
      end if;
    end;
  end loop;
end $$;

-- Final result. Do not add commands after this SELECT so SQL Editor keeps the matrix visible.
select test_group,rdc,user_id,result,detail
from _sls_breakage_uat_results
order by case test_group when 'RPC PREFLIGHT' then 0 when 'AUTH ID' then 1 when 'ROLE ACCESS' then 2 when 'STORAGE' then 3 when 'E2E WORKFLOW' then 4 else 5 end,
         rdc,user_id;
