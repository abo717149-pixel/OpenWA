import { create } from '@open-wa/wa-automate';

create({
  sessionId: "ANTI_DELETE_BOT",
  authTimeout: 0,
  blockCrashLogs: true,
  disableSpamCheck: true,
  hostNotificationLang: 'ar',
  logConsole: false,
}).then(client => start(client));

function start(client) {
  console.log('✅ تم تشغيل البوت بنجاح! جاري مراقبة الرسائل لإنشاء الـ QR Code...');

  let myNumber;
  client.getMe().then(me => {
    myNumber = me.id;
  });

  // 1. مراقبة رسائل العرض لمرة واحدة (View Once)
  client.onMessage(async (message) => {
    if (message.isViewOnce) {
      const time = new Date(message.timestamp * 1000).toLocaleString('ar-EG');
      const details = `⚠️ *تنبيه: رسالة عرض لمرة واحدة* ⚠️\n\n` +
                      `👤 *المرسل:* ${message.sender.pushname || 'غير معروف'}\n` +
                      `📞 *الرقم:* ${message.from.split('@')[0]}\n` +
                      (message.isGroupMsg ? `👥 *في مجموعة:* ${message.chat.name}\n` : `💬 *خاصة*\n`) +
                      `⏰ *الوقت:* ${time}\n` +
                      `📁 *نوع المرفق:* ${message.type}\n\n` +
                      `⏳ جاري إعادة إرسال المحتوى السري...`;
      
      await client.sendText(myNumber, details);

      try {
        const decryptedMedia = await client.decryptMedia(message);
        await client.sendImage(myNumber, decryptedMedia, 'view_once.jpg', 'مرفق العرض لمرة واحدة');
      } catch (err) {
        await client.sendText(myNumber, `❌ فشل استخراج المرفق: \n\n${message.body || message.caption}`);
      }
    }
  });

  // 2. مراقبة الرسائل المحذوفة (Anti-Delete)
  client.onMessageRevoked(async (revokedMessage) => {
    const originalMsg = revokedMessage.message;
    if (!originalMsg) return;

    const timeDeleted = new Date().toLocaleString('ar-EG');
    const timeSent = new Date(originalMsg.timestamp * 1000).toLocaleString('ar-EG');

    let report = `🗑️ *تنبيه: تم حذف رسالة* 🗑️\n\n` +
                 `👤 *المرسل:* ${originalMsg.sender.pushname || 'غير معروف'}\n` +
                 `📞 *الرقم:* ${originalMsg.from.split('@')[0]}\n` +
                 (originalMsg.isGroupMsg ? `👥 *في مجموعة:* ${originalMsg.chat.name}\n` : `💬 *خاصة*\n`) +
                 `📤 *وقت الإرسال:* ${timeSent}\n` +
                 `🗑️ *وقت الحذف:* ${timeDeleted}\n` +
                 `🔽 *المحتوى المحذوف:* 🔽\n------------------------\n`;

    if (originalMsg.type === 'chat') {
      report += `${originalMsg.body}`;
      await client.sendText(myNumber, report);
    } else {
      report += `[مرفق وسائط: ${originalMsg.type}] - ${originalMsg.caption || ''}`;
      await client.sendText(myNumber, report);
      try {
        const decryptedMedia = await client.decryptMedia(originalMsg);
        await client.sendImage(myNumber, decryptedMedia, 'deleted.jpg', 'المرفق المحذوف');
      } catch (e) {
        await client.sendText(myNumber, `❌ تعذر استرجاع ملف الوسائط المحذوف.`);
      }
    }
  });
}
