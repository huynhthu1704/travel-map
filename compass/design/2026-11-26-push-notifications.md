# Design: Push notifications (switch in Notifications + the push message)

Status: Draft
Requirements: REQ-059, REQ-060
Design tool: Figma — Bee There file, page "📐 Feature designs" (https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ?node-id=27-75)

## Approach
No new page and no change to the Notifications panel (🔔), which stays as it is. The push setting lives in the user's
**settings**: a new item **"🔔 Cài đặt thông báo / Notification settings"** in the ⋯ menu of the user's own Profile
(between Privacy and Download my data) opens a small **Notification settings** dialog, and the same section is shown on
the Account & data page (`#/account`), next to Privacy. Both are only shown when the `pushNotif` flag is on for the
user (default off; Super admin sees it first). The dialog has one row, **"📲 Thông báo đẩy / Push notifications"**,
with a new **Switch** component (Off / On, honey `color/bg/brand` when on) and one short line below it. Existing text
styles (Heading/H3, Body/Strong, Caption) and spacing tokens. Phone (360 px) first. All texts in VI and EN.

The push message is drawn by the phone or browser and shows **exactly the same text as the notification in the app**
(same words, in the recipient's language) — no separate push title or extra text. A free Cloudflare Worker sends it
(ADR-019).

## Screens
### SCR-1 · Profile ⋯ menu — REQ-059
- My own Profile → ⋯ → new item "🔔 Cài đặt thông báo / Notification settings" → opens SCR-2.
- Frame: https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ?node-id=27-75 (SCR-1)

### SCR-2a · Notification settings, push off (default) — REQ-059
- Row "📲 Thông báo đẩy / Push notifications" + Switch Off; line "Nhận thông báo kể cả khi đã đóng ứng dụng. / Get
  notifications even when the app is closed."
- Tap the switch → the browser asks for permission → allowed: device registered, Switch On (SCR-2b); refused: SCR-2c.
  While waiting the switch is disabled. Error: toast "Không bật được thông báo đẩy, thử lại sau / Couldn't turn on push
  notifications, try again later", Switch stays Off.
- Frame: https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ?node-id=27-75 (SCR-2a)

### SCR-2b · Push on — REQ-059
- Same row, Switch On. Tap → device unregistered, back to SCR-2a. Push is per device.
- Frame: https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ?node-id=27-75 (SCR-2b)

### SCR-2c · Push can't be turned on here — REQ-059
- Same row and title, Switch disabled (greyed), the line below says why, in one sentence:
  iPhone not on the Home Screen → "Safari → Chia sẻ → Thêm vào MH chính, rồi mở Bee There từ màn hình chính. /
  Safari → Share → Add to Home Screen, then open Bee There from the Home Screen."; notifications blocked → "Cho phép
  Thông báo ở biểu tượng ổ khoá cạnh địa chỉ trang. / Allow Notifications from the lock icon next to the address.";
  other browsers → "Trình duyệt này chưa hỗ trợ thông báo đẩy. / This browser does not support push notifications."
- Frame: https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ?node-id=27-75 (SCR-2c)

### SCR-3 · The push message on a phone — REQ-060
- Bee There icon + the in-app notification text, unchanged (e.g. "Lan đã mời bạn tham gia chuyến đi "Kyoto mùa thu""
  / "Lan invited you to the trip "Kyoto mùa thu""; an admin message shows its title and text as in the app).
- Sent for every notification the app already creates: trip invite, invite accepted / declined, follow, like,
  comment, hidden memory, admin message (to everyone, a role or chosen users).
- Tap → opens Bee There with the Notifications panel open.
- Frame: https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ?node-id=27-75 (SCR-3)

## Notes
- Accessibility: the switch is a real `role="switch"` with `aria-checked`, labelled by the row title.
- Privacy: only the user's own devices are registered; turning push off or deleting the account removes them.
- If the Worker is down, notifications still appear in the app as today.
- Changed 2026-11-27 at the Product Owner's request: the setting moved from the Notifications panel into settings, and
  the push message shows the same content as in the app (no separate title).
