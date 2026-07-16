(async function () {
  let data;
  try {
    const localPreview = localStorage.getItem("namdo187-site-preview");
    if (localPreview) data = JSON.parse(localPreview);
    else {
      const response = await fetch("site-data.json?t=" + Date.now(), { cache: "no-store" });
      if (response.ok) data = await response.json();
    }
  } catch (_) {}
  if (!data) {
    data = {
      popups: [
        { id: "welcome", enabled: true, image: "images/ai-popup-cottage.jpg", title: "자연 속 독채에서 쉬어가세요", message: "지리산과 섬진강을 곁에 둔 남도187입니다.", buttonEnabled: true, buttonText: "예약하기", link: "https://booking.ddnayo.com/?accommodationId=15392" },
        { id: "bbq", enabled: true, image: "images/ai-popup-bbq.jpg", title: "프라이빗 바비큐", message: "따뜻한 조명 아래 우리만의 저녁을 즐겨보세요.", buttonEnabled: true, buttonText: "공간 보기", link: "#space" }
      ]
    };
  }
  try {
    const imagePath = (item) => typeof item === "string" ? item : item?.image;
    const escapeHtml = (value) => String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));

    const host = document.querySelector("#popupHost");
    if (host) {
      host.innerHTML = "";
      (data.popups || []).filter((popup) => popup.enabled !== false).forEach((popup) => {
        const hiddenDate = localStorage.getItem(`namdo187-hide-${popup.id}`);
        if (hiddenDate === new Date().toDateString()) return;
        const card = document.createElement("article");
        card.className = `home-popup ${popup.size || "medium"}`;
        card.innerHTML = `<button class="home-popup-close" aria-label="팝업 닫기">×</button><img src="${escapeHtml(popup.image)}" alt=""><div class="home-popup-body"><strong>${escapeHtml(popup.title)}</strong><p>${escapeHtml(popup.message)}</p>${popup.buttonEnabled ? `<a href="${escapeHtml(popup.link)}">${escapeHtml(popup.buttonText)}</a>` : ""}</div><div class="home-popup-foot"><button class="hide-today">오늘 하루 보지 않기</button><button class="close-text">닫기</button></div>`;
        card.querySelector(".home-popup-close").onclick = () => card.remove();
        card.querySelector(".close-text").onclick = () => card.remove();
        card.querySelector(".hide-today").onclick = () => {
          localStorage.setItem(`namdo187-hide-${popup.id}`, new Date().toDateString());
          card.remove();
        };
        host.appendChild(card);
      });
    }

    const rooms = document.querySelectorAll(".grid img");
    if (data.rooms?.length) rooms.forEach((img, index) => {
      const path = imagePath(data.rooms[index]);
      if (path) {
        img.src = path;
        if (typeof data.rooms[index] === "object") img.alt = data.rooms[index].alt || img.alt;
      }
    });

    const facilityImages = document.querySelectorAll(".mini img");
    if (data.facilities?.length) {
      facilityImages.forEach((img, index) => {
        const path = imagePath(data.facilities[index]);
        if (path) img.src = path;
      });
      const spaceImage = document.querySelector(".space > img");
      const path = imagePath(data.facilities[3]);
      if (spaceImage && path) spaceImage.src = path;
    }
  } catch (error) {
    console.warn("홈페이지 설정을 불러오지 못했습니다.", error);
  }
})();
