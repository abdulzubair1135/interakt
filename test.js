async function test() {
  console.log("Registering user...");
  const res = await fetch("http://127.0.0.1:5005/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "adminuser",
      email: "admin@campushub.pro",
      password: "password123"
    })
  });
  const data = await res.json();
  console.log(data);

  if (data.token) {
    console.log("Promoting to admin...");
    const res2 = await fetch("http://127.0.0.1:5005/api/auth/setup-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + data.token
      },
      body: JSON.stringify({ adminSecret: "godmode123" })
    });
    const data2 = await res2.json();
    console.log("Setup Admin Response:", data2);
  }
}
test();
