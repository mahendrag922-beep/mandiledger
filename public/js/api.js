const API = "";
async function api(path, options={}){
  const token = localStorage.getItem("token");
  const r = await fetch("/api"+path,{
    ...options,
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer "+token,
      ...(options.headers||{})
    }
  });
  if(r.status===401){ location.href="index.html"; return; }
  return r;
}
function logout(){ localStorage.clear(); location.href="index.html"; }
