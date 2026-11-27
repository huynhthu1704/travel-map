# Design: Push notifications (switch in Notifications + the push message)

Status: Draft
Requirements: REQ-059, REQ-060
Design tool: Figma — Bee There file, page "📐 Feature designs" (https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ?node-id=27-75)

## Approach
No new page. A **"📲 Push notifications"** bar is added at the top of the existing Notifications panel (bell 🔔 in the
top bar), above the list, on the honey-soft background (`color/bg/brand-soft`). It is only shown when the `pushNotif`
flag is on for the user (default off; Super admin sees it first). It uses a new **Switch** component (Off / On, honey
`color/bg/brand` when on), the existing text styles (Body/Strong, Caption) and spacing tokens. Phone (360 px) first;
on desktop the panel keeps its current width. All texts in VI and EN (`notif.push*` keys).

The push message itself is drawn by the phone or browser; Bee There decides its title, text, icon and what a tap does.
A free Cloudflare Worker sends it (ADR-019).

## Screens
### SCR-1a · Push off (default) — REQ-059
- Bar: title "📲 Thông báo đẩy / Push notifications", line "Nhận thông báo trên thiết bị này kể cả khi đã đóng ứng dụng. /
  Get notifications on this device even when the app is closed.", Switch = Off.
- Tap the switch → the browser asks for permission → allowed: device registered, Switch = On (SCR-1b);
  refused: SCR-1d. While waiting the switch is disabled (loading).
- Error (no network / service down): toast "Không bật được thông báo đẩy, thử lại sau / Couldn't turn on push
  notifications, try again later", Switch stays Off.
- Frame: https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ?node-id=27-75 (SCR-1a)

### SCR-1b · Push on — REQ-059
- Switch = On, line "Đang bật trên thiết bị này. Tắt bất cứ lúc nào. / On for this device. Turn it off any time."
- Tap → device unregistered, back to SCR-1a. Push is per device (phone and laptop are switched separately).
- Frame: https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ?node-id=27-75 (SCR-1b)

### SCR-1c · Browser can't receive push (iPhone not on Home Screen) — REQ-059
- No switch. Title "📲 Thông báo đẩy trên iPhone / Push notifications on iPhone", steps: open beetheremap.com in Safari →
  Share → "Add to Home Screen", open Bee There from the icon and turn it on here. Other browsers without push:
  "Trình duyệt này chưa hỗ trợ thông báo đẩy / This browser does not support push notifications".
- Frame: https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ?node-id=27-75 (SCR-1c)

### SCR-1d · Notifications blocked — REQ-059
- No switch. Title "🔕 Bạn đã chặn thông báo / You blocked notifications", steps: lock icon next to the address →
  Notifications → Allow, then reload the page.
- Frame: https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ?node-id=27-75 (SCR-1d)

### SCR-2 · The push message on a phone — REQ-060
- Icon: Bee There (🐝 app icon). Title = the in-app notification line in the recipient's language, e.g.
  "Lan đã mời bạn tham gia chuyến đi "Kyoto mùa thu"" / "Lan invited you to the trip "Kyoto mùa thu"".
  Text = the hint or the admin message body, e.g. "Nhấn để mở Thông báo và chọn Tham gia hoặc Từ chối."
- Sent for every notification the app already creates: trip invite, invite accepted / declined, follow, like,
  comment, hidden memory, admin message (to everyone, a role or chosen users).
- Tap → opens Bee There with the Notifications panel open. Several messages stack as separate notifications.
- Frame: https://www.figma.com/design/nOxnAVTrWPGf4cBcroW0kQ?node-id=27-75 (SCR-2)

## Notes
- Accessibility: the switch is a real `role="switch"` with `aria-checked` and the bar title as its label.
- Privacy: only the user's own devices are registered; turning push off or deleting the account removes them.
- The in-app list below the bar is unchanged; if the Worker is down, notifications still appear there as today.
