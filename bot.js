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
  console.log('✅ تم تشغيل البوت بنجاح! جاري مراقبة الرسائل...');

  let myNumber;
  client.getMe().then(me => {
    myNumber = me.id;
  });

  client.onMessage(async (message) => {
    if (message.isViewOnce) {
      const time = new Date(message.timestamp * 1000).toLocaleString('ar-EG');
      const details = `⚠️ *تنبيه: رسالة عرض لمرة واحدة* ⚠️\n\n👤 *المرسل:* ${message.sender.pushname || 'غير معروف'}\n📞 *الرقم:* ${message.from.split('@')[0]}\n⏰ *الوقت:* ${time}\n\n⏳ جاري استخراج المحتوى...`;
      await client.sendText(myNumber, details);
      
      try {
        const decryptedMedia = await client.decryptMedia(message);
        await client.sendImage(myNumber, decryptedMedia, 'view_once.jpg', 'مرفق العرض لمرة واحدة');
      } catch (err) {
        await client.sendText(myNumber, `❌ فشل استخراج المرفق.`);
      }
    }
  });

  client.onMessageRevoked(async (revokedMessage) => {
    const originalMsg = revokedMessage.message;
    if (!originalMsg) return;

    const report = `🗑️ *تم حذف رسالة*\n👤 *المرسل:* ${originalMsg.sender.pushname || 'غير معروف'}\n`;
    await client.sendText(myNumber, report);
  });
}

