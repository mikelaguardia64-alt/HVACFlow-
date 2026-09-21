import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

const CLOSE_API_URL = "https://api.close.com/api/v1";
const CLOSE_NEW_LEAD_STATUS_ID = "stat_gbM2YfnqgsZGSfHwlvDjWkaEomCFf3RvqP5vARH1Fvd";

async function createCloseLead(body: {
  name: string;
  email: string;
  phone?: string;
  company: string;
  source?: string;
}) {
  const apiKey = process.env.CLOSE_API_KEY;
  if (!apiKey) throw new Error("Close CRM is not configured yet");

  const auth = Buffer.from(apiKey + ":").toString("base64");
  const response = await fetch(CLOSE_API_URL + "/lead/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + auth,
    },
    body: JSON.stringify({
      name: body.company,
      status_id: CLOSE_NEW_LEAD_STATUS_ID,
      description: "HVACFlow+ website lead. Source: " + (body.source || "website"),
      contacts: [{
        name: body.name,
        emails: [{email: body.email, type: "office"}],
        ...(body.phone ? {phones: [{phone: body.phone, type: "mobile"}]} : {}),
      }],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error("Close CRM rejected the lead: " + response.status + " " + detail.slice(0, 500));
  }

  return response.json() as Promise<{id?: string; html_url?: string}>;
}

export async function POST(req:Request){
  try {
    const body = await req.json();

    if (!body.name || !body.email || !body.company) {
      return NextResponse.json({error:"Missing required fields"},{status:400});
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return NextResponse.json({error:"Database is not configured yet"},{status:503});
    }

    if (!process.env.CLOSE_API_KEY) {
      return NextResponse.json({error:"CRM integration is not configured yet"},{status:503});
    }

    const db = createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});

    let {data:company} = await db
      .from("companies")
      .select("id")
      .eq("name",body.company)
      .maybeSingle();

    if (!company) {
      const r = await db
        .from("companies")
        .insert({name:body.company,email:body.email,phone:body.phone})
        .select("id")
        .single();

      if (r.error) throw r.error;
      company = r.data;
    }

    const r = await db
      .from("leads")
      .insert({
        company_id:company.id,
        name:body.name,
        email:body.email,
        phone:body.phone,
        source:body.source||"website"
      })
      .select("id")
      .single();

    if (r.error) throw r.error;

    const closeLead = await createCloseLead(body);

    if (!closeLead.id) {
      throw new Error("Close CRM did not return a lead ID");
    }

    const sync = await db
      .from("leads")
      .update({close_lead_id:closeLead.id})
      .eq("id",r.data.id);

    if (sync.error) throw sync.error;

    return NextResponse.json({
      ok:true,
      closeSynced:true,
      closeLeadId:closeLead.id
    });
  } catch(e) {
    return NextResponse.json(
      {error:e instanceof Error ? e.message : "Unable to capture lead"},
      {status:500}
    );
  }
}
