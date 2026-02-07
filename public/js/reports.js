async function daily(){ outp.textContent=JSON.stringify(await (await api("/reports/daily")).json(),null,2); }
async function out(){ outp.textContent=JSON.stringify(await (await api("/reports/outstanding")).json(),null,2); }
async function profit(){ outp.textContent=JSON.stringify(await (await api("/reports/profit")).json(),null,2); }
