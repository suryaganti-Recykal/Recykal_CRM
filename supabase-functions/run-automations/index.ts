import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "Recykal CRM <resources@marketing.recykal.com>";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const body = await req.json();
    const { type, table, record, old_record } = body;

    if (!table || !record) {
      return new Response(JSON.stringify({ error: "Missing table or record" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const entityType = table === "deals" ? "deal" : table === "contacts" ? "contact" : "company";

    let triggerType = "";
    if (type === "INSERT") triggerType = "created";
    else if (type === "UPDATE") {
      if (table === "deals" && old_record?.stage !== record.stage) triggerType = "stage_change";
      else triggerType = "field_change";
    }

    if (!triggerType) {
      return new Response(JSON.stringify({ skipped: true, reason: "no matching trigger" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const { data: automations } = await supabase
      .from("automations")
      .select("*")
      .eq("entity_type", entityType)
      .eq("trigger_type", triggerType)
      .eq("is_active", true);

    if (!automations || automations.length === 0) {
      return new Response(JSON.stringify({ skipped: true, reason: "no active automations" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const results = [];

    for (const automation of automations) {
      const actionConfig = automation.action_config ?? {};
      let status = "success";
      let result: Record<string, unknown> = {};

      try {
        switch (automation.action_type) {
          case "send_email": {
            if (!RESEND_API_KEY) { status = "failed"; result = { error: "No RESEND_API_KEY" }; break; }
            const templateId = actionConfig.template_id;
            let emailSubject = actionConfig.subject ?? "Notification from Recykal CRM";
            let emailBody = actionConfig.body ?? `<p>An automation was triggered for ${entityType} ${record.name ?? record.title ?? record.id}.</p>`;

            if (templateId) {
              const { data: tpl } = await supabase.from("email_templates").select("*").eq("id", templateId).single();
              if (tpl) {
                emailSubject = tpl.subject ?? emailSubject;
                emailBody = tpl.body_html ?? emailBody;
              }
            }

            const contactName = record.name ?? record.first_name ?? "";
            emailSubject = emailSubject.replace(/\{\{contact\.name\}\}/g, contactName);
            emailBody = emailBody.replace(/\{\{contact\.name\}\}/g, contactName);

            const toAddress = record.email ?? actionConfig.to;
            if (!toAddress) { status = "skipped"; result = { reason: "no email address" }; break; }

            const resendRes = await fetch(RESEND_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
              body: JSON.stringify({ from: FROM_ADDRESS, to: [toAddress], subject: emailSubject, html: emailBody }),
            });
            result = await resendRes.json();
            if (!resendRes.ok) status = "failed";

            await supabase.from("emails").insert({
              direction: "outbound",
              from_address: "resources@marketing.recykal.com",
              to_addresses: [toAddress],
              subject: emailSubject,
              body_html: emailBody,
              status: status === "success" ? "sent" : "bounced",
              sent_at: status === "success" ? new Date().toISOString() : null,
              contact_id: table === "contacts" ? record.id : null,
              deal_id: table === "deals" ? record.id : null,
              company_id: table === "companies" ? record.id : null,
            });
            break;
          }

          case "create_task": {
            const { error } = await supabase.from("tasks").insert({
              title: actionConfig.title ?? `Follow up: ${record.name ?? record.title ?? entityType}`,
              description: actionConfig.description ?? `Auto-created by automation: ${automation.name}`,
              status: "todo",
              priority: actionConfig.priority ?? "medium",
              due_date: new Date(Date.now() + (actionConfig.delay_hours ?? 24) * 3600000).toISOString(),
            });
            if (error) { status = "failed"; result = { error: error.message }; }
            break;
          }

          case "update_field": {
            const field = actionConfig.field;
            const value = actionConfig.value;
            if (field && value !== undefined) {
              const { error } = await supabase.from(table).update({ [field]: value }).eq("id", record.id);
              if (error) { status = "failed"; result = { error: error.message }; }
            } else {
              status = "skipped"; result = { reason: "missing field/value config" };
            }
            break;
          }

          case "notify": {
            const { error } = await supabase.from("notifications").insert({
              user_id: record.owner_id ?? actionConfig.user_id,
              title: actionConfig.title ?? `Automation: ${automation.name}`,
              body: actionConfig.body ?? `${entityType} ${record.name ?? record.title ?? record.id} triggered automation`,
              link: `/${table}/${record.id}`,
              notification_type: "automation",
            });
            if (error) { status = "failed"; result = { error: error.message }; }
            break;
          }

          case "assign_owner": {
            const newOwner = actionConfig.owner_id;
            if (newOwner) {
              const { error } = await supabase.from(table).update({ owner_id: newOwner }).eq("id", record.id);
              if (error) { status = "failed"; result = { error: error.message }; }
            } else {
              status = "skipped"; result = { reason: "no owner_id in config" };
            }
            break;
          }

          default:
            status = "skipped";
            result = { reason: `Unknown action type: ${automation.action_type}` };
        }
      } catch (err) {
        status = "failed";
        result = { error: String(err) };
      }

      await supabase.from("automation_log").insert({
        automation_id: automation.id,
        entity_type: entityType,
        entity_id: record.id,
        status,
        result,
      });

      results.push({ automation: automation.name, status, result });
    }

    return new Response(JSON.stringify({ executed: results.length, results }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
