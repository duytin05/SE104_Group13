document.querySelector("form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const username = document.querySelector("input[type='text']").value;
  const password = document.querySelector("input[type='password']").value;

  try {
    const response = await fetch("http://localhost:3001/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ Đăng nhập thành công → lưu token & chuyển trang
      localStorage.setItem("token", data.token);
      alert("Đăng nhập thành công!");
      window.location.href = "dashboard.html";
    } else {
      // ❌ Sai tài khoản hoặc mật khẩu
      alert(data.message || "Đăng nhập thất bại!");
    }
  } catch (err) {
    alert("Lỗi kết nối server!");
    console.error(err);
  }
});
