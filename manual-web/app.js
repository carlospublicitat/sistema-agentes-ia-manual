document.addEventListener("DOMContentLoaded", () => {

  const sidebar = document.getElementById("sidebar");
  const btnIndex = document.getElementById("btnIndex");
  const btnHide = document.getElementById("btnHide");

  btnIndex.onclick = () => {
    sidebar.classList.toggle("hidden");
  };

  btnHide.onclick = () => {
    sidebar.classList.add("hidden");
  };

  document.querySelectorAll(".copy").forEach(btn => {
    btn.onclick = () => {
      const code = btn.previousElementSibling.innerText;
      navigator.clipboard.writeText(code);
      btn.innerText = "Copiado ✓";
      setTimeout(() => btn.innerText = "Copiar", 1500);
    };
  });

});
