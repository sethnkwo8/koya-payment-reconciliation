// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

function parseAmount(amount) {
  if (typeof amount === "number") return amount;
  return Number(String(amount).replace(/,/g, ""));
}

const latestByTxn = {};

for (const line of fs.readFileSync("payments.jsonl", "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed) continue;

  let event;
  try {
    event = JSON.parse(trimmed);
  } catch {
    continue;
  }

  const txnId = event.txn_id;
  if (!txnId) continue;

  const ts = event.ts ?? "";
  const prev = latestByTxn[txnId];
  if (!prev || ts > (prev.ts ?? "")) {
    latestByTxn[txnId] = event;
  }
}

let total = 0;
let count = 0;
for (const event of Object.values(latestByTxn)) {
  if (event.status === "success") {
    total += parseAmount(event.amount);
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}