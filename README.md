# 🍯 Bản đồ du lịch

Web app giúp bạn **đánh dấu nơi đã đặt chân tới**, lưu **ảnh kỉ niệm** ở từng địa điểm, tạo **chuyến đi chung** với bạn bè và **chia sẻ** thành ảnh / video thật xinh lên mạng xã hội.

- Design system (Figma): https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ — trang **🍯 Foundations** (màu, typography, spacing, radius) và **🧩 Components** (Button, Chip, Map Pin, Place Card). Token trong `src/styles/tokens.css` khớp 1–1 với Figma variables.
- Màu chủ đạo: vàng mật ong `#FFC629` · Font: **Lexend** (tiêu đề) + **Be Vietnam Pro** (nội dung) — hiện đại, trẻ trung, hỗ trợ đầy đủ tiếng Việt.

## Tính năng

| | Tính năng | Cần đăng nhập? |
|---|---|---|
| 🗺️ | Bản đồ thế giới, tô vàng quốc gia đã đến, icon 👣 tại nơi đã đặt chân | Xem: không |
| 🔍 | Bấm vào quốc gia để zoom, xem địa điểm nổi tiếng, lọc theo thành phố/vùng | Không |
| 🔎 | Tìm kiếm quốc gia, thành phố, địa điểm bất kỳ (OpenStreetMap) | Không |
| 💛 | Thêm địa điểm vào danh sách *muốn đi* / *đã đến* | Có |
| 🧭 | Chỉ đường: chọn mở **Apple Maps** hoặc **Google Maps** | Không |
| 📸 | Upload ảnh kỉ niệm theo địa điểm (tự nén ảnh, lưu trong Firestore), riêng tư hoặc công khai | Có |
| ✨ | Studio chia sẻ: 1–4 ảnh, 4 mẫu (Polaroid, Bưu thiếp, Cuộn phim, Bento), 3 khung (Story 9:16, 4:5, 1:1), xuất **ảnh PNG** hoặc **video** có hiệu ứng; trên điện thoại mở thẳng bảng chia sẻ | Có |
| 🌍 | Trang *Khám phá*: xem ảnh công khai của người khác, lọc theo quốc gia / thành phố | Không |
| 🧳 | Chuyến đi chung: tạo nhóm, mời bằng link/mã, mọi điểm dừng & ảnh hiện cho cả nhóm, xem trên bản đồ | Có |
| 📱 | Responsive: desktop (panel bên trái), tablet & mobile (bottom sheet + thanh điều hướng dưới) | — |

## Chạy thử

```bash
npm install
npm run dev
```

Không cấu hình gì vẫn chạy được ở **chế độ demo** (đăng nhập giả lập, dữ liệu lưu trong `localStorage`).

## Kết nối Firebase (Google login + lưu trữ thật)

1. Tạo project tại https://console.firebase.google.com → thêm **Web app**.
2. **Authentication** → Sign-in method → bật **Google**. Thêm domain deploy vào *Authorized domains*.
3. Tạo **Firestore Database** (project hiện tại: `asia-southeast1` – Singapore).
4. Copy `.env.example` → `.env.local`, điền các giá trị `VITE_FIREBASE_*` (project `travel-map-e9657` đã có sẵn Web app `travel-map-web`).
5. Deploy rules: dán `firestore.rules` vào Firestore → Rules → Publish, hoặc `npx firebase-tools deploy --only firestore:rules`.

> Ảnh được nén và lưu thẳng trong Firestore (ảnh thu nhỏ trong document kỉ niệm, ảnh đầy đủ ở `memories/{id}/full/{i}`), nên chạy được trên gói **Spark miễn phí** — không cần Firebase Storage/Blaze. Hạn mức miễn phí: 1 GiB dữ liệu (~3.000–5.000 ảnh), 50.000 lượt đọc/ngày.

### Mô hình dữ liệu

```
users/{uid}/places/{placeId}   địa điểm đã đến / muốn đi
memories/{id}                  kỉ niệm (ảnh thu nhỏ, ghi chú, public/private, tripId)
memories/{id}/full/{i}         ảnh độ phân giải đầy đủ
trips/{id}                     chuyến đi (memberIds, inviteCode)
trips/{id}/stops/{id}          điểm dừng + ảnh mà cả nhóm cùng thấy
```

## Deploy

- **GitHub Pages**: workflow `.github/workflows/deploy.yml` tự build khi push lên `main`. Vào *Settings → Pages → Source: GitHub Actions*, thêm các secret `VITE_FIREBASE_*` trong *Settings → Secrets → Actions*.
- **Firebase Hosting**: `npm run build && npx firebase-tools deploy --only hosting`.

## Cấu trúc

```
src/
  AppContext.jsx        state chung, auth, yêu cầu đăng nhập
  lib/store.js          lớp dữ liệu Firebase / demo
  lib/countries.js      GeoJSON quốc gia, tên tiếng Việt, cờ
  data/places.js        địa điểm nổi tiếng gợi ý theo quốc gia
  components/MapView    bản đồ Leaflet + pin
  components/SidePanel  panel thế giới / quốc gia / địa điểm
  components/ShareStudio tạo ảnh & video chia sẻ (canvas + MediaRecorder)
  pages/Pages.jsx       Khám phá, Kỉ niệm, Chuyến đi
  styles/tokens.css     design tokens (đồng bộ Figma)
```

Stack: React 18 · Vite · Leaflet / react-leaflet · Firebase (Auth, Firestore) · OpenStreetMap / CARTO tiles · Nominatim.
