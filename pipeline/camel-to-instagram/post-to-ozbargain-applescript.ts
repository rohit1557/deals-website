import { execSync } from "child_process";
import type { ScoredDeal } from "./filter-deals";

const OZB_FORM_URL = "https://www.ozbargain.com.au/node/add/ozbdeal";

const CATEGORY_MAP: Record<string, string> = {
  Tech:      "13", // Electrical & Electronics
  Gaming:    "32155",
  Fashion:   "8",  // Fashion & Apparel
  Beauty:    "18", // Health & Beauty
  Home:      "19", // Home & Garden
  Kitchen:   "19", // Home & Garden
  Fragrance: "18", // Health & Beauty
  Travel:    "0",
  Other:     "0",
};

function esc(s: string): string {
  // Escape for embedding in AppleScript double-quoted string → JavaScript string
  // Newlines must become \n (JS escape), real quotes must be escaped
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

function cleanAmazonUrl(url: string): string {
  // OzBargain blocks affiliate tags — strip the tag param before submitting
  try {
    const u = new URL(url);
    u.searchParams.delete("tag");
    return u.toString();
  } catch {
    return url.replace(/[?&]tag=[^&]+/, "").replace(/\?$/, "");
  }
}

function formatAUD(n: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency", currency: "AUD",
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(n);
}

function buildDescription(deal: ScoredDeal): string {
  const lines: string[] = [];
  if (deal.originalPrice && deal.dealPrice) {
    const savings = deal.originalPrice - deal.dealPrice;
    lines.push(`Was ${formatAUD(deal.originalPrice)}, now ${formatAUD(deal.dealPrice)} — saving ${formatAUD(savings)} (${deal.dropPct}% off).`);
  } else if (deal.dealPrice) {
    lines.push(`Price: ${formatAUD(deal.dealPrice)}`);
  }
  lines.push("");
  lines.push("Fulfilled by Amazon AU. Free delivery for Prime members.");
  lines.push("");
  lines.push("More daily Amazon AU deals at dealdrop.au and @dealdrop.au on Instagram.");
  return lines.join("\n");
}

function dealDropUrl(deal: ScoredDeal): string {
  const asinM = deal.amazonUrl.match(/\/dp\/([A-Z0-9]{10})/);
  return asinM ? `https://dealdrop.au/deals/${asinM[1]}` : cleanAmazonUrl(deal.amazonUrl);
}

function runAppleScript(script: string): string {
  try {
    return execSync(`osascript << 'APPLESCRIPT_EOF'\n${script}\nAPPLESCRIPT_EOF`, {
      encoding: "utf8",
      timeout: 60_000,
    }).trim();
  } catch (e: any) {
    throw new Error(`AppleScript error: ${e.stderr ?? e.message}`);
  }
}

export async function postToOzBargainAppleScript(deal: ScoredDeal): Promise<string | null> {
  if (process.platform !== "darwin") {
    console.warn("[ozbargain-as] AppleScript only works on macOS — skipping");
    return null;
  }

  const title = deal.title.length > 120
    ? deal.title.slice(0, 117) + "..."
    : deal.title;
  const titleWithPrice = deal.dealPrice
    ? `${title} - ${formatAUD(deal.dealPrice)}${deal.dropPct ? ` (${deal.dropPct}% off)` : ""}`
    : title;
  const safeTitle = esc(titleWithPrice.slice(0, 120));
  const safeUrl   = esc(dealDropUrl(deal));   // dealdrop.au deal page — affiliate revenue on click-through
  const safeDesc  = esc(buildDescription(deal));
  const catId     = CATEGORY_MAP[deal.category] ?? "0";

  console.log(`[ozbargain-as] Posting via AppleScript: ${titleWithPrice.slice(0, 70)}`);

  // Single AppleScript call: navigate → wait → fill → submit → return URL
  const fullScript = `
tell application "Google Chrome"
  activate
  open location "${OZB_FORM_URL}"
  set waited to 0
  repeat
    delay 2
    set waited to waited + 2
    if title of active tab of front window contains "Submit" then exit repeat
    if waited >= 20 then return "ERROR:timeout:" & title of active tab of front window
  end repeat
  delay 1
  execute active tab of front window javascript "var e=document.getElementById('edit-ozb_url');e.value=\\"${safeUrl}\\";e.dispatchEvent(new Event('change',{bubbles:true}))"
  execute active tab of front window javascript "var e=document.getElementById('edit-title');e.value=\\"${safeTitle}\\";e.dispatchEvent(new Event('input',{bubbles:true}))"
  execute active tab of front window javascript "var e=document.getElementById('edit-body');e.value=\\"${safeDesc}\\";e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))"
  ${catId !== "0" ? `execute active tab of front window javascript "var s=document.getElementById('edit-taxonomy-3');if(s)s.value='${catId}'"` : ""}
  delay 2
  execute active tab of front window javascript "var btn=document.querySelector('input.btn-primary[name=op]');if(btn)btn.click();"
  delay 10
  return URL of active tab of front window
end tell`;

  const result = runAppleScript(fullScript);
  console.log(`[ozbargain-as] Result: ${result}`);

  if (result.startsWith("ERROR:")) {
    const msg = result.replace("ERROR:", "");
    if (msg.includes("unexpected_title")) throw new Error(`Not logged in or wrong page: ${msg}`);
    throw new Error(msg);
  }

  const finalUrl = result;

  if (finalUrl.includes("/node/add/") || finalUrl.includes("/user/login")) {
    // Still on form or redirected to login — check for visible errors
    const errScript = `
tell application "Google Chrome"
  set t to active tab of front window
  return execute t javascript "var e=document.querySelector('.messages.error,.alert-danger,.error');e?e.innerText.trim().slice(0,200):'no error'"
end tell`;
    const err = runAppleScript(errScript);
    throw new Error(`Form submission failed — ${err}`);
  }

  return finalUrl;
}
