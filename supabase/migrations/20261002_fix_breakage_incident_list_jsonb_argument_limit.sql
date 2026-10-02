-- Fix incident history RPC after additional fields pushed one jsonb_build_object
-- beyond PostgreSQL's 100-argument function-call limit.
create or replace function public.breakage_incident_list(p_period text, p_rdc text default 'ALL'::text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_role text;
  v_user_rdc text;
  v_username text;
  v_scope text := coalesce(nullif(p_rdc,''),'ALL');
  v_result jsonb;
  v_national boolean;
begin
  perform public.breakage_require_member_v60();

  select role, rdc_name
    into v_role, v_user_rdc
  from public.user_roles
  where user_id = auth.uid()
    and is_active = true;

  if v_role is null then
    raise exception 'Unauthorized';
  end if;

  v_username := public.sls_current_canonical_user_id();
  v_national := v_role = 'master'
                or (v_role = 'rdc_manager' and v_user_rdc is null)
                or v_role = 'management';

  if not v_national then
    v_scope := v_user_rdc;
  end if;

  select coalesce(
    jsonb_agg(
      (
        jsonb_build_object(
          'incident_id', i.id,
          'incident_no', i.incident_no,
          'rdc', i.rdc_name,
          'period', to_char(i.period,'YYYY-MM'),
          'input_date', to_char(i.created_at at time zone 'Asia/Jakarta','YYYY-MM-DD'),
          'input_at', i.created_at,
          'occurrence_date', to_char(i.occurrence_date,'YYYY-MM-DD'),
          'incident_type', i.incident_type,
          'main_category', i.main_category,
          'sub_category', i.sub_category,
          'item_code', i.item_code,
          'ceramic_series', i.ceramic_series,
          'product_kind', i.product_kind,
          'product_type', i.product_type,
          'product_size', i.product_size,
          'qty_box', i.qty_box,
          'uom', i.uom,
          'no_ba', i.no_ba,
          'no_sj', i.no_sj,
          'factory', i.factory,
          'customer', i.customer,
          'transporter', i.transporter,
          'driver_name', i.driver_name,
          'vehicle_no', i.vehicle_no
        )
        ||
        jsonb_build_object(
          'driver_signature_path', i.driver_signature_path,
          'driver_signature_at', i.driver_signature_at,
          'ba_receiver_name', i.ba_receiver_name,
          'ba_witness_name', i.ba_witness_name,
          'cause', i.cause,
          'cause_detail', i.cause_detail,
          'warehouse_event', i.warehouse_event,
          'related_person', i.related_person,
          'reported_by', i.reported_by,
          'photo_paths', i.photo_paths,
          'responsibility', i.responsibility,
          'pic', i.pic,
          'status', i.status,
          'created_by', i.created_by,
          'submitted_at', i.submitted_at,
          'submitted_by', i.submitted_by,
          'spv_reviewed_at', i.spv_reviewed_at,
          'spv_reviewed_by', i.spv_reviewed_by,
          'spv_note', i.spv_note,
          'master_reviewed_at', i.master_reviewed_at,
          'master_reviewed_by', i.master_reviewed_by,
          'master_note', i.master_note,
          'finalized_at', i.finalized_at,
          'finalized_by', i.finalized_by,
          'workflow_version', i.workflow_version,
          'evidence_archived_at', i.evidence_archived_at,
          'evidence_archive_filename', i.evidence_archive_filename
        )
      )
      order by i.created_at desc, i.id desc
    ),
    '[]'::jsonb
  )
  into v_result
  from public.breakage_incident i
  where i.period = (p_period || '-01')::date
    and i.deleted_at is null
    and (v_scope = 'ALL' or i.rdc_name = v_scope)
    and (v_role <> 'operator' or i.created_by = v_username);

  return v_result;
end;
$function$;
