// Netlify event function: runs on every verified form submission on this site.
// Sends checklist downloads and Unmissable Club waitlist sign-ups to HubSpot as a contact plus a note.
// Other forms are ignored.
// Needs HUBSPOT_TOKEN (a HubSpot private app token with contacts + notes write) in Netlify env vars;
// without it, this does nothing.
const FORMS = {
  "unmissable-checklist": { brand: "Paw & Prosper", name: "The Unmissable Checklist", source: "Lead magnet", action: "Downloaded" },
  "unmissable-club-waitlist": { brand: "Paw & Prosper", name: "The Unmissable Club", source: "Waitlist", action: "Joined the founding waitlist for",
    flag: "unmissable_club_waitlist" }, // HubSpot single checkbox; set on new AND existing contacts
};
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
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Denver' }); // YYYY-MM-DD in Mountain Time

  // New contacts get Brand, Lead Status New and Lifecycle Lead. Existing contacts keep their
  // properties untouched (no status overwrites); they only get the note below.
  let id;
  const created = await fetch(`${API}/crm/v3/objects/contacts`, {
    method: "POST", headers,
    body: JSON.stringify({ properties: {
      email, firstname: d.first_name || "", company: d.business || "", website: d.website || "",
      brand: form.brand, hs_lead_status: "NEW", lifecyclestage: "lead",
      referral_source: `${form.source}: ${form.name} (${today})`,
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

  // Waitlist flag goes in its own update, so a missing property never blocks the contact or the note.
  if (id && form.flag) {
    const flagged = await fetch(`${API}/crm/v3/objects/contacts/${id}`, {
      method: "PATCH", headers, body: JSON.stringify({ properties: { [form.flag]: "true" } }),
    });
    if (!flagged.ok) console.error("HubSpot waitlist flag failed", flagged.status, await flagged.text());
  }

  if (id) {
    const note = [
      `${form.action} ${form.name} on ${today}.`,
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
