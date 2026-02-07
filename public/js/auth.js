// async function login(){
//   const r = await fetch("/api/auth/login",{
//     method:"POST",
//     headers:{"Content-Type":"application/json"},
//     body:JSON.stringify({email:email.value,password:password.value})
//   });
//   const d = await r.json();
//   if(!r.ok){ err.innerText=d.message; return; }
//   localStorage.setItem("token", d.token);
//   localStorage.setItem("role", d.role);
//   location.href="dashboard.html";
// }
const form = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const err = document.getElementById("err");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  err.innerText = "";

  const r = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.value.trim(),
      password: password.value.trim()
    })
  });

  const d = await r.json();

  if (!r.ok) {
    err.innerText = d.message;
    return;
  }

  // SAME AS OLD CODE
  localStorage.setItem("token", d.token);
  localStorage.setItem("role", d.role);

  location.href = "dashboard.html";
});

