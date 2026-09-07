export type Message = {
  id: string
  fromMe: boolean
  text: string
  time: string
}

export type Conversation = {
  id: string
  name: string
  initials: string
  lastMessage: string
  time: string
  unread: number
  online: boolean
  messages: Message[]
}

export const conversations: Conversation[] = [
  {
    id: "1",
    name: "Minh Khôi",
    initials: "MK",
    lastMessage: "Hẹn gặp lại cậu cuối tuần nhé!",
    time: "09:41",
    unread: 2,
    online: true,
    messages: [
      { id: "m1", fromMe: false, text: "Chào cậu, dạo này khỏe không?", time: "09:30" },
      { id: "m2", fromMe: true, text: "Mình ổn, còn cậu thế nào?", time: "09:32" },
      { id: "m3", fromMe: false, text: "Mình cũng tốt. Cuối tuần này rảnh không?", time: "09:38" },
      { id: "m4", fromMe: true, text: "Rảnh chứ, đi cà phê đi!", time: "09:40" },
      { id: "m5", fromMe: false, text: "Hẹn gặp lại cậu cuối tuần nhé!", time: "09:41" },
    ],
  },
  {
    id: "2",
    name: "Thu Hà",
    initials: "TH",
    lastMessage: "Cảm ơn nhiều nha 😊",
    time: "08:15",
    unread: 0,
    online: true,
    messages: [
      { id: "m1", fromMe: false, text: "Bạn gửi mình tài liệu hôm qua được không?", time: "08:10" },
      { id: "m2", fromMe: true, text: "Mình vừa gửi qua email rồi nhé.", time: "08:12" },
      { id: "m3", fromMe: false, text: "Cảm ơn nhiều nha 😊", time: "08:15" },
    ],
  },
  {
    id: "3",
    name: "Nhóm Dự Án",
    initials: "DA",
    lastMessage: "Hùng: Mai họp lúc mấy giờ vậy mọi người?",
    time: "Hôm qua",
    unread: 5,
    online: false,
    messages: [
      { id: "m1", fromMe: false, text: "Mọi người chuẩn bị tài liệu chưa?", time: "20:00" },
      { id: "m2", fromMe: true, text: "Mình xong phần thiết kế rồi.", time: "20:05" },
      { id: "m3", fromMe: false, text: "Hùng: Mai họp lúc mấy giờ vậy mọi người?", time: "20:30" },
    ],
  },
  {
    id: "4",
    name: "Lan Anh",
    initials: "LA",
    lastMessage: " Okela, để mình xem rồi báo lại.",
    time: "Thứ 2",
    unread: 0,
    online: false,
    messages: [
      { id: "m1", fromMe: true, text: "Cậu xem qua bản kế hoạch giúp mình nhé.", time: "14:00" },
      { id: "m2", fromMe: false, text: "Okela, để mình xem rồi báo lại.", time: "14:20" },
    ],
  },
  {
    id: "5",
    name: "Quốc Bảo",
    initials: "QB",
    lastMessage: "Trận bóng tối nay hay quá!",
    time: "Chủ nhật",
    unread: 0,
    online: true,
    messages: [
      { id: "m1", fromMe: false, text: "Cậu xem trận tối qua chưa?", time: "22:00" },
      { id: "m2", fromMe: true, text: "Xem rồi, đỉnh thật!", time: "22:10" },
      { id: "m3", fromMe: false, text: "Trận bóng tối nay hay quá!", time: "22:15" },
    ],
  },
]
