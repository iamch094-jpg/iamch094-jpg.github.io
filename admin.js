const ADMIN_ID = "iamch94";
const ADMIN_PASSWORD = "04560123";
const TOKEN_KEY = "namdo187-github-token";
const REPO_KEY = "namdo187-github-repository";
const PREVIEW_KEY = "namdo187-site-preview";
let repository = JSON.parse(localStorage.getItem(REPO_KEY) || "null");
const AI_IMAGES = [
  "images/ai-popup-cottage.jpg",
  "images/ai-popup-bbq.jpg",
  "images/ai-popup-illustration.jpg"
];
const DEFAULT_DATA = {
  popups: [
    { id: "welcome", enabled: true, size: "medium", image: AI_IMAGES[0], title: "자연 속 독채에서 쉬어가세요", message: "지리산과 섬진강을 곁에 둔 남도187입니다.", buttonEnabled: true, buttonText: "예약하기", link: "https://booking.ddnayo.com/?accommodationId=15392" },
    { id: "bbq", enabled: true, size: "medium", image: AI_IMAGES[1], title: "프라이빗 바비큐", message: "따뜻한 조명 아래 우리만의 저녁을 즐겨보세요.", buttonEnabled: true, buttonText: "공간 보기", link: "#space" }
  ],
  rooms: [
    { id: "room-1", image: "images/1784091966416EDcisw9vhcFYEVqOu87.jpg", alt: "남도187 객실" },
    { id: "room-2", image: "images/1784091977396NwtsdalVJvIAydZhX8y.jpg", alt: "남도187 객실" },
    { id: "room-3", image: "images/1784091977602bdfB5RY42FQVFJ9qvtE.jpg", alt: "남도187 객실" },
    { id: "room-4", image: "images/17840919794480qQ7K8nSnK1GvT6TC2F.jpg", alt: "남도187 객실" },
    { id: "room-5", image: "images/1784091979524JDp4YwHPaCRFed4fC9D.jpg", alt: "남도187 객실" },
    { id: "room-6", image: "images/1784091980334wqnUEhGrhEyhb5Jciz8.jpg", alt: "남도187 객실" },
    { id: "room-7", image: "images/1784091980471cGPNAbERw4Rb2mqcfBU.jpg", alt: "남도187 객실" },
    { id: "room-8", image: "images/1784091981133j2K8mLqkpd3343VXgXd.jpg", alt: "남도187 객실" }
  ],
  facilities: [
    { id: "facility-1", image: "images/exterior-13.jpg", alt: "남도187 부대시설" },
    { id: "facility-2", image: "images/exterior-16.jpg", alt: "남도187 부대시설" },
    { id: "facility-3", image: "images/exterior-17.jpg", alt: "남도187 부대시설" },
    { id: "facility-4", image: "images/exterior-19.jpg", alt: "남도187 야외 공간" }
  ]
};
let data = structuredClone(DEFAULT_DATA);
let dirty = false;
const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
const previewSrc = (item) => item._preview || item.image;
const status = (text) => $("githubStatus").textContent = text;

function markDirty() {
  dirty = true;
  document.body.classList.add("dirty");
  $("githubSave").textContent = "변경사항 GitHub에 저장";
}
function clearDirty() {
  dirty = false;
  document.body.classList.remove("dirty");
  $("githubSave").textContent = "GitHub에 저장하고 반영";
}
function normalize(raw) {
  const result = structuredClone(DEFAULT_DATA);
  if (Array.isArray(raw?.popups)) result.popups = raw.popups.map((popup) => ({ size: "medium", ...popup }));
  else if (raw?.popup) result.popups = [{ ...DEFAULT_DATA.popups[0], title: raw.popup.title, message: raw.popup.content, enabled: raw.popup.enabled !== false }];
  for (const type of ["rooms", "facilities"]) {
    if (Array.isArray(raw?.[type])) result[type] = raw[type].map((item, index) =>
      typeof item === "string" ? { id: `${type}-${index + 1}`, image: item, alt: type === "rooms" ? "남도187 객실" : "남도187 부대시설" } : item
    );
  }
  return result;
}
function headers() {
  const token = $("githubToken").value.trim() || localStorage.getItem(TOKEN_KEY);
  if (!token) throw new Error("GitHub 토큰을 입력해 주세요.");
  return { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" };
}
function repositoryLabel() {
  return repository ? `${repository.owner}/${repository.repo} · ${repository.branch}` : "저장소 자동 검색 전";
}
async function detectRepository() {
  const token = $("githubToken").value.trim() || localStorage.getItem(TOKEN_KEY);
  if (!token) throw new Error("GitHub 토큰을 입력해 주세요.");
  status("토큰으로 접근 가능한 저장소를 확인하고 있습니다...");
  const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member", {
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" }
  });
  const repos = await response.json();
  if (!response.ok) throw new Error(response.status === 401 ? "토큰이 올바르지 않습니다." : "토큰으로 저장소 목록을 불러오지 못했습니다.");
  const writable = repos.filter((repo) => repo.permissions?.push);
  writable.sort((a, b) => {
    const score = (repo) => repo.name.toLowerCase() === "namdo187" ? 0 : /namdo|187|남도/i.test(repo.name) ? 1 : 2;
    return score(a) - score(b);
  });
  for (const repo of writable) {
    const check = await fetch(`https://api.github.com/repos/${repo.full_name}/contents/site-data.json?ref=${encodeURIComponent(repo.default_branch)}`, {
      headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28" }
    });
    if (check.ok) {
      repository = { owner: repo.owner.login, repo: repo.name, branch: repo.default_branch };
      localStorage.setItem(REPO_KEY, JSON.stringify(repository));
      status(`저장소 연결 완료: ${repositoryLabel()}`);
      return repository;
    }
  }
  throw new Error("토큰에 연결된 저장소에서 남도187 홈페이지 파일을 찾지 못했습니다. 저장소에 ZIP 내용을 먼저 올리고 토큰 권한에 해당 저장소를 선택해 주세요.");
}
async function github(path, options = {}) {
  if (!repository) await detectRepository();
  const query = (options.method || "GET") === "GET" ? `?ref=${encodeURIComponent(repository.branch)}` : "";
  const response = await fetch(`https://api.github.com/repos/${repository.owner}/${repository.repo}/contents/${path}${query}`, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `GitHub 요청 실패 (${response.status})`);
  return result;
}
function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}
const textToBase64 = (text) => bytesToBase64(new TextEncoder().encode(text));
const base64ToText = (base64) => new TextDecoder().decode(Uint8Array.from(atob(base64.replace(/\n/g, "")), (char) => char.charCodeAt(0)));
async function resizeImage(file, maxWidth = 1400, maxHeight = 1000, quality = 0.88) {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("이미지 변환 실패")), "image/jpeg", quality));
}
async function prepareImage(file, width, height) {
  const blob = await resizeImage(file, width, height);
  return { blob, preview: URL.createObjectURL(blob), name: file.name };
}
async function uploadImage(item, type) {
  if (!item._upload) return;
  const path = `images/uploads/${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  await github(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Upload website image from admin page", content: bytesToBase64(new Uint8Array(await item._upload.arrayBuffer())), branch: repository.branch })
  });
  item.image = path;
  delete item._upload; delete item._preview; delete item._uploadName;
}
function cleanItem(item) {
  return Object.fromEntries(Object.entries(item).filter(([key]) => !key.startsWith("_")));
}
function cleanData() {
  return { popups: data.popups.map(cleanItem), rooms: data.rooms.map(cleanItem), facilities: data.facilities.map(cleanItem) };
}
function move(list, index, direction, callback) {
  const next = index + direction;
  if (next < 0 || next >= list.length) return;
  [list[index], list[next]] = [list[next], list[index]];
  callback();
  markDirty();
}

function renderPopups() {
  const editors = $("editors");
  editors.innerHTML = "";
  data.popups.forEach((popup, index) => {
    const card = document.createElement("section");
    card.className = "card";
    card.innerHTML = `<div class="card-head"><strong>${index + 1}번째 팝업</strong><div class="order"><button class="mini up">↑ 위로</button><button class="mini down">↓ 아래로</button><button class="mini duplicate">복제</button><button class="mini danger remove">삭제</button></div></div>
      <div class="fields"><div><div class="image-preview"><img src="${esc(previewSrc(popup))}" alt=""></div><label class="upload-button">내 사진 직접 첨부<input class="popup-upload" type="file" accept="image/*"></label><div class="field"><label>AI 사진 선택</label><div class="ai-options">${AI_IMAGES.map((src) => `<button type="button" data-image="${src}" class="${popup.image === src ? "selected" : ""}"><img src="${src}" alt=""></button>`).join("")}</div></div></div>
      <div><div class="field"><label>팝업 제목</label><input type="text" data-key="title" value="${esc(popup.title)}"></div><div class="field"><label>안내 문구</label><textarea data-key="message">${esc(popup.message)}</textarea></div></div>
      <div><div class="field"><label>팝업 크기</label><select data-key="size"><option value="large" ${popup.size === "large" ? "selected" : ""}>큰 팝업</option><option value="medium" ${(!popup.size || popup.size === "medium") ? "selected" : ""}>중간 팝업</option><option value="small" ${popup.size === "small" ? "selected" : ""}>작은 팝업</option></select></div><div class="checks"><label><input type="checkbox" data-key="enabled" ${popup.enabled ? "checked" : ""}> 팝업 노출</label><label><input type="checkbox" data-key="buttonEnabled" ${popup.buttonEnabled ? "checked" : ""}> 버튼 노출</label></div><div class="field"><label>버튼 문구</label><input type="text" data-key="buttonText" value="${esc(popup.buttonText)}"></div><div class="field"><label>연결 주소</label><input type="text" data-key="link" value="${esc(popup.link)}"></div></div></div>`;
    card.querySelectorAll("[data-key]").forEach((input) => input.addEventListener("input", () => {
      popup[input.dataset.key] = input.type === "checkbox" ? input.checked : input.value;
      markDirty(); renderPreview();
    }));
    card.querySelectorAll(".ai-options button").forEach((button) => button.onclick = () => {
      popup.image = button.dataset.image; delete popup._upload; delete popup._preview;
      card.querySelector(".image-preview img").src = popup.image;
      card.querySelectorAll(".ai-options button").forEach((item) => item.classList.toggle("selected", item === button));
      markDirty(); renderPreview();
    });
    card.querySelector(".popup-upload").onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        status("팝업 사진을 최적화하고 있습니다...");
        const prepared = await prepareImage(file, 1400, 1000);
        popup._upload = prepared.blob; popup._preview = prepared.preview; popup._uploadName = prepared.name;
        card.querySelector(".image-preview img").src = prepared.preview;
        markDirty(); renderPreview(); status("사진이 준비되었습니다. GitHub 저장을 눌러주세요.");
      } catch (error) { status(`사진 처리 실패: ${error.message}`); }
    };
    card.querySelector(".up").onclick = () => move(data.popups, index, -1, renderPopups);
    card.querySelector(".down").onclick = () => move(data.popups, index, 1, renderPopups);
    card.querySelector(".duplicate").onclick = () => { data.popups.splice(index + 1, 0, { ...popup, id: `popup-${Date.now()}` }); markDirty(); renderPopups(); };
    card.querySelector(".remove").onclick = () => { if (confirm("이 팝업을 삭제할까요?")) { data.popups.splice(index, 1); markDirty(); renderPopups(); } };
    editors.appendChild(card);
  });
  $("popupCount").textContent = `현재 ${data.popups.length}개`;
  renderPreview();
}
function renderMedia(type, containerId) {
  const container = $(containerId);
  container.innerHTML = "";
  data[type].forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "media-item";
    card.innerHTML = `<img src="${esc(previewSrc(item))}" alt=""><input type="text" value="${esc(item.alt)}" placeholder="사진 설명"><div class="media-actions"><button class="move-up">↑ 위로</button><button class="move-down">↓ 아래로</button><button class="remove-media">삭제</button></div>`;
    card.querySelector("input").oninput = (event) => { item.alt = event.target.value; markDirty(); };
    card.querySelector(".move-up").onclick = () => move(data[type], index, -1, renderMediaLists);
    card.querySelector(".move-down").onclick = () => move(data[type], index, 1, renderMediaLists);
    card.querySelector(".remove-media").onclick = () => { if (confirm("이 사진을 삭제할까요?")) { data[type].splice(index, 1); markDirty(); renderMediaLists(); } };
    container.appendChild(card);
  });
}
function renderMediaLists() {
  renderMedia("rooms", "roomMediaList");
  renderMedia("facilities", "facilityMediaList");
}
async function addMedia(files, type) {
  status("첨부한 사진을 최적화하고 있습니다...");
  for (const file of files) {
    const prepared = await prepareImage(file, type === "rooms" ? 1600 : 1400, 1100);
    data[type].push({ id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, image: "", alt: file.name.replace(/\.[^.]+$/, ""), _upload: prepared.blob, _preview: prepared.preview });
  }
  markDirty(); renderMediaLists(); status("사진이 준비되었습니다. GitHub 저장을 눌러주세요.");
}
function renderPreview() {
  const row = $("previewRow");
  row.innerHTML = "";
  data.popups.filter((popup) => popup.enabled).forEach((popup) => {
    const item = document.createElement("article");
    item.className = `banner ${popup.size || "medium"}`;
    item.innerHTML = `<img src="${esc(previewSrc(popup))}" alt=""><div class="banner-body"><strong>${esc(popup.title)}</strong><p>${esc(popup.message)}</p>${popup.buttonEnabled ? `<span>${esc(popup.buttonText)}</span>` : ""}</div><div class="banner-foot">오늘 하루 보지 않기 · 닫기</div>`;
    row.appendChild(item);
  });
  if (!row.children.length) row.innerHTML = "<div style='background:#fff;padding:20px'>노출 중인 팝업이 없습니다.</div>";
}
function renderAll() { renderPopups(); renderMediaLists(); }
async function loadRemote() {
  const file = await github("site-data.json");
  data = normalize(JSON.parse(base64ToText(file.content)));
  renderAll(); clearDirty(); status("GitHub의 최신 홈페이지 정보를 불러왔습니다.");
}
async function saveText(path, text) {
  let sha;
  try { sha = (await github(path)).sha; } catch (_) {}
  const body = { message: "Update Namdo 187 website from admin page", content: textToBase64(text), branch: repository.branch };
  if (sha) body.sha = sha;
  await github(path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
function localSave() {
  localStorage.setItem(PREVIEW_KEY, JSON.stringify(cleanData()));
  status("현재 브라우저의 홈페이지 미리보기에 저장했습니다.");
}
async function githubSave() {
  const button = $("githubSave");
  button.disabled = true; button.textContent = "사진과 설정 저장 중...";
  try {
    const token = $("githubToken").value.trim();
    if (token) localStorage.setItem(TOKEN_KEY, token);
    status("사진을 GitHub에 업로드하고 있습니다...");
    for (const popup of data.popups) await uploadImage(popup, "popup");
    for (const room of data.rooms) await uploadImage(room, "room");
    for (const facility of data.facilities) await uploadImage(facility, "facility");
    await saveText("site-data.json", JSON.stringify(cleanData(), null, 2));
    localStorage.removeItem(PREVIEW_KEY); clearDirty(); renderAll();
    status("저장 완료! GitHub Pages 배포 후 홈페이지에 반영됩니다.");
  } catch (error) { status(`저장 실패: ${error.message}`); }
  finally { button.disabled = false; if (dirty) button.textContent = "변경사항 GitHub에 저장"; }
}

$("loginForm").onsubmit = (event) => {
  event.preventDefault();
  if ($("loginId").value === ADMIN_ID && $("loginPassword").value === ADMIN_PASSWORD) {
    $("loginView").classList.add("hidden"); $("adminView").classList.remove("hidden");
  } else $("loginError").textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
};
$("logout").onclick = () => location.reload();
$("githubToken").value = localStorage.getItem(TOKEN_KEY) || "";
$("rememberToken").onclick = () => {
  const token = $("githubToken").value.trim();
  if (!token) return status("GitHub 토큰을 입력해 주세요.");
  localStorage.setItem(TOKEN_KEY, token);
  detectRepository().then(loadRemote).catch((error) => status(`연결 확인 실패: ${error.message}`));
};
$("toggleToken").onclick = () => {
  $("githubToken").type = $("githubToken").type === "password" ? "text" : "password";
  $("toggleToken").textContent = $("githubToken").type === "password" ? "보기" : "숨기기";
};
$("reloadRemote").onclick = () => detectRepository().then(loadRemote).catch((error) => status(`불러오기 실패: ${error.message}`));
$("addPopup").onclick = () => {
  data.popups.push({ id: `popup-${Date.now()}`, enabled: true, size: "medium", image: AI_IMAGES[2], title: "새로운 소식", message: "남도187의 새로운 소식을 입력하세요.", buttonEnabled: true, buttonText: "자세히 보기", link: "#guide" });
  markDirty(); renderPopups();
  requestAnimationFrame(() => $("editors").lastElementChild?.scrollIntoView({ behavior: "smooth", block: "center" }));
};
$("roomUpload").onchange = (event) => { addMedia([...event.target.files], "rooms"); event.target.value = ""; };
$("facilityUpload").onchange = (event) => { addMedia([...event.target.files], "facilities"); event.target.value = ""; };
$("localSave").onclick = localSave;
$("githubSave").onclick = githubSave;
window.addEventListener("beforeunload", (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });

renderAll();
fetch("site-data.json?t=" + Date.now(), { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((raw) => { if (raw) { data = normalize(raw); renderAll(); } }).catch(() => {});
if ($("githubToken").value && repository) {
  status(`저장소: ${repositoryLabel()}`);
  loadRemote().catch(() => {});
}
