// Netlify event function: runs on every verified form submission on this site.
// Sends checklist downloads to HubSpot as a contact plus a note. Other forms are ignored.
// Needs HUBSPOT_TOKEN (a HubSpot private app token with contacts + notes write) in Netlify env vars;
// without it, this does nothing.
const FORMS = { "unmissable-checklist": { brand: "Paw & Prosper", name: "The Unmissable Checklist" } };
const API = "https://api.hubapi.com";

exports.handler = async (event) => {
  const token = process.env.HUBSPOT_TOKEN;
  const { payload } = JSON.parse(event.body || "{}");
  const form = payload && FORMS[payload.form_name];
  if (!token || !form) return { statusCode: 200, body: "skipped" };

  const d = payload.data || {};
  const email = (d.email || "").trim().toLowerCase();
  if (!email) return { statusCode: 200, body: "no email" };
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const today = new Date().toISOString().slice(0, 10);

  // New contacts get Brand, Lead Status New and Lifecycle Lead. Existing contacts keep their
  // properties untouched (no status overwrites); they only get the note below.
  let id;
  const created = await fetch(`${API}/crm/v3/objects/contacts`, {
    method: "POST", headers,
    body: JSON.stringify({ properties: {
      email, firstname: d.first_name || "", company: d.business || "", website: d.website || "",
      brand: form.brand, hs_lead_status: "NEW", lifecyclestage: "lead",
      referral_source: `Lead magnet: ${form.name} (${today})`,
    } }),
  });
  if (created.ok) {
    id = (await created.json()).id;
  } else if (created.status === 409) {
    const found = await fetch(`${API}/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`, { headers });
    if (found.ok) id = (await found.json()).id;
  } else {
    console.error("HubSpot contact create failed", created.status, await created.text());
  }

  if (id) {
    const note = [
      `Downloaded ${form.name} on ${today}.`,
      `Business: ${d.business || "n/a"}`,
      `Type: ${d.business_type || d.industry || "n/a"}`,
      `Website: ${d.website || "n/a"}`,
      `Landing page: ${d.landing_page || "n/a"}`,
    ].join("<br>");
    const res = await fetch(`${API}/crm/v3/objects/notes`, {
      method: "POST", headers,
      body: JSON.stringify({
        properties: { hs_timestamp: new Date().toISOString(), hs_note_body: note },
        associations: [{ to: { id }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }] }],
      }),
    });
    if (!res.ok) console.error("HubSpot note failed", res.status, await res.text());
  }
  return { statusCode: 200, body: "ok" };
};
